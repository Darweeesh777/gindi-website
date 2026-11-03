/*
 * Gindi Innovations — the free calculators' records and their private dashboard.
 *
 * saveEvent: stores what worker/index.js accepted from a calculator's form: a
 * "lead" (a name and a number) or a "click" (the form was skipped: which
 * calculator, and nothing about who). In the D1 database bound as DB; the tables
 * create themselves on first use.
 *
 * /dashboard is the page; /dashboard/data its figures; /dashboard/leads.csv the
 * contacts as a file; /dashboard/login and /dashboard/logout the password. All
 * but the login page need a session: an HttpOnly cookie signed with
 * DASHBOARD_PASSWORD (a Worker secret), so changing the password ends every session.
 * Names and numbers are only ever placed in the page with textContent.
 */

const COOKIE = 'gindi_dash';
const SESSION_SECONDS = 12 * 60 * 60;
const MAX_FAILURES = 10;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const RANGES = [7, 30, 90, 0]; // days; 0: everything
const LEADS_SHOWN = 500;
const encoder = new TextEncoder();

/* ---------- The tables ---------- */

const ready = new WeakMap();

function schema(db) {
  // Once per database object; a failure is retried by the next request.
  if (!ready.has(db)) {
    ready.set(db, db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS calculator_events (
        id TEXT PRIMARY KEY, kind TEXT NOT NULL, tool TEXT NOT NULL, name TEXT, phone TEXT, wa TEXT,
        lang TEXT NOT NULL, page TEXT, day TEXT NOT NULL, created_at TEXT NOT NULL)`),
      db.prepare('CREATE INDEX IF NOT EXISTS calculator_events_day ON calculator_events (day)'),
      db.prepare('CREATE TABLE IF NOT EXISTS dashboard_login_failures (ip TEXT NOT NULL, at INTEGER NOT NULL)'),
      db.prepare('CREATE INDEX IF NOT EXISTS dashboard_login_failures_at ON dashboard_login_failures (at)'),
    ]).catch((err) => { ready.delete(db); throw err; }));
  }
  return ready.get(db);
}

function dayOf(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

// The same id twice (a retry) is stored once.
export async function saveEvent(env, event) {
  await schema(env.DB);
  const now = new Date();
  await env.DB.prepare(`INSERT OR IGNORE INTO calculator_events
      (id, kind, tool, name, phone, wa, lang, page, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(event.id, event.kind, event.tool, event.name || null, event.phone || null, event.wa || null, event.lang,
      event.page || null, dayOf(now, env.TIME_ZONE || 'Africa/Cairo'), now.toISOString())
    .run();
}

/* ---------- Sessions ---------- */

function hmacKey(password) {
  return crypto.subtle.importKey('raw', encoder.encode(`dashboard:${password}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function unhex(text) {
  return /^([0-9a-f]{2})+$/.test(text) ? Uint8Array.from(text.match(/../g), (h) => parseInt(h, 16)) : new Uint8Array();
}

async function passwordMatches(env, candidate) {
  const key = await hmacKey(env.DASHBOARD_PASSWORD);
  // Signed, then checked with verify: compared in constant time, whatever the length.
  return crypto.subtle.verify('HMAC', key, await crypto.subtle.sign('HMAC', key, encoder.encode(candidate)), encoder.encode(env.DASHBOARD_PASSWORD));
}

async function newSession(env) {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(env.DASHBOARD_PASSWORD), encoder.encode(`session:${expires}`));
  return `${expires}.${hex(signature)}`;
}

async function signedIn(request, env) {
  const match = (request.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([0-9a-f]+)`));
  if (!match || Number(match[1]) <= Date.now() / 1000) return false;
  return crypto.subtle.verify('HMAC', await hmacKey(env.DASHBOARD_PASSWORD), unhex(match[2]), encoder.encode(`session:${match[1]}`));
}

function cookie(request, value, maxAge) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `${COOKIE}=${value}; Path=/dashboard; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

/* ---------- Responses ---------- */

const BASE_HEADERS = {
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  // Not no-referrer: browsers then send "Origin: null" with the sign-in form, which login() refuses.
  'Referrer-Policy': 'same-origin',
};

function html(body, { status = 200, nonce = '', headers = {} } = {}) {
  const script = nonce ? `script-src 'nonce-${nonce}'; connect-src 'self'; ` : '';
  return new Response(body, {
    status,
    headers: {
      ...BASE_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Security-Policy': `default-src 'none'; ${script}style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'`,
      ...headers,
    },
  });
}

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { ...BASE_HEADERS, 'Content-Type': 'application/json; charset=utf-8' } });
}

