/*
 * Gindi Innovations — form backend (Cloudflare Worker).
 *
 * Runs only for /api/* (wrangler.jsonc: assets.run_worker_first); every other
 * request is served straight from the static files in dist/, as before.
 *
 * POST /api/contact — the quotation form, the Contact page form and the
 * enquiry drawer (static/js/form-backend.js sends them):
 *   1. same-origin JSON only, size-limited; a filled honeypot is accepted
 *      silently and dropped;
 *   2. Cloudflare Turnstile token verified with the secret key;
 *   3. fields validated (the same rules as the forms);
 *   4. Resend emails the studio every detail (reply-to: the client, a WhatsApp
 *      link when the client prefers WhatsApp);
 *   5. Resend emails the client a confirmation, when they gave an email.
 *      While MAIL_FROM is Resend's test sender (@resend.dev), which can only
 *      deliver to the Resend account's own address, the confirmation goes to
 *      CONTACT_TO_EMAIL instead, marked [TEST].
 *
 * Settings (never in the repository; see docs/deployment-cloudflare.md):
 *   secrets  RESEND_API_KEY, TURNSTILE_SECRET_KEY, CONTACT_TO_EMAIL
 *   vars     MAIL_FROM, DEFAULT_COUNTRY_CODE, TIME_ZONE (wrangler.jsonc)
 */

const MAX_BODY = 32 * 1024;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const FORMS = ['quote', 'contact', 'enquiry'];
const METHODS = ['whatsapp', 'phone', 'email'];
const LIMITS = { name: 120, phone: 40, email: 254, message: 5000, page: 300, label: 100, value: 1000, rows: 25 };

// The emails' own words. The form details arrive with the labels the visitor saw.
const T = {
  en: {
    kinds: { quote: 'Quotation request', contact: 'Project enquiry', enquiry: 'Service enquiry' },
    methods: { whatsapp: 'WhatsApp', phone: 'Phone Call', email: 'Email' },
    name: 'Full name', phone: 'Mobile / WhatsApp', email: 'Email address', contact: 'Preferred contact method',
    message: 'Message',
    confirm_subject: 'We received your request — Gindi Innovations',
    hello: 'Hello {name},',
    thanks: 'Thank you for contacting Gindi Innovations. We have received your {kind} and our team will get back to you soon.',
    reply_by: 'We will contact you by {method}.',
    summary: 'Your request',
    signoff: 'Gindi Innovations',
    auto: 'This is an automatic confirmation. You can reply to this email if you need to add anything.',
    wa_greeting: 'Hello {name}, this is Gindi Innovations about your {kind}.',
  },
  ar: {
    kinds: { quote: 'طلب عرض السعر', contact: 'استفسارك عن المشروع', enquiry: 'استفسارك' },
    methods: { whatsapp: 'واتساب', phone: 'مكالمة هاتفية', email: 'البريد الإلكتروني' },
    name: 'الاسم الكامل', phone: 'رقم الموبايل / واتساب', email: 'البريد الإلكتروني', contact: 'وسيلة التواصل المفضّلة',
    message: 'الرسالة',
    confirm_subject: 'استلمنا طلبك — Gindi Innovations',
    hello: 'مرحبًا {name}،',
    thanks: 'شكرًا لتواصلك مع Gindi Innovations. استلمنا {kind} وسيتواصل معك فريقنا قريبًا.',
    reply_by: 'سنتواصل معك عبر {method}.',
    summary: 'تفاصيل طلبك',
    signoff: 'Gindi Innovations',
    auto: 'هذه رسالة تأكيد تلقائية. يمكنك الرد على هذه الرسالة إذا أردت إضافة أي تفاصيل.',
    wa_greeting: 'مرحبًا {name}، معك Gindi Innovations بخصوص {kind}.',
  },
};

class Problem extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Robots-Tag': 'noindex',
    },
  });
}

/* ---------- Values ---------- */

