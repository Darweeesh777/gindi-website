// Unit tests for the form backend: node --test worker/
// Turnstile and Resend are mocked; nothing is sent.
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import worker, { whatsappNumber } from './index.js';

const ORIGIN = 'https://gindi.example';
const ENV = {
  RESEND_API_KEY: 're_test',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
  CONTACT_TO_EMAIL: 'studio@example.com',
  MAIL_FROM: 'Gindi Innovations <onboarding@resend.dev>',
  DEFAULT_COUNTRY_CODE: '20',
  TIME_ZONE: 'Africa/Cairo',
};
const QUOTE = {
  form: 'quote', lang: 'en', id: 'abcdef12-3456', token: 'tok', website: '',
  name: 'Mona Adel', phone: '010 1234 5678', email: 'mona@example.com', contact: 'whatsapp', message: '',
  page: '/contact/', details: [['Project type', 'Residential'], ['Approximate area', '120 m²']],
};

const realFetch = globalThis.fetch;
let calls;

function mock({ turnstile = true, resend = [200, 200] } = {}) {
  calls = [];
  const statuses = resend.slice();
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).includes('turnstile')) return Response.json({ success: turnstile, 'error-codes': [] });
    const status = statuses.shift() ?? 200;
    return new Response(JSON.stringify(status === 200 ? { id: 'email-id' } : { message: 'nope' }), { status });
  };
}

afterEach(() => { globalThis.fetch = realFetch; });

function post(body, { origin = ORIGIN, type = 'application/json', path = '/api/contact' } = {}) {
  const headers = { 'Content-Type': type, 'CF-Connecting-IP': '203.0.113.5' };
  if (origin) headers.Origin = origin;
  return new Request(ORIGIN + path, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });
}

async function run(request, env = ENV) {
  const response = await worker.fetch(request, env, { waitUntil() {} });
  return { status: response.status, body: await response.json().catch(() => null) };
}

const emails = () => calls.filter((c) => c.url.includes('resend')).map((c) => ({
  ...JSON.parse(c.init.body), key: c.init.headers['Idempotency-Key'], auth: c.init.headers.Authorization,
}));

test('only /api/contact, only POST', async () => {
  mock();
  assert.equal((await run(new Request(ORIGIN + '/api/other'))).status, 404);
  const get = await worker.fetch(new Request(ORIGIN + '/api/contact'), ENV, {});
  assert.equal(get.status, 405);
  assert.equal(calls.length, 0);
});

test('refuses to run without its secrets', async () => {
  mock();
  const { status } = await run(post(QUOTE), { ...ENV, RESEND_API_KEY: '' });
  assert.equal(status, 503);
  assert.equal(calls.length, 0);
});