function redirect(location, headers = {}) {
  return new Response(null, { status: 303, headers: { ...BASE_HEADERS, Location: location, ...headers } });
}

/* ---------- Figures ---------- */

function range(url, env) {
  const asked = url.searchParams.get('days');
  const days = RANGES.map(String).includes(asked) ? Number(asked) : 30;
  const timeZone = env.TIME_ZONE || 'Africa/Cairo';
  return { days, from: days ? dayOf(new Date(Date.now() - (days - 1) * 86400000), timeZone) : '0000-00-00', to: dayOf(new Date(), timeZone) };
}

function everyDay(from, to) {
  const list = [];
  for (let at = Date.parse(`${from}T12:00:00Z`), end = Date.parse(`${to}T12:00:00Z`); at <= end; at += 86400000) {
    list.push(new Date(at).toISOString().slice(0, 10));
  }
  return list;
}

const COUNTS = "SUM(kind = 'lead') AS leads, SUM(kind = 'click') AS clicks";

async function figures(env, url) {
  await schema(env.DB);
  const db = env.DB;
  const { days, from, to } = range(url, env);
  const rows = (sql, ...args) => db.prepare(sql).bind(...args).all().then((r) => r.results);
  const [totals] = await rows(`SELECT COALESCE(SUM(kind = 'lead'), 0) AS leads, COALESCE(SUM(kind = 'click'), 0) AS clicks, MIN(day) AS first FROM calculator_events WHERE day >= ?`, from);
  const byDay = await rows(`SELECT day, ${COUNTS} FROM calculator_events WHERE day >= ? GROUP BY day`, from);
  const seen = new Map(byDay.map((d) => [d.day, d]));
  const start = days ? from : totals.first || to;
  return {
    days,
    from: start,
    to,
    totals: { leads: totals.leads, clicks: totals.clicks },
    byDay: everyDay(start, to).map((day) => ({ day, leads: seen.get(day)?.leads || 0, clicks: seen.get(day)?.clicks || 0 })),
    tools: await rows(`SELECT tool, ${COUNTS} FROM calculator_events WHERE day >= ? GROUP BY tool ORDER BY COUNT(*) DESC, tool`, from),
    langs: await rows(`SELECT lang, ${COUNTS} FROM calculator_events WHERE day >= ? GROUP BY lang ORDER BY COUNT(*) DESC`, from),
    leads: await rows(`SELECT name, phone, wa, tool, lang, page, created_at AS at FROM calculator_events WHERE kind = 'lead' AND day >= ? ORDER BY created_at DESC LIMIT ?`, from, LEADS_SHOWN),
    leadsShown: LEADS_SHOWN,
  };
}

