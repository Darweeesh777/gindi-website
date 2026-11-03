// Unit tests for the calculators' records and dashboard: node --test worker/
// Turnstile is mocked; the database is a real SQLite one, in memory, behind D1's calls.
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, beforeEach, test } from 'node:test';

import worker from './index.js';

const ORIGIN = 'https://gindi.example';
const PASSWORD = 'a-long-test-password';

function fakeD1() {
  const sqlite = new DatabaseSync(':memory:');
  const statement = (sql, args = []) => ({
    bind: (...values) => statement(sql, values),
    run: async () => { sqlite.prepare(sql).run(...args); return { success: true }; },
    all: async () => ({ results: sqlite.prepare(sql).all(...args) }),
    first: async () => sqlite.prepare(sql).get(...args) ?? null,
  });
  return { prepare: (sql) => statement(sql), batch: async (list) => Promise.all(list.map((s) => s.run())), sqlite };
}

const realFetch = globalThis.fetch;
let env, emails, resendStatus, turnstile;

beforeEach(() => {
  env = { DB: fakeD1(), TURNSTILE_SECRET_KEY: 'secret', RESEND_API_KEY: 're_test', CONTACT_TO_EMAIL: 'studio@example.com',
          MAIL_FROM: 'Gindi Innovations <requests@gindi.example>', DASHBOARD_PASSWORD: PASSWORD, DEFAULT_COUNTRY_CODE: '20', TIME_ZONE: 'Africa/Cairo' };
  emails = [];
  resendStatus = 200;
  turnstile = true;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('resend')) {
      emails.push({ ...JSON.parse(init.body), key: init.headers['Idempotency-Key'] });
      return new Response('{}', { status: resendStatus });
    }
    return Response.json({ success: turnstile, 'error-codes': [] });
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

function send(body, { origin = ORIGIN } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (origin) headers.Origin = origin;
  return worker.fetch(new Request(`${ORIGIN}/api/contact`, { method: 'POST', headers, body: JSON.stringify(body) }), env, {});
}

const LEAD = { form: 'calculator', tool: 'gypsum', lang: 'ar', token: 'tok', website: '', id: 'abcdef12-1111', page: '/ar/free-tools/gypsum/', name: 'منى عادل', phone: '٠١٠١٢٣٤٥٦٧٨' };
const CLICK = { form: 'click', tool: 'bricks', lang: 'en', token: 'tok', website: '', id: 'abcdef12-2222', page: '/free-tools/bricks/' };

const rows = () => env.DB.sqlite.prepare('SELECT * FROM calculator_events ORDER BY id').all();

async function signIn(password = PASSWORD, ip = '203.0.113.5') {
  const response = await worker.fetch(new Request(`${ORIGIN}/dashboard/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: ORIGIN, 'CF-Connecting-IP': ip },
    body: new URLSearchParams({ password }),
  }), env, {});
  return response;
}

async function session() {
  const response = await signIn();
  return response.headers.get('Set-Cookie').split(';')[0];
}

const get = (path, cookie) => worker.fetch(new Request(ORIGIN + path, { headers: cookie ? { Cookie: cookie } : {} }), env, {});

test('a contact is emailed through Resend, and saved when there is a database', async () => {
  const response = await send(LEAD);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, confirmed: false });
  assert.equal(emails.length, 1);
  const [email] = emails;
  assert.deepEqual(email.to, ['studio@example.com']);
  assert.equal(email.from, 'Gindi Innovations <requests@gindi.example>');
  assert.equal(email.subject, 'Calculator lead — منى عادل');
  assert.equal(email.key, 'studio-abcdef12-1111');
  assert.equal(email.reply_to, undefined);
  assert.match(email.html, /tel:\+201012345678/);
  assert.match(email.html, /https:\/\/wa\.me\/201012345678/);
  assert.match(email.text, /Calculator: gypsum/);
  assert.match(email.text, /Language: Arabic/);
  assert.match(email.text, /Page: \/ar\/free-tools\/gypsum\//);
  const [row] = rows();
  assert.equal(row.kind, 'lead');
  assert.equal(row.tool, 'gypsum');
  assert.equal(row.name, 'منى عادل');
  assert.equal(row.phone, '01012345678');
  assert.equal(row.wa, '201012345678');
  assert.equal(row.lang, 'ar');
  assert.match(row.day, /^\d{4}-\d{2}-\d{2}$/);
});

test('without a database: a contact and a click are both emailed, and nothing else is needed', async () => {
  delete env.DB;
  assert.equal((await send(LEAD)).status, 200);
  const hostile = { ...CLICK, name: 'Sam', phone: '01012345678', email: 'x@example.com', message: 'hi' };
  assert.equal((await send(hostile)).status, 200);
  assert.deepEqual(emails.map((e) => e.subject), ['Calculator lead — منى عادل', 'Calculator click — bricks']);
  const click = emails[1];
  assert.deepEqual(click.to, ['studio@example.com']);
  assert.equal(click.key, 'studio-abcdef12-2222');
  assert.match(click.text, /Calculator: bricks/);
  assert.doesNotMatch(click.html + click.text, /Sam|01012345678|x@example|hi\b/);
});

test('whatever a contact form carries, nobody but the studio is ever emailed', async () => {
  delete env.DB;
  await send({ ...LEAD, email: 'victim@example.com', message: 'spam' });
  assert.equal(emails.length, 1);
  assert.deepEqual(emails[0].to, ['studio@example.com']);
  assert.doesNotMatch(emails[0].html, /victim|spam/);
});

test('names in the email are escaped', async () => {
  await send({ ...LEAD, name: '<img src=x onerror=alert(1)>' });
  assert.doesNotMatch(emails[0].html, /<img src=x/);
  assert.match(emails[0].html, /&lt;img/);
});

test('Resend failing is an error for a contact, so the visitor can retry, and nothing is saved', async () => {
  resendStatus = 500;
  const response = await send(LEAD);
  assert.equal(response.status, 502);
  env.DB.sqlite.exec('CREATE TABLE IF NOT EXISTS calculator_events (id TEXT)');
  assert.equal(rows().length, 0);
});

test('Resend not configured: the form fails plainly', async () => {
  delete env.RESEND_API_KEY;
  assert.equal((await send(LEAD)).status, 503);
  assert.equal(emails.length, 0);
});

test('with a database, a click is saved instead of emailed, with nothing about who', async () => {
  const response = await send({ ...CLICK, name: 'Sam', phone: '01012345678', email: 'x@example.com', message: 'hi' });
  assert.equal(response.status, 200);
  assert.equal(emails.length, 0);
  const [row] = rows();
  assert.equal(row.kind, 'click');
  assert.equal(row.tool, 'bricks');
  assert.equal(row.name, null);
  assert.equal(row.phone, null);
  assert.equal(row.wa, null);
});

test('the same id twice is one record', async () => {
  await send(LEAD);
  assert.equal((await send(LEAD)).status, 200);
  assert.equal(rows().length, 1);
});

test('a contact needs a name and a real number', async () => {
  let response = await send({ ...LEAD, name: ' ', phone: '12' });
  assert.equal(response.status, 422);
  assert.deepEqual((await response.json()).fields, ['name', 'phone']);
  response = await send({ ...LEAD, phone: '' });
  assert.deepEqual((await response.json()).fields, ['phone']);
  env.DB.sqlite.exec('CREATE TABLE IF NOT EXISTS calculator_events (id TEXT)');
  assert.equal(rows().length, 0);
});

test('a calculator name must be a plain slug', async () => {
  for (const tool of [undefined, '', '<b>x</b>', 'A B', 'x'.repeat(41), 7]) {
    assert.equal((await send({ ...CLICK, tool })).status, 400);
  }
});

test('the same protections as the other forms: origin, Turnstile, honeypot', async () => {
  assert.equal((await send(LEAD, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await send(LEAD, { origin: null })).status, 403);
  turnstile = false;
  assert.equal((await send(LEAD)).status, 403);
  turnstile = true;
  assert.equal((await send({ ...LEAD, token: '' })).status, 403);
  assert.equal((await send({ ...LEAD, website: 'http://spam' })).status, 200);
  env.DB.sqlite.exec('CREATE TABLE IF NOT EXISTS calculator_events (id TEXT)');
  assert.equal(rows().length, 0);
});

test('the other forms still work without a database', async () => {
  delete env.DB;
  assert.equal((await send({ form: 'enquiry', token: 'tok', name: 'Sam', email: 'sam@example.com', message: 'Hi' })).status, 200);
  assert.equal(emails.length, 2); // the request and its confirmation
});

test('a database failure: a contact is still emailed; a click is an error', async () => {
  env.DB.prepare = () => { throw new Error('D1 down'); };
  assert.equal((await send(LEAD)).status, 200);
  assert.equal(emails.length, 1);
  assert.equal((await send(CLICK)).status, 502);
  assert.equal(emails.length, 1);
});

test('nothing of the dashboard without signing in', async () => {
  await send(LEAD);
  const page = await get('/dashboard');
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.match(html, /type="password"/);
  assert.doesNotMatch(html, /منى|01012345678/);
  assert.equal((await get('/dashboard/data')).status, 401);
  assert.equal((await get('/dashboard/leads.csv')).status, 401);
  assert.equal((await get('/dashboard/data', 'gindi_dash=9999999999.abcd')).status, 401);
  assert.equal((await get('/dashboard/data', 'gindi_dash=nonsense')).status, 401);
});

test('a wrong password gives no session; the right one gives a safe cookie', async () => {
  let response = await signIn('wrong');
  assert.equal(response.status, 401);
  assert.equal(response.headers.get('Set-Cookie'), null);
  response = await signIn();
  assert.equal(response.status, 303);
  const cookie = response.headers.get('Set-Cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /Path=\/dashboard/);
  assert.equal((await get('/dashboard/data', cookie.split(';')[0])).status, 200);
});

test('changing the password ends sessions; an old expiry cannot be reused', async () => {
  const cookie = await session();
  const [, signature] = cookie.split('.');
  assert.equal((await get('/dashboard/data', cookie.replace(/=\d+/, '=9999999999'))).status, 401);
  assert.ok(signature);
  env.DASHBOARD_PASSWORD = 'another-password';
  assert.equal((await get('/dashboard/data', cookie)).status, 401);
});

test('too many wrong passwords block that address only, even with the right one', async () => {
  for (let i = 0; i < 10; i++) await signIn('wrong');
  assert.equal((await signIn()).status, 429);
  assert.equal((await signIn(PASSWORD, '203.0.113.99')).status, 303);
});

test('sign-in from another site is refused', async () => {
  const response = await worker.fetch(new Request(`${ORIGIN}/dashboard/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Origin: 'https://evil.example' }, body: new URLSearchParams({ password: PASSWORD }),
  }), env, {});
  assert.equal(response.status, 403);
});