// Arabic-Indic and Persian digits to Western, as the forms do.
function westernDigits(text) {
  return text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

function str(value, max) {
  if (value == null) return '';
  if (typeof value !== 'string') throw new Problem(400, 'invalid');
  const text = value.replace(/\r\n?/g, '\n').trim();
  if (text.length > max) throw new Problem(400, 'invalid');
  return text;
}

// One line, for subjects and table labels.
function line(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

// "your quotation request" (the kinds are written for subjects: "Quotation request — …").
function midSentence(lang, form) {
  const kind = T[lang].kinds[form];
  return lang === 'en' ? kind.toLowerCase() : kind;
}

function fill(template, values) {
  return template.replace(/\{(\w+)\}/g, (_, key) => values[key] ?? '');
}

// International digits for wa.me: "+20 10…" and "0020 10…" as given; a local
// "010…" gets DEFAULT_COUNTRY_CODE in place of its leading 0.
function whatsappNumber(phone, countryCode) {
  const text = westernDigits(phone).trim();
  const digits = text.replace(/\D/g, '');
  if (text.startsWith('+')) return digits;
  if (digits.startsWith('00')) return digits.slice(2);
  if (countryCode && /^0[1-9]/.test(digits)) return countryCode + digits.slice(1);
  return digits;
}

/* ---------- Checks ---------- */

function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Problem(400, 'invalid');
  const form = data.form;
  if (!FORMS.includes(form)) throw new Problem(400, 'invalid');
  const lang = data.lang === 'ar' ? 'ar' : 'en';
  const enquiry = form === 'enquiry';

  const name = line(str(data.name, LIMITS.name));
  const phone = str(data.phone, LIMITS.phone);
  const email = str(data.email, LIMITS.email);
  const message = str(data.message, LIMITS.message);
  const page = line(str(data.page, LIMITS.page));
  // The enquiry drawer asks for an email and has no contact choice.
  const contact = enquiry ? 'email' : data.contact;

  const fields = [];
  if (!name) fields.push('name');
  if (phone || !enquiry) {
    const digits = westernDigits(phone).replace(/\D/g, '');
    if (!/^\+?[\d\s().\-]+$/.test(westernDigits(phone)) || digits.length < 8 || digits.length > 15) fields.push('phone');
  }
  if (!METHODS.includes(contact)) fields.push('contact');
  if (email ? !EMAIL.test(email) : contact === 'email') fields.push('email');
  if (enquiry && !message) fields.push('message');

  const rows = [];
  if (data.details != null) {
    if (!Array.isArray(data.details) || data.details.length > LIMITS.rows) throw new Problem(400, 'invalid');
    for (const row of data.details) {
      if (!Array.isArray(row) || row.length !== 2) throw new Problem(400, 'invalid');
      const label = line(str(row[0], LIMITS.label));
      const value = str(row[1], LIMITS.value);
      if (label && value) rows.push([label, value]);
    }
  }

  if (fields.length) {
    const problem = new Problem(422, 'fields');
    problem.fields = fields;
    throw problem;
  }
  const id = typeof data.id === 'string' && /^[A-Za-z0-9-]{8,64}$/.test(data.id) ? data.id : '';
  return { form, lang, name, phone, email, contact, message, page, rows, id };
}

async function verifyTurnstile(env, token, ip) {
  if (typeof token !== 'string' || !token || token.length > 2048) throw new Problem(403, 'verify');
  const body = new FormData();
  body.append('secret', env.TURNSTILE_SECRET_KEY);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  let result;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    result = await response.json();
  } catch (err) {
    console.error('turnstile: request failed', String(err));
    throw new Problem(502, 'unavailable');
  }
  if (!result.success) {
    console.warn('turnstile: rejected', JSON.stringify(result['error-codes'] || []));
    throw new Problem(403, 'verify');
  }
}

/* ---------- Emails ---------- */

function table(rows, rtl) {
  const align = rtl ? 'right' : 'left';
  return '<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px">' +
    rows.map(([label, value]) => (
      `<tr><td style="padding:8px 12px;border-bottom:1px solid #e6e0d6;color:#5b6475;width:38%;vertical-align:top;text-align:${align}">${escapeHtml(label)}</td>` +
      `<td style="padding:8px 12px;border-bottom:1px solid #e6e0d6;color:#1c2c4a;vertical-align:top;text-align:${align};white-space:pre-wrap">${value.html ?? escapeHtml(value)}</td></tr>`
    )).join('') +
    '</table>';
}