// A leading = + - @ (or tab / return) would run as a formula in Excel, from what a visitor typed.
function csvCell(value) {
  const text = String(value ?? '');
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

async function leadsCsv(env, url) {
  await schema(env.DB);
  const { from } = range(url, env);
  const { results } = await env.DB.prepare(`SELECT created_at, name, phone, tool, lang, page FROM calculator_events WHERE kind = 'lead' AND day >= ? ORDER BY created_at DESC`).bind(from).all();
  const lines = [['Received (UTC)', 'Name', 'Number', 'Calculator', 'Language', 'Page'], ...results.map((r) => [r.created_at, r.name, r.phone, r.tool, r.lang, r.page])];
  // The BOM lets Excel read Arabic names correctly.
  return new Response(`﻿${lines.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`, {
    headers: { ...BASE_HEADERS, 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="calculator-contacts.csv"' },
  });
}

/* ---------- Signing in ---------- */

async function login(request, env, url) {
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) return html(loginPage('Please sign in from this page.'), { status: 403 });
  await schema(env.DB);
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const since = Date.now() - FAILURE_WINDOW_MS;
  const failures = await env.DB.prepare('SELECT COUNT(*) AS n FROM dashboard_login_failures WHERE ip = ? AND at > ?').bind(ip, since).first();
  if (failures.n >= MAX_FAILURES) return html(loginPage('Too many tries. Please wait 15 minutes and try again.'), { status: 429 });

  const form = await request.formData().catch(() => null);
  const password = form && form.get('password');
  if (typeof password !== 'string' || !(await passwordMatches(env, password))) {
    await env.DB.batch([
      env.DB.prepare('INSERT INTO dashboard_login_failures (ip, at) VALUES (?, ?)').bind(ip, Date.now()),
      env.DB.prepare('DELETE FROM dashboard_login_failures WHERE at < ?').bind(since),
    ]);
    return html(loginPage('That password is not right.'), { status: 401 });
  }
  await env.DB.prepare('DELETE FROM dashboard_login_failures WHERE ip = ?').bind(ip).run();
  return redirect('/dashboard', { 'Set-Cookie': cookie(request, await newSession(env), SESSION_SECONDS) });
}

/* ---------- The routes ---------- */

export async function handleDashboard(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  if (!env.DB || !env.DASHBOARD_PASSWORD) {
    console.error('config: the DB binding and the DASHBOARD_PASSWORD secret must both be set');
    return html(messagePage('The dashboard is not set up yet.'), { status: 503 });
  }
  try {
    if (path === '/dashboard/login' && request.method === 'POST') return await login(request, env, url);
    if (path === '/dashboard/logout' && request.method === 'POST') {
      return redirect('/dashboard', { 'Set-Cookie': cookie(request, '', 0) });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response(null, { status: 405, headers: { ...BASE_HEADERS, Allow: 'GET, HEAD' } });
    }
    const allowed = await signedIn(request, env);
    if (path === '/dashboard') {
      if (!allowed) return html(loginPage());
      const nonce = crypto.randomUUID().replace(/-/g, '');
      return html(dashboardPage(nonce), { nonce });
    }
    if (path === '/dashboard/data' || path === '/dashboard/leads.csv') {
      if (!allowed) return json(401, { ok: false, error: 'signin' });
      return path === '/dashboard/data' ? json(200, await figures(env, url)) : await leadsCsv(env, url);
    }
    return html(messagePage('Page not found.'), { status: 404 });
  } catch (err) {
    console.error('dashboard', err && err.stack || String(err));
    return html(messagePage('The dashboard could not load. Please try again.'), { status: 500 });
  }
}

/* ---------- The pages ---------- */

const STYLE = `
:root { color-scheme: light; --navy: #1c2c4a; --gold: #c8892b; --ivory: #f4f1ec; --ink: #1c2c4a; --muted: #5b6475; --line: #e6e0d6;
  --leads: #b87a1f; --clicks: #4a6db0; --surface: #fff; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--ivory); color: var(--ink); font: 15px/1.5 "Segoe UI", system-ui, -apple-system, Roboto, Arial, "Noto Naskh Arabic", sans-serif; }
button, input { font: inherit; }
.top { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: center; justify-content: space-between; padding: 14px 24px; background: var(--navy); color: var(--ivory); border-bottom: 2px solid var(--gold); }
.top h1 { margin: 0; font-size: 17px; font-weight: 600; }
.top button { padding: 6px 14px; border: 1px solid rgb(244 241 236 / .45); background: transparent; color: inherit; cursor: pointer; }
main { max-width: 1120px; margin: 0 auto; padding: 20px 24px 48px; display: grid; gap: 16px; }
.filters { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.filters button, .csv { padding: 7px 14px; border: 1px solid rgb(28 44 74 / .3); background: var(--surface); color: var(--ink); cursor: pointer; text-decoration: none; }
.filters button[aria-pressed="true"] { background: var(--navy); border-color: var(--navy); color: var(--ivory); }
.card { min-width: 0; padding: 18px 20px; background: var(--surface); border: 1px solid var(--line); }
.card h2 { margin: 0 0 4px; font-size: 15px; font-weight: 600; }
.sub { margin: 0 0 12px; color: var(--muted); font-size: 13px; }
.stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 16px; }
.stat p { margin: 0; }
.stat .v { font-size: 30px; font-weight: 600; line-height: 1.2; }
.stat.hero .v { font-size: 52px; }
.stat .l { color: var(--muted); font-size: 13px; }
.legend { display: flex; gap: 16px; margin-bottom: 8px; color: var(--muted); font-size: 13px; }
.legend i { display: inline-block; width: 10px; height: 10px; margin-inline-end: 6px; border-radius: 2px; }
.chart { position: relative; }
.chart svg { display: block; width: 100%; height: 240px; }
.chart svg:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }
.axis { fill: var(--muted); font-size: 11px; font-variant-numeric: tabular-nums; }
.tip { position: absolute; z-index: 2; min-width: 130px; padding: 8px 10px; background: var(--surface); border: 1px solid var(--line); box-shadow: 0 4px 14px rgb(28 44 74 / .16); font-size: 13px; pointer-events: none; }
.tip b { font-variant-numeric: tabular-nums; }
.tip div { display: flex; gap: 8px; align-items: center; }
.tip s { display: inline-block; width: 12px; height: 2px; text-decoration: none; }
.tip .when { margin-bottom: 4px; color: var(--muted); }
.tool { display: grid; grid-template-columns: 110px minmax(0, 1fr) auto; gap: 4px 12px; align-items: center; padding: 6px 0; }
.bar { display: flex; gap: 2px; height: 14px; }
.bar span { display: block; min-width: 2px; }
.bar span:last-child { border-radius: 0 4px 4px 0; }
.nums { color: var(--muted); font-size: 13px; font-variant-numeric: tabular-nums; white-space: nowrap; }
.two { display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); gap: 16px; }
.scroll { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th { padding: 8px 10px; border-bottom: 1px solid var(--navy); color: var(--muted); font-size: 12px; font-weight: 600; text-align: start; white-space: nowrap; }
td { padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
td.num, th.num { text-align: end; font-variant-numeric: tabular-nums; }
td a { color: var(--navy); }
.head { display: flex; flex-wrap: wrap; gap: 8px 16px; align-items: start; justify-content: space-between; }
details summary { cursor: pointer; color: var(--muted); font-size: 13px; margin-top: 10px; }
.empty { margin: 8px 0; color: var(--muted); }
.error { padding: 10px 14px; background: #fbeeec; color: #8f1b12; }
.loading { opacity: .55; }
.signin { max-width: 380px; margin: 12vh auto 0; padding: 28px; background: var(--surface); border-top: 2px solid var(--gold); }
.signin h1 { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
.signin label { display: block; margin-bottom: 6px; font-weight: 500; }
.signin input { width: 100%; padding: 10px 12px; border: 1px solid rgb(28 44 74 / .4); }
.signin button { margin-top: 14px; padding: 10px 20px; border: 0; background: var(--navy); color: var(--ivory); cursor: pointer; }
.signin .error { margin: 0 0 14px; }
@media (max-width: 720px) {
  .top, main { padding-inline: 16px; }
  .two { grid-template-columns: minmax(0, 1fr); }
  .tool { grid-template-columns: minmax(0, 1fr) auto; }
  .tool .bar { grid-column: 1 / -1; grid-row: 2; }
  .stat.hero .v { font-size: 44px; }
}`;

function shell(title, body, extra = '') {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex, nofollow"><title>${title}</title><style>${STYLE}</style></head><body>${body}${extra}</body></html>`;
}

function messagePage(message) {
  return shell('Dashboard', `<div class="signin"><h1>Dashboard</h1><p>${message}</p></div>`);
}

function loginPage(error = '') {
  return shell('Dashboard — sign in', `<form class="signin" method="post" action="/dashboard/login"><h1>Calculator dashboard</h1>${error ? `<p class="error" role="alert">${error}</p>` : ''}<label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password" required autofocus><button type="submit">Sign in</button></form>`);
}

function dashboardPage(nonce) {
  const body = `<header class="top"><h1>Gindi — calculator dashboard</h1><form method="post" action="/dashboard/logout"><button type="submit">Sign out</button></form></header>
<main id="main">
  <div class="filters" role="group" aria-label="Date range">
    <button type="button" data-days="7">Last 7 days</button><button type="button" data-days="30">Last 30 days</button><button type="button" data-days="90">Last 90 days</button><button type="button" data-days="0">All time</button>
  </div>
  <p class="error" id="error" role="alert" hidden></p>
  <section class="card stats" aria-label="Totals">
    <div class="stat hero"><p class="v" id="kLeads">—</p><p class="l">Contacts saved</p></div>
    <div class="stat"><p class="v" id="kClicks">—</p><p class="l">Calculator clicks (skipped the form)</p></div>
    <div class="stat"><p class="v" id="kAll">—</p><p class="l">Total (contacts + clicks)</p></div>
    <div class="stat"><p class="v" id="kShare">—</p><p class="l">Left their details</p></div>
  </section>
  <section class="card">
    <h2>By day</h2><p class="sub">Contacts and calculator clicks each day, Cairo time.</p>
    <div class="legend"><span><i style="background:var(--leads)"></i>Contacts</span><span><i style="background:var(--clicks)"></i>Calculator clicks</span></div>
    <div class="chart" id="chart"></div>
    <details><summary>Show as a table</summary><div class="scroll"><table><thead><tr><th>Day</th><th class="num">Contacts</th><th class="num">Calculator clicks</th></tr></thead><tbody id="dayRows"></tbody></table></div></details>
  </section>
  <div class="two">
    <section class="card"><h2>By calculator</h2><p class="sub">Contacts · calculator clicks</p><div id="tools"></div></section>
    <section class="card"><h2>By language</h2><p class="sub">Contacts · calculator clicks</p><div class="scroll"><table><thead><tr><th>Language</th><th class="num">Contacts</th><th class="num">Clicks</th></tr></thead><tbody id="langs"></tbody></table></div></section>
  </div>
  <section class="card">
    <div class="head"><div><h2>Contacts</h2><p class="sub" id="leadNote"></p></div><a class="csv" id="csv" href="/dashboard/leads.csv">Download CSV</a></div>
    <div class="scroll"><table><thead><tr><th>Name</th><th>Number</th><th>WhatsApp</th><th>Calculator</th><th>Language</th><th>Received</th></tr></thead><tbody id="leads"></tbody></table></div>
    <p class="empty" id="noLeads" hidden>No contacts in this period yet.</p>
  </section>
</main>`;
  return shell('Calculator dashboard', body, `<script nonce="${nonce}">${CLIENT}</script>`);
}

// The page's script. Everything from the database goes in with textContent.
const CLIENT = `(function () {
  'use strict';
  var TOOLS = { wire: 'Wire', tiles: 'Tiles', bricks: 'Bricks', paint: 'Paint', plaster: 'Plaster', gypsum: 'Gypsum board' };
  var LANGS = { ar: 'Arabic', en: 'English' };
  var COLORS = { leads: 'var(--leads)', clicks: 'var(--clicks)' };
  var SVG = 'http://www.w3.org/2000/svg';
  var $ = function (id) { return document.getElementById(id); };
  var num = function (n) { return Number(n || 0).toLocaleString('en-US'); };
  var toolName = function (slug) { return TOOLS[slug] || slug; };
  var el = function (tag, text, cls) { var e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  var svgEl = function (tag, attrs) { var e = document.createElementNS(SVG, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; };
  var clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); };
  var shortDay = function (day) { return new Date(day + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }); };
  var when = function (iso) { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Africa/Cairo' }); };
  var current = null;

  // Clean ticks: 1, 2 or 5 times a power of ten, about four of them.
  function ticks(max) {
    if (max <= 0) return [0, 1];
    var raw = max / 4, power = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 5, 10].map(function (m) { return m * power; }).filter(function (s) { return s >= raw; })[0];
    step = Math.max(step, 1);
    var list = [];
    for (var v = 0; v < max + step; v += step) list.push(v);
    return list;
  }

  function drawChart(days) {
    var box = $('chart');
    clear(box);
    var W = Math.max(box.clientWidth, 280), H = 240, L = 36, B = 22, T = 8, R = 4;
    var total = function (d) { return d.leads + d.clicks; };
    var scale = ticks(Math.max.apply(null, days.map(total).concat([0])));
    var top = scale[scale.length - 1], y = function (v) { return T + (H - T - B) * (1 - v / top); };
    var svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', tabindex: '0', 'aria-label': 'Contacts and calculator clicks by day. Use the left and right arrow keys to read each day; the same figures are in the table below.' });
    scale.forEach(function (v) {
      svg.appendChild(svgEl('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: '#e6e0d6', 'stroke-width': 1 }));
      var label = svgEl('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'axis' });
      label.textContent = num(v);
      svg.appendChild(label);
    });
    var slot = (W - L - R) / days.length, width = Math.min(24, Math.max(2, slot - 2));
    var labelEvery = Math.ceil(days.length / Math.max(2, Math.floor((W - L) / 64)));
    var bars = days.map(function (d, i) {
      var x = L + slot * i + (slot - width) / 2, group = svgEl('g', {});
      var base = y(0);
      if (d.leads) {
        var h = base - y(d.leads);
        group.appendChild(svgEl('rect', { x: x, y: y(d.leads), width: width, height: Math.max(h - (d.clicks ? 1 : 0), 1), fill: COLORS.leads }));
      }
      if (d.clicks) {
        var yTop = y(total(d)), hc = y(d.leads) - yTop - (d.leads ? 1 : 0), r = Math.min(4, width / 2, hc);
        group.appendChild(svgEl('path', { d: 'M' + x + ' ' + (yTop + hc) + 'V' + (yTop + r) + 'Q' + x + ' ' + yTop + ' ' + (x + r) + ' ' + yTop + 'H' + (x + width - r) + 'Q' + (x + width) + ' ' + yTop + ' ' + (x + width) + ' ' + (yTop + r) + 'V' + (yTop + hc) + 'Z', fill: COLORS.clicks }));
      }
      svg.appendChild(group);
      if (i % labelEvery === 0) {
        var t = svgEl('text', { x: L + slot * i + slot / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis' });
        t.textContent = shortDay(d.day);
        svg.appendChild(t);
      }
      return group;
    });
    var tip = el('div', undefined, 'tip');
    tip.hidden = true;
    function show(i) {
      var d = days[i];
      clear(tip);
      tip.appendChild(el('div', shortDay(d.day), 'when'));
      [['leads', 'Contacts'], ['clicks', 'Calculator clicks']].forEach(function (s) {
        var row = el('div'), key = el('s');
        key.style.background = COLORS[s[0]];
        row.appendChild(key); row.appendChild(el('b', num(d[s[0]]))); row.appendChild(el('span', s[1]));
        tip.appendChild(row);
      });
      tip.hidden = false;
      bars.forEach(function (g, k) { g.setAttribute('opacity', k === i ? '1' : '.45'); });
      var scaleX = box.clientWidth / W, left = (L + slot * (i + 0.5)) * scaleX + 12;
      if (left + tip.offsetWidth > box.clientWidth) left = Math.max(0, (L + slot * (i + 0.5)) * scaleX - tip.offsetWidth - 12);
      tip.style.left = left + 'px';
      tip.style.top = '8px';
    }
    function hide() { tip.hidden = true; bars.forEach(function (g) { g.removeAttribute('opacity'); }); }
    var at = -1;
    svg.addEventListener('pointermove', function (e) {
      var r = svg.getBoundingClientRect(), i = Math.floor(((e.clientX - r.left) / r.width * W - L) / slot);
      if (i >= 0 && i < days.length) { at = i; show(i); } else hide();
    });
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('blur', hide);
    svg.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      at = at < 0 ? days.length - 1 : Math.min(days.length - 1, Math.max(0, at + (e.key === 'ArrowRight' ? 1 : -1)));
      show(at);
    });
    box.appendChild(svg);
    box.appendChild(tip);
  }

  function fillTable(body, rows) {
    clear(body);
    rows.forEach(function (cells) {
      var tr = el('tr');
      cells.forEach(function (c) { tr.appendChild(el('td', c[0], c[1])); });
      body.appendChild(tr);
    });
  }

  function render(data) {
    var all = data.totals.leads + data.totals.clicks;
    $('kLeads').textContent = num(data.totals.leads);
    $('kClicks').textContent = num(data.totals.clicks);
    $('kAll').textContent = num(all);
    $('kShare').textContent = all ? Math.round(data.totals.leads / all * 100) + '%' : '—';
    drawChart(data.byDay);
    fillTable($('dayRows'), data.byDay.slice().reverse().filter(function (d) { return d.leads || d.clicks; }).map(function (d) {
      return [[shortDay(d.day)], [num(d.leads), 'num'], [num(d.clicks), 'num']];
    }));

    var tools = $('tools'), most = Math.max.apply(null, data.tools.map(function (t) { return t.leads + t.clicks; }).concat([1]));
    clear(tools);
    if (!data.tools.length) tools.appendChild(el('p', 'Nothing in this period yet.', 'empty'));
    data.tools.forEach(function (t) {
      var row = el('div', undefined, 'tool'), bar = el('div', undefined, 'bar');
      [['leads', t.leads], ['clicks', t.clicks]].forEach(function (s) {
        if (!s[1]) return;
        var part = el('span');
        part.style.width = (s[1] / most * 100) + '%';
        part.style.background = COLORS[s[0]];
        bar.appendChild(part);
      });
      row.appendChild(el('span', toolName(t.tool)));
      row.appendChild(bar);
      row.appendChild(el('span', num(t.leads) + ' · ' + num(t.clicks), 'nums'));
      tools.appendChild(row);
    });

    fillTable($('langs'), data.langs.map(function (l) { return [[LANGS[l.lang] || l.lang], [num(l.leads), 'num'], [num(l.clicks), 'num']]; }));

    var leads = $('leads');
    clear(leads);
    data.leads.forEach(function (lead) {
      var tr = el('tr'), name = el('td', lead.name), phone = el('td'), wa = el('td');
      name.dir = 'auto';
      var call = el('a', lead.phone);
      call.dir = 'ltr';
      if (lead.wa) call.href = 'tel:+' + lead.wa;
      phone.appendChild(call);
      if (lead.wa) {
        var chat = el('a', 'Chat');
        chat.href = 'https://wa.me/' + lead.wa;
        chat.target = '_blank';
        chat.rel = 'noopener noreferrer';
        wa.appendChild(chat);
      }
      tr.appendChild(name); tr.appendChild(phone); tr.appendChild(wa);
      tr.appendChild(el('td', toolName(lead.tool)));
      tr.appendChild(el('td', LANGS[lead.lang] || lead.lang));
      tr.appendChild(el('td', when(lead.at)));
      leads.appendChild(tr);
    });
    $('noLeads').hidden = data.leads.length > 0;
    $('leadNote').textContent = data.totals.leads > data.leads.length
      ? 'Newest ' + num(data.leads.length) + ' of ' + num(data.totals.leads) + ' in this period. The CSV has them all.'
      : num(data.totals.leads) + ' in this period, newest first.';
    $('csv').href = '/dashboard/leads.csv?days=' + data.days;
  }

  function load(days) {
    Array.prototype.forEach.call(document.querySelectorAll('[data-days]'), function (b) { b.setAttribute('aria-pressed', String(Number(b.getAttribute('data-days')) === days)); });
    var main = $('main');
    main.classList.add('loading');
    $('error').hidden = true;
    fetch('/dashboard/data?days=' + days, { credentials: 'same-origin' }).then(function (r) {
      if (r.status === 401) { location.reload(); throw new Error('signin'); }
      if (!r.ok) throw new Error('failed');
      return r.json();
    }).then(function (data) {
      current = data;
      render(data);
    }).catch(function (err) {
      if (err.message === 'signin') return;
      $('error').textContent = 'The figures could not load. Please try again.';
      $('error').hidden = false;
    }).then(function () { main.classList.remove('loading'); });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-days]'), function (b) {
    b.addEventListener('click', function () { load(Number(b.getAttribute('data-days'))); });
  });
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { if (current) drawChart(current.byDay); }, 120);
  });
  load(30);
})();`;