test('other sites, other content types and big bodies are refused', async () => {
  mock();
  assert.equal((await run(post(QUOTE, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await run(post(QUOTE, { origin: null }))).status, 403);
  assert.equal((await run(post(QUOTE, { type: 'text/plain' }))).status, 415);
  assert.equal((await run(post({ ...QUOTE, message: 'x'.repeat(40000) }))).status, 413);
  assert.equal((await run(post('{not json'))).status, 400);
  assert.equal(calls.length, 0);
});

test('honeypot: looks fine, sends nothing', async () => {
  mock();
  const { status, body } = await run(post({ ...QUOTE, website: 'http://spam' }));
  assert.equal(status, 200);
  assert.equal(body.ok, true);
  assert.equal(calls.length, 0);
});

test('a failed or missing Turnstile check sends nothing', async () => {
  mock({ turnstile: false });
  let result = await run(post(QUOTE));
  assert.deepEqual([result.status, result.body.error], [403, 'verify']);
  mock();
  result = await run(post({ ...QUOTE, token: '' }));
  assert.equal(result.status, 403);
  assert.equal(calls.length, 0);
});

test('Turnstile gets the secret, the token and the visitor IP', async () => {
  mock();
  await run(post(QUOTE));
  const form = calls[0].init.body;
  assert.equal(form.get('secret'), 'turnstile-secret');
  assert.equal(form.get('response'), 'tok');
  assert.equal(form.get('remoteip'), '203.0.113.5');
});

test('invalid fields are named, nothing is emailed', async () => {
  mock();
  const { status, body } = await run(post({ ...QUOTE, name: ' ', phone: '12', contact: 'email', email: '' }));
  assert.equal(status, 422);
  assert.deepEqual(body.fields, ['name', 'phone', 'email']);
  assert.equal(emails().length, 0);
});

test('a quotation request: studio email with WhatsApp link, test-mode confirmation', async () => {
  mock();
  const { status, body } = await run(post(QUOTE));
  assert.equal(status, 200);
  assert.deepEqual(body, { ok: true, confirmed: true });
  const [studio, client] = emails();
  assert.equal(studio.auth, 'Bearer re_test');
  assert.deepEqual(studio.to, ['studio@example.com']);
  assert.equal(studio.reply_to, 'mona@example.com');
  assert.equal(studio.subject, 'Quotation request — Mona Adel');
  assert.match(studio.html, /https:\/\/wa\.me\/201012345678\?text=/);
  assert.match(studio.html, /Residential/);
  assert.match(studio.text, /Chat on WhatsApp \(https:\/\/wa\.me\/201012345678/);
  assert.equal(studio.key, 'studio-abcdef12-3456');
  // Resend's test sender only reaches the account owner: the confirmation goes to the studio, marked.
  assert.deepEqual(client.to, ['studio@example.com']);
  assert.equal(client.subject, '[TEST — for mona@example.com] We received your request — Gindi Innovations');
  assert.equal(client.reply_to, 'studio@example.com');
  assert.match(client.html, /Hello Mona Adel/);
  assert.match(client.html, /by WhatsApp/);
  assert.equal(client.key, 'client-abcdef12-3456');
});

test('with a verified domain the confirmation goes to the client', async () => {
  mock();
  await run(post(QUOTE), { ...ENV, MAIL_FROM: 'Gindi Innovations <hello@gindi.example>' });
  const [, client] = emails();
  assert.deepEqual(client.to, ['mona@example.com']);
  assert.equal(client.subject, 'We received your request — Gindi Innovations');
});

test('no email given: no confirmation, no WhatsApp link unless preferred', async () => {
  mock();
  const { body } = await run(post({ ...QUOTE, email: '', contact: 'phone' }));
  assert.deepEqual(body, { ok: true, confirmed: false });
  const sent = emails();
  assert.equal(sent.length, 1);
  assert.equal(sent[0].reply_to, undefined);
  assert.doesNotMatch(sent[0].html, /wa\.me/);
  assert.match(sent[0].html, /tel:\+201012345678/);
});

test('Arabic: the confirmation is in Arabic, right to left', async () => {
  mock();
  await run(post({ ...QUOTE, lang: 'ar', name: 'منى عادل', phone: '٠١٠١٢٣٤٥٦٧٨', form: 'contact' }));
  const [studio, client] = emails();
  assert.match(studio.html, /wa\.me\/201012345678/);
  assert.match(client.subject, /استلمنا طلبك/);
  assert.match(client.html, /dir="rtl"/);
  assert.match(client.html, /مرحبًا منى عادل/);
});

test('the enquiry drawer: email required, phone optional', async () => {
  mock();
  let result = await run(post({ form: 'enquiry', token: 'tok', name: 'Sam', email: '', message: 'Hi' }));
  assert.deepEqual(result.body.fields, ['email']);
  result = await run(post({ form: 'enquiry', token: 'tok', name: 'Sam', email: 'sam@example.com', message: '', details: [['Service', 'Fit-out']] }));
  assert.deepEqual(result.body.fields, ['message']);
  mock();
  result = await run(post({ form: 'enquiry', token: 'tok', name: 'Sam', email: 'sam@example.com', message: 'Hi', details: [['Service', 'Fit-out']] }));
  assert.equal(result.status, 200);
  const [studio] = emails();
  assert.equal(studio.subject, 'Service enquiry — Sam');
  assert.match(studio.html, /Fit-out/);
});

test('everything the visitor typed is escaped', async () => {
  mock();
  await run(post({ ...QUOTE, name: '<img src=x onerror=alert(1)>', details: [['<b>x</b>', '"><script>alert(1)</script>']] }));
  for (const email of emails()) {
    assert.doesNotMatch(email.html, /<script>|<img src=x|<b>x<\/b>/);
    assert.match(email.html, /&lt;script&gt;/);
  }
});

test('the studio email failing is an error; the confirmation failing is not', async () => {
  mock({ resend: [500] });
  let result = await run(post(QUOTE));
  assert.deepEqual([result.status, result.body.error], [502, 'unavailable']);
  assert.equal(emails().length, 1);
  mock({ resend: [200, 422] });
  result = await run(post(QUOTE));
  assert.deepEqual([result.status, result.body], [200, { ok: true, confirmed: false }]);
});

test('WhatsApp numbers in international form', () => {
  assert.equal(whatsappNumber('+20 101 234 5678', '20'), '201012345678');
  assert.equal(whatsappNumber('00971 50 123 4567', '20'), '971501234567');
  assert.equal(whatsappNumber('010-1234-5678', '20'), '201012345678');
  assert.equal(whatsappNumber('٠١٠١٢٣٤٥٦٧٨', '20'), '201012345678');
  assert.equal(whatsappNumber('201012345678', '20'), '201012345678');
});