function layout(lang, inner) {
  const rtl = lang === 'ar';
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"></head>` +
    '<body style="margin:0;padding:24px;background:#f4f1ec;font-family:Arial,Helvetica,sans-serif;color:#1c2c4a">' +
    `<div style="max-width:640px;margin:0 auto;background:#ffffff;border-top:4px solid #c8892b;padding:24px;text-align:${rtl ? 'right' : 'left'}">` +
    inner + '</div></body></html>';
}

function textRows(rows) {
  return rows.map(([label, value]) => `${label}: ${value.text ?? value}`).join('\n');
}

function link(href, text) {
  return { html: `<a href="${escapeHtml(href)}" style="color:#c8892b">${escapeHtml(text)}</a>`, text: `${text} (${href})` };
}

function studioEmail(s, env, now) {
  const en = T.en;
  const kind = en.kinds[s.form];
  const lines = [[en.name, s.name]];
  if (s.phone) {
    const wa = whatsappNumber(s.phone, env.DEFAULT_COUNTRY_CODE || '');
    lines.push([en.phone, link(`tel:+${wa}`, s.phone)]);
    if (s.contact === 'whatsapp') {
      const greeting = fill(T[s.lang].wa_greeting, { name: s.name, kind: midSentence(s.lang, s.form) });
      lines.push(['WhatsApp', link(`https://wa.me/${wa}?text=${encodeURIComponent(greeting)}`, 'Chat on WhatsApp')]);
    }
  }
  if (s.email) lines.push([en.email, link(`mailto:${s.email}`, s.email)]);
  lines.push([en.contact, en.methods[s.contact]]);
  const details = s.rows.slice();
  if (s.message) details.push([en.message, s.message]);
  const meta = [
    ['Language', s.lang === 'ar' ? 'Arabic' : 'English'],
    ['Page', s.page || '—'],
    ['Received', now],
  ];

  const heading = `New ${kind.toLowerCase()} from ${s.name}`;
  const html = layout('en',
    `<h1 style="font-size:20px;margin:0 0 4px">${escapeHtml(heading)}</h1>` +
    `<p style="margin:0 0 20px;color:#5b6475">Preferred contact: <strong>${escapeHtml(en.methods[s.contact])}</strong></p>` +
    '<h2 style="font-size:15px;margin:0 0 8px;color:#c8892b">Client</h2>' + table(lines, false) +
    (details.length ? '<h2 style="font-size:15px;margin:20px 0 8px;color:#c8892b">Details (as entered)</h2>' +
      `<div dir="${s.lang === 'ar' ? 'rtl' : 'ltr'}">${table(details, s.lang === 'ar')}</div>` : '') +
    '<h2 style="font-size:15px;margin:20px 0 8px;color:#c8892b">Submission</h2>' + table(meta, false));
  const text = [heading, '', textRows(lines), '', textRows(details), '', textRows(meta)].join('\n');
  return { subject: line(`${kind} — ${s.name}`), html, text };
}

function confirmationEmail(s) {
  const t = T[s.lang];
  const rtl = s.lang === 'ar';
  const kind = midSentence(s.lang, s.form);
  const lines = [[t.name, s.name]];
  if (s.phone) lines.push([t.phone, s.phone]);
  if (s.email) lines.push([t.email, s.email]);
  if (s.form !== 'enquiry') lines.push([t.contact, t.methods[s.contact]]);
  const all = lines.concat(s.rows);
  if (s.message) all.push([t.message, s.message]);

  const hello = fill(t.hello, { name: s.name });
  const thanks = fill(t.thanks, { kind });
  const replyBy = s.form === 'enquiry' ? '' : fill(t.reply_by, { method: t.methods[s.contact] });
  const p = 'margin:0 0 12px;line-height:1.6';
  const html = layout(s.lang,
    `<p style="${p}">${escapeHtml(hello)}</p><p style="${p}">${escapeHtml(thanks)}</p>` +
    (replyBy ? `<p style="${p}">${escapeHtml(replyBy)}</p>` : '') +
    `<h2 style="font-size:15px;margin:20px 0 8px;color:#c8892b">${escapeHtml(t.summary)}</h2>` + table(all, rtl) +
    `<p style="margin:24px 0 4px;font-weight:bold">${escapeHtml(t.signoff)}</p>` +
    `<p style="margin:0;color:#5b6475;font-size:13px">${escapeHtml(t.auto)}</p>`);
  const text = [hello, '', thanks, replyBy, '', `${t.summary}:`, textRows(all), '', t.signoff, t.auto]
    .filter((part, i, list) => part !== '' || list[i - 1] !== '').join('\n');
  return { subject: t.confirm_subject, html, text };
}