test('no password or database set: the dashboard says so and shows nothing', async () => {
  delete env.DASHBOARD_PASSWORD;
  assert.equal((await get('/dashboard')).status, 503);
  env.DASHBOARD_PASSWORD = PASSWORD;
  delete env.DB;
  assert.equal((await get('/dashboard/data')).status, 503);
});

test('the figures: totals, by day, by calculator, by language, contacts', async () => {
  await send(LEAD);
  await send(CLICK);
  await send({ ...CLICK, id: 'abcdef12-3333' });
  await send({ ...CLICK, id: 'abcdef12-4444', tool: 'gypsum', lang: 'ar' });
  const old = new Date(Date.now() - 40 * 86400000).toISOString();
  env.DB.sqlite.prepare("INSERT INTO calculator_events (id, kind, tool, lang, day, created_at) VALUES ('old-event', 'click', 'wire', 'en', ?, ?)").run(old.slice(0, 10), old);
  const cookie = await session();
  const data = await (await get('/dashboard/data', cookie)).json();
  assert.equal(data.days, 30);
  assert.deepEqual(data.totals, { leads: 1, clicks: 3 });
  assert.equal(data.byDay.length, 30);
  assert.deepEqual(data.byDay.at(-1), { day: data.to, leads: 1, clicks: 3 });
  assert.deepEqual(data.tools.map((t) => [t.tool, t.leads, t.clicks]), [['bricks', 0, 2], ['gypsum', 1, 1]]);
  assert.deepEqual(data.langs.map((l) => [l.lang, l.leads, l.clicks]).sort(), [['ar', 1, 1], ['en', 0, 2]]);
  assert.equal(data.leads.length, 1);
  assert.equal(data.leads[0].name, 'منى عادل');
  assert.equal(data.leads[0].wa, '201012345678');
  const all = await (await get('/dashboard/data?days=0', cookie)).json();
  assert.deepEqual(all.totals, { leads: 1, clicks: 4 });
  assert.ok(all.byDay.length >= 41);
  // Anything else falls back to the default.
  assert.equal((await (await get('/dashboard/data?days=5000', cookie)).json()).days, 30);
  assert.equal((await (await get('/dashboard/data?days=', cookie)).json()).days, 30);
  assert.equal((await (await get("/dashboard/data?days=7'%20OR%201=1", cookie)).json()).days, 30);
});