async function sendEmail(env, email, idempotencyKey) {
  const headers = { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' };
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers, body: JSON.stringify(email) });
  if (!response.ok) {
    // Resend's error (no secrets in it): visible in the Worker's logs.
    console.error('resend: send failed', response.status, (await response.text()).slice(0, 500));
    throw new Problem(502, 'unavailable');
  }
}

/* ---------- The endpoint ---------- */

async function handleContact(request, env, ctx) {
  if (request.method !== 'POST') {
    return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
  }
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !EMAIL.test(env.CONTACT_TO_EMAIL || '')) {
    console.error('config: RESEND_API_KEY, TURNSTILE_SECRET_KEY and CONTACT_TO_EMAIL must all be set');
    throw new Problem(503, 'unavailable');
  }
  // Only the site's own pages (same scheme and host) may post.
  const origin = request.headers.get('Origin');
  if (!origin || origin !== new URL(request.url).origin) throw new Problem(403, 'origin');
  if (!(request.headers.get('Content-Type') || '').startsWith('application/json')) throw new Problem(415, 'invalid');
  if (Number(request.headers.get('Content-Length') || 0) > MAX_BODY) throw new Problem(413, 'invalid');

  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new Problem(413, 'invalid');
  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Problem(400, 'invalid');
  }
  // Honeypot filled: almost certainly a bot. Look successful, send nothing.
  if (data && typeof data.website === 'string' && data.website.trim()) return json(200, { ok: true });

  await verifyTurnstile(env, data && data.token, request.headers.get('CF-Connecting-IP'));
  const s = validate(data);

  const to = env.CONTACT_TO_EMAIL;
  const from = env.MAIL_FROM || 'Gindi Innovations <onboarding@resend.dev>';
  const timeZone = env.TIME_ZONE || 'Africa/Cairo';
  const now = `${new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date())} (${timeZone})`;

  // 1. The studio (must succeed).
  const studio = studioEmail(s, env, now);
  await sendEmail(env, {
    from, to: [to], subject: studio.subject, html: studio.html, text: studio.text,
    ...(s.email ? { reply_to: s.email } : {}),
  }, s.id && `studio-${s.id}`);

  // 2. The client's confirmation (best effort: the studio already has the request).
  let confirmed = false;
  if (s.email) {
    const testing = /@resend\.dev>?\s*$/i.test(from);
    const confirm = confirmationEmail(s);
    try {
      await sendEmail(env, {
        from,
        to: [testing ? to : s.email],
        subject: testing ? line(`[TEST — for ${s.email}] ${confirm.subject}`) : confirm.subject,
        html: confirm.html, text: confirm.text, reply_to: to,
      }, s.id && `client-${s.id}`);
      confirmed = true;
    } catch (err) {
      console.error('confirmation not sent', String(err && err.code || err));
    }
  }
  return json(200, { ok: true, confirmed });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/contact' || url.pathname === '/api/contact/') return await handleContact(request, env, ctx);
      return json(404, { ok: false, error: 'not_found' });
    } catch (err) {
      if (err instanceof Problem) {
        return json(err.status, { ok: false, error: err.code, ...(err.fields ? { fields: err.fields } : {}) });
      }
      console.error('unexpected', err && err.stack || String(err));
      return json(500, { ok: false, error: 'unavailable' });
    }
  },
};

// For the unit tests (worker/index.test.mjs).
export { validate, whatsappNumber, studioEmail, confirmationEmail };