test('empty, the figures are still sound', async () => {
  const data = await (await get('/dashboard/data', await session())).json();
  assert.deepEqual(data.totals, { leads: 0, clicks: 0 });
  assert.deepEqual(data.tools, []);
  assert.equal(data.byDay.length, 30);
});

test('the CSV opens safely: Arabic readable, formulas defused, quotes kept', async () => {
  await send(LEAD);
  await send({ ...LEAD, id: 'abcdef12-5555', name: '=HYPERLINK("http://evil","x"),y', phone: '+20 101 234 5678' });
  const response = await get('/dashboard/leads.csv', await session());
  assert.match(response.headers.get('Content-Disposition'), /attachment/);
  const bytes = new Uint8Array(await response.arrayBuffer());
  assert.deepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  const csv = new TextDecoder().decode(bytes);
  assert.match(csv, /منى عادل/);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/evil"",""x""\),y"/);
  assert.match(csv, /'\+20 101 234 5678/);
  assert.doesNotMatch(csv, /,=HYPERLINK/);
});

test('visitors\' text never enters the page itself, and the page is locked down', async () => {
  await send({ ...LEAD, name: '<img src=x onerror=alert(1)>' });
  const page = await get('/dashboard', await session());
  const html = await page.text();
  assert.doesNotMatch(html, /onerror=alert/);
  assert.doesNotMatch(html, /innerHTML/);
  const csp = page.headers.get('Content-Security-Policy');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /script-src 'nonce-[0-9a-f]+'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(page.headers.get('X-Robots-Tag'), 'noindex, nofollow');
  // no-referrer would make browsers send "Origin: null" with the sign-in form, locking everyone out.
  assert.equal((await get('/dashboard')).headers.get('Referrer-Policy'), 'same-origin');
  assert.equal(page.headers.get('Cache-Control'), 'no-store');
  const nonce = csp.match(/nonce-([0-9a-f]+)/)[1];
  assert.ok(html.includes(`<script nonce="${nonce}">`));
});

test('signing out clears the cookie', async () => {
  const response = await worker.fetch(new Request(`${ORIGIN}/dashboard/logout`, { method: 'POST' }), env, {});
  assert.equal(response.status, 303);
  assert.match(response.headers.get('Set-Cookie'), /gindi_dash=;.*Max-Age=0/);
});
