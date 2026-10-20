/*
 * GINDI Design Studio — the page (ES module).
 * Markup: templates/core/design_studio.html; the image compositor:
 * compositor.js; the catalogue and the questions: apps/core/studio.py
 * (in #studio-data).
 *
 * Styles: the cards switch the one image in place (setRoom). Each style has
 * its own panel and keeps its own selection, so returning to a style finds
 * it as it was left. Panel state: one option per slot (upholstery, stone,
 * wood). Every change updates, together: the image (active style only), the
 * selected swatch (an ARIA radio group per slot: arrow keys move and select),
 * the preset buttons (or "Custom combination"), the summary, the design
 * reference, the address (?style=&u=&s=&w=, replaceState: no history entries)
 * and the "Discuss" link, which opens the Contact page with the selection
 * written into its message. If WebGL 2 is unavailable, all of that still
 * works; the image then shows its original materials, with a short notice.
 *
 * Save design: a PNG board (1600 wide) drawn here — the logo, the style, the
 * image exactly as composed on screen (full resolution), the three swatches
 * with names and IDs, the combination, reference, date, link and the note
 * that the image is an AI-generated concept.
 *
 * Discover your style: five questions in a dialog; the scoring is the one
 * documented in studio.py (QUIZ, SECOND_WITHIN) and its score()/recommend().
 */
import { createCompositor } from 'gindi/compositor';

const root = document.querySelector('[data-ds]');
const dataEl = document.getElementById('studio-data');
if (root && dataEl) init(JSON.parse(dataEl.textContent));

function init(data) {
  const L = data.labels;
  const SLOTS = ['upholstery', 'stone', 'wood'];
  const KEYS = { upholstery: 'u', stone: 's', wood: 'w' };
  const $ = (s, el = root) => el.querySelector(s);
  const $$ = (s, el = root) => Array.from(el.querySelectorAll(s));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fill = (t, v) => t.replace(/\{(\w+)\}/g, (_, k) => (v[k] !== undefined ? v[k] : ''));
  const rtl = document.documentElement.dir === 'rtl';
  const byStyle = Object.fromEntries(data.styles.map(s => [s.id, s]));

  /* ---------- The image ---------- */
  // The <img> shows the style's image as supplied (instantly, and as the
  // fallback); the canvas takes over once the compositor has the room's maps.
  const canvas = $('[data-ds-canvas]');
  const photo = $('[data-ds-photo]');
  const viewport = $('[data-ds-viewport]');
  let room = null;
  try {
    room = createCompositor(canvas);
  } catch (err) {
    console.error(err);
  }
  if (!room) $('[data-ds-error]').hidden = false;
  let ready = false; // the compositor holds the active style's room
  const optionOf = (style, slot, id) => style.materials[slot].find(m => m.id === id);

  /* ---------- One panel per style ---------- */
  const panels = {};
  let active = null;

  function Panel(style, el) {
    const q = s => el.querySelector(s);
    const qq = s => Array.from(el.querySelectorAll(s));
    const options = {};
    for (const slot of SLOTS) options[slot] = style.materials[slot];
    const find = (slot, id) => options[slot].find(m => m.id === id);
    const presetOf = sel => style.presets.find(p => SLOTS.every(slot => p[slot] === sel[slot])) || null;
    const defaults = style.presets.find(p => p.id === style.default_preset);
    const state = Object.fromEntries(SLOTS.map(slot => [slot, defaults[slot]]));
    const status = text => { q('[data-ds-status]').textContent = text; };
    // The style's controls in display order, each with its own name (e.g. "Furniture finish").
    const ORDER = style.controls.map(c => c.slot);
    const labelOf = slot => style.controls.find(c => c.slot === slot).label;

    const p = { style, el, state, find, status, order: ORDER, labelOf };
    p.preset = () => presetOf(state);
    p.material = slot => find(slot, state[slot]);
    // Design reference: style code and the three option positions (1-4).
    p.reference = () => 'GDS-' + style.code + '-' +
      SLOTS.map(slot => options[slot].findIndex(m => m.id === state[slot]) + 1).join('');
    p.shareUrl = () => {
      const u = new URL(location.href);
      u.search = '';
      u.hash = '';
      u.searchParams.set('style', style.id);
      for (const slot of SLOTS) u.searchParams.set(KEYS[slot], state[slot]);
      return u.toString();
    };

    p.sync = announce => {
      const preset = presetOf(state);
      qq('[data-ds-preset]').forEach(b => b.setAttribute('aria-pressed', String(!!preset && b.getAttribute('data-ds-preset') === preset.id)));
      q('[data-ds-custom]').hidden = !!preset;
      for (const slot of SLOTS) {
        const m = find(slot, state[slot]);
        qq(`[data-ds-option][data-slot="${slot}"]`).forEach(b => {
          const on = b.getAttribute('data-id') === state[slot];
          b.setAttribute('aria-checked', String(on));
          b.tabIndex = on ? 0 : -1;
        });
        q(`[data-ds-current="${slot}"]`).textContent = `${L.selected}: ${m.name}${m.note ? ' — ' + m.note : ''}`;
        q(`[data-ds-summary="${slot}"]`).textContent = m.name;
      }
      q('[data-ds-ref]').textContent = p.reference();
      // The enquiry: the Contact page, with the selection in its message (one line per control).
      const message = fill(L.message, {
        style: style.name, preset: preset ? preset.name : L.custom,
        materials: ORDER.map(slot => `${labelOf(slot)}: ${find(slot, state[slot]).name} (${state[slot]})`).join('\n'),
        ref: p.reference(), link: p.shareUrl(),
      });
      q('[data-ds-discuss]').href = data.contact_url + '?design=' + encodeURIComponent(message);
      if (p === active) {
        canvas.setAttribute('aria-label', fill(L.canvas_label, {
          style: style.name, materials: ORDER.map(slot => `${labelOf(slot)}: ${find(slot, state[slot]).name}`).join(', '),
        }));
        history.replaceState(null, '', p.shareUrl().replace(location.origin, ''));
      }
      if (announce) status(announce);
    };

    // Changes reach the room only while this style is the one shown.
    function load(promise) {
      root.classList.add('is-loading-material');
      return promise.catch(console.error).finally(() => {
        if (p !== active || SLOTS.every(s => room.current[s] === state[s])) root.classList.remove('is-loading-material');
      });
    }
    p.setSlot = (slot, id, announce = true) => {
      if (!find(slot, id)) return Promise.resolve();
      state[slot] = id;
      p.sync(announce ? find(slot, id).name : '');
      if (!room || p !== active || !ready) return Promise.resolve();
      return load(room.set(slot, find(slot, id)));
    };
    p.setAll = (sel, announce) => {
      for (const slot of SLOTS) state[slot] = sel[slot];
      p.sync(announce);
      if (!room || p !== active || !ready) return Promise.resolve();
      return load(Promise.all(SLOTS.map(slot => room.set(slot, find(slot, sel[slot])))));
    };
    const prefetch = id => { const m = find('stone', id); if (room && p === active && m && m.map) room.prefetch(m.map); };

    /* Controls */
    qq('[data-ds-option]').forEach(button => {
      const slot = button.getAttribute('data-slot');
      const id = button.getAttribute('data-id');
      button.addEventListener('click', () => p.setSlot(slot, id));
      button.addEventListener('pointerenter', () => prefetch(id));
      button.addEventListener('focus', () => prefetch(id));
    });

    // Arrow keys inside a radio group: move and select (Home/End too).
    qq('.ds-options').forEach(group => {
      group.addEventListener('keydown', event => {
        const items = $$('[data-ds-option]', group);
        const i = items.indexOf(document.activeElement);
        if (i < 0) return;
        const step = { ArrowRight: rtl ? -1 : 1, ArrowDown: 1, ArrowLeft: rtl ? 1 : -1, ArrowUp: -1 }[event.key];
        let next = null;
        if (step) next = items[(i + step + items.length) % items.length];
        else if (event.key === 'Home') next = items[0];
        else if (event.key === 'End') next = items[items.length - 1];
        if (!next) return;
        event.preventDefault();
        next.focus();
        next.click();
      });
    });

    qq('[data-ds-preset]').forEach(button => {
      button.addEventListener('click', () => {
        const preset = style.presets.find(x => x.id === button.getAttribute('data-ds-preset'));
        p.setAll(preset, preset.name);
      });
    });

    q('[data-ds-reset]').addEventListener('click', () => p.setAll(defaults, defaults.name));

    q('[data-ds-share]').addEventListener('click', () => {
      const url = p.shareUrl();
      const failed = () => status(`${L.copy_failed} ${url}`);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => status(L.copied), failed);
      } else {
        failed();
      }
    });

    const save = q('[data-ds-save]');
    save.hidden = false;
    save.addEventListener('click', async () => {
      save.disabled = true;
      status(L.saving);
      try {
        const blob = await drawBoard(p);
        const name = `GINDI_Design_${style.name_en.replace(/[^A-Za-z0-9]+/g, '_')}_${p.reference()}.png`;
        download(blob, name);
        status(fill(L.saved, { file: name }));
      } catch (err) {
        console.error(err);
        status(L.save_failed);
      } finally {
        save.disabled = false;
      }
    });

    return p;
  }

  for (const style of data.styles) {
    const el = $(`[data-ds-panel="${style.id}"]`);
    if (el) panels[style.id] = Panel(style, el);
  }

  /* ---------- Switching styles ---------- */
  let switching = 0;
  const prefetched = new Set();

  function activate(id) {
    const p = panels[id];
    if (!p) return Promise.resolve();
    const same = active === p;
    active = p;
    for (const other of Object.values(panels)) other.el.hidden = other !== p;
    $$('[data-ds-card]', document).forEach(card => {
      const on = card.getAttribute('data-ds-card') === id;
      card.classList.toggle('is-current', on);
      card.querySelector('[data-ds-card-current]').hidden = !on;
    });
    p.sync('');
    if (same) return Promise.resolve();
    // The image as supplied first (its own proportions), then the composed canvas.
    const r = p.style.room;
    viewport.style.aspectRatio = r.width + ' / ' + r.height;
    photo.width = r.width;
    photo.height = r.height;
    if (photo.getAttribute('src') !== r.photo) photo.src = r.photo;
    if (!room) return Promise.resolve();
    ready = false;
    canvas.hidden = true;
    photo.hidden = false;
    const seq = ++switching;
    root.classList.add('is-loading');
    root.classList.remove('is-ready', 'is-loading-material');
    return room.setRoom(r)
      .then(ok => {
        if (!ok || seq !== switching) return null;
        ready = true;
        return Promise.all(SLOTS.map(slot => room.set(slot, optionOf(p.style, slot, p.state[slot]))));
      })
      .then(() => {
        if (seq !== switching || !ready) return;
        room.renderNow();
        canvas.hidden = false;
        photo.hidden = true;
        root.classList.remove('is-loading');
        root.classList.add('is-ready');
        // Fetch this style's stone samples quietly, one by one, after the first render.
        if (prefetched.has(id)) return;
        prefetched.add(id);
        const rest = p.style.materials.stone.filter(m => m.map).map(m => m.map);
        const idle = window.requestIdleCallback || (cb => setTimeout(cb, 300));
        const next = () => { const u = rest.shift(); if (u && active === p) { room.prefetch(u); idle(next); } };
        idle(next);
      })
      .catch(err => {
        if (seq !== switching) return;
        console.error(err);
        ready = false;
        canvas.hidden = true;
        photo.hidden = false;
        $('[data-ds-error]').hidden = false;
        root.classList.remove('is-loading');
      });
  }

  // Bring the studio into view and announce the style (its name is focused).
  function showStudio() {
    const heading = $('.ds-style', active.el);
    heading.tabIndex = -1;
    root.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    heading.focus({ preventScroll: true });
  }

  $$('[data-ds-choose]', document).forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      activate(link.getAttribute('data-ds-choose'));
      showStudio();
    });
  });

  // The image at full size: a dialog that scrolls (and can be pinch-zoomed) on small screens.
  const fullButton = $('[data-ds-full]');
  const fullDialog = document.querySelector('[data-ds-full-dialog]');
  if (fullButton && fullDialog && typeof fullDialog.showModal === 'function') {
    const img = $('[data-ds-full-img]', fullDialog);
    fullButton.hidden = false;
    fullButton.addEventListener('click', async () => {
      const r = active.style.room;
      if (room && ready) {
        await room.pending;
        img.src = room.snapshot('image/jpeg', 0.92);
      } else {
        img.src = r.photo;
      }
      img.width = r.width;
      img.height = r.height;
      img.alt = canvas.getAttribute('aria-label') || '';
      fullDialog.showModal();
    });
    $('[data-ds-full-close]', fullDialog).addEventListener('click', () => fullDialog.close());
    fullDialog.addEventListener('click', event => { if (event.target === fullDialog) fullDialog.close(); });
  }

  /* ---------- Save design: the board ---------- */
  const loadImage = src => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`image ${src}`));
    img.src = src;
  });

  function download(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function drawBoard(p) {
    const BW = 1600, PAD = 60, INNER = BW - 2 * PAD;
    const ROOM_H = Math.round(INNER * p.style.room.height / p.style.room.width);
    const NAVY = '#1C2C4A', GOLD = '#C8892B', IVORY = '#F4F1EC', MUTED = '#5E6573';
    const css = getComputedStyle(document.documentElement);
    const serif = css.getPropertyValue('--font-serif').trim() || 'Georgia, serif';
    const sans = css.getPropertyValue('--font-sans').trim() || 'sans-serif';
    await Promise.all([`400 64px ${serif}`, `500 34px ${serif}`, `400 20px ${sans}`, `500 20px ${sans}`]
      .map(f => document.fonts.load(f).catch(() => null)));

    // The image as composed on screen (this style, these materials, all loaded), full resolution.
    let still = null;
    if (room && ready && active === p) {
      await room.pending;
      still = await loadImage(room.snapshot('image/jpeg', 0.95));
    }
    // Without the room, three square material tiles take its place (and the board is shorter).
    const RH = still ? ROOM_H : Math.round(INNER / 3);
    const BH = 2000 - (ROOM_H - RH);
    const [logo, ...swatches] = await Promise.all([loadImage(data.logo), ...p.order.map(slot => loadImage(p.material(slot).swatch))]);

    const c = document.createElement('canvas');
    c.width = BW;
    c.height = BH;
    const x = c.getContext('2d');
    // Logical positions from the inline start, mirrored for Arabic.
    const at = (start, w = 0) => (rtl ? BW - start - w : start);
    const write = (str, start, y, font, color, { align = 'start', ltr = false } = {}) => {
      x.font = font;
      x.fillStyle = color;
      x.direction = ltr ? 'ltr' : (rtl ? 'rtl' : 'ltr');
      const toEnd = align === 'end';
      x.textAlign = rtl ? (toEnd ? 'left' : 'right') : (toEnd ? 'right' : 'left');
      x.fillText(str, toEnd ? at(BW - start) : at(start), y);
    };
    const lines = (str, font, width, splitter = ' ') => {
      x.font = font;
      const out = [];
      let line = '';
      for (const word of str.split(splitter)) {
        const tryLine = line ? line + splitter + word : word;
        if (line && x.measureText(tryLine).width > width) { out.push(line); line = word; } else line = tryLine;
      }
      if (line) out.push(line);
      return out;
    };
    const breakChars = (str, font, width) => { // a long link, broken anywhere
      x.font = font;
      const out = [];
      let line = '';
      for (const ch of str) {
        if (line && x.measureText(line + ch).width > width) { out.push(line); line = ''; }
        line += ch;
      }
      if (line) out.push(line);
      return out;
    };
    const cover = (img, dx, dy, dw, dh) => {
      const k = Math.max(dw / img.naturalWidth, dh / img.naturalHeight);
      const sw = dw / k, sh = dh / k;
      x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) / 2, sw, sh, dx, dy, dw, dh);
    };

    x.fillStyle = IVORY;
    x.fillRect(0, 0, BW, BH);

    // Header: the GINDI logo (as supplied) on navy; the board's title and style.
    x.fillStyle = NAVY;
    x.fillRect(0, 0, BW, 300);
    const lh = 210, lw = Math.round(lh * logo.naturalWidth / logo.naturalHeight);
    x.drawImage(logo, at(PAD, lw), 45, lw, lh);
    const preset = p.preset();
    write(L.board.title, PAD, 118, `500 22px ${sans}`, GOLD, { align: 'end' });
    write(p.style.name, PAD, 192, `400 66px ${serif}`, IVORY, { align: 'end' });
    write(preset ? preset.name : L.custom, PAD, 244, `400 24px ${sans}`, 'rgba(244, 241, 236, 0.78)', { align: 'end' });

    // The room (or, without 3D, the three materials side by side).
    const RY = 340;
    if (still) x.drawImage(still, PAD, RY, INNER, RH);
    else swatches.forEach((img, i) => cover(img, at(PAD + i * INNER / 3, INNER / 3), RY, INNER / 3, RH));
    x.strokeStyle = 'rgba(28, 44, 74, 0.12)';
    x.lineWidth = 2;
    x.strokeRect(PAD, RY, INNER, RH);

    // The three materials, in the style's order: swatch, control name, option name, ID.
    const SY = RY + RH + 64, GAP = 40, CW = (INNER - 2 * GAP) / 3, SW = 180;
    p.order.forEach((slot, i) => {
      const m = p.material(slot);
      const start = PAD + i * (CW + GAP);
      cover(swatches[i], at(start, SW), SY, SW, SW);
      x.strokeStyle = 'rgba(28, 44, 74, 0.15)';
      x.strokeRect(at(start, SW), SY, SW, SW);
      const tx = start + SW + 24, tw = CW - SW - 24;
      write(p.labelOf(slot).toUpperCase(), tx, SY + 34, `500 18px ${sans}`, GOLD);
      const nameLines = lines(m.name, `400 36px ${serif}`, tw).slice(0, 2);
      nameLines.forEach((ln, k) => write(ln, tx, SY + 84 + k * 40, `400 36px ${serif}`, NAVY));
      write(m.id, tx, SY + 84 + nameLines.length * 40 + 6, `400 17px ${sans}`, MUTED, { ltr: true });
    });

    // Reference, date, link.
    const IY = SY + SW + 56;
    x.fillStyle = GOLD;
    x.fillRect(PAD, IY, INNER, 2);
    const date = new Intl.DateTimeFormat(data.lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
    const VX = PAD + 300, VW = INNER - 300;
    const rows = [
      [L.reference, p.reference(), true],
      [L.board.date, date, false],
      [L.board.combination, preset ? preset.name : L.custom, false],
    ];
    let y = IY + 56;
    for (const [label, value, ltr] of rows) {
      write(label, PAD, y, `400 20px ${sans}`, MUTED);
      write(value, VX, y, `500 24px ${sans}`, NAVY, { ltr });
      y += 50;
    }
    write(L.board.link, PAD, y, `400 20px ${sans}`, MUTED);
    for (const ln of breakChars(p.shareUrl(), `400 19px ${sans}`, VW).slice(0, 3)) {
      write(ln, VX, y, `400 19px ${sans}`, NAVY, { ltr: true });
      y += 30;
    }

    // The note: an illustrative visualisation, not a completed project.
    const note = lines(L.board.disclaimer, `400 19px ${sans}`, INNER);
    let ny = BH - 60 - (note.length - 1) * 30;
    x.fillStyle = 'rgba(200, 137, 43, 0.55)';
    x.fillRect(PAD, ny - 44, INNER, 1);
    for (const ln of note) { write(ln, PAD, ny, `400 19px ${sans}`, MUTED); ny += 30; }

    return new Promise((resolve, reject) => c.toBlob(b => (b ? resolve(b) : reject(new Error('toBlob'))), 'image/png'));
  }

  /* ---------- Discover your style ---------- */
  const dialog = document.querySelector('[data-ds-quiz]');
  const quiz = data.quiz;
  const Q = L.quiz;
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? '' : v);
    }
    for (const child of children.flat()) if (child !== null && child !== undefined && child !== false) el.append(child);
    return el;
  };

  // Totals per style; highest first, ties in catalogue order (as studio.recommend()).
  function score(answers) {
    const totals = Object.fromEntries(data.styles.map(s => [s.id, 0]));
    for (const question of quiz.questions) {
      const a = question.answers.find(x => x.id === answers[question.id]);
      if (a) for (const [styleId, pts] of Object.entries(a.points)) if (styleId in totals) totals[styleId] += pts;
    }
    return totals;
  }
  function recommend(answers) {
    const totals = score(answers);
    const order = data.styles.map(s => s.id).sort((a, b) => totals[b] - totals[a]);
    const second = order[1] && totals[order[0]] - totals[order[1]] <= quiz.second_within ? order[1] : null;
    return { first: order[0], second, totals };
  }

  if (dialog && typeof dialog.showModal === 'function' && quiz && quiz.questions.length) {
    const body = $('[data-ds-quiz-body]', dialog);
    const show = (...nodes) => body.replaceChildren(...nodes.filter(Boolean));
    let answers = {};
    let step = 0;

    const focusHeading = () => { const el = $('[data-ds-quiz-focus]', dialog); if (el) el.focus({ preventScroll: true }); body.scrollTop = 0; dialog.scrollTop = 0; };

    function renderStep() {
      const question = quiz.questions[step];
      const total = quiz.questions.length;
      const qid = `ds-quiz-q-${question.id}`;
      show(
        h('div', { class: 'ds-quiz__progress' },
          h('p', { class: 'ds-quiz__step' }, fill(Q.step, { n: step + 1, total })),
          h('div', { class: 'ds-quiz__bar', 'aria-hidden': 'true' }, h('span', { style: `inline-size: ${((step + 1) / total) * 100}%` }))),
        step === 0 ? h('p', { class: 'ds-quiz__intro' }, Q.intro) : null,
        h('h2', { class: 'ds-quiz__question', id: qid, tabindex: '-1', 'data-ds-quiz-focus': true }, question.question),
        h('div', { class: 'ds-quiz__answers', role: 'group', 'aria-labelledby': qid },
          question.answers.map(a => h('button', {
            class: 'ds-quiz__answer', type: 'button', 'aria-pressed': String(answers[question.id] === a.id),
            onclick: () => {
              answers[question.id] = a.id;
              step += 1;
              if (step < total) renderStep(); else renderResult();
              focusHeading();
            },
          },
          h('span', { class: `ds-quiz__img${a.images.length > 1 ? ' is-swatches' : ''}` },
            a.images.map(src => h('img', { src, alt: '', width: '720', height: '480', decoding: 'async' }))),
          h('span', { class: 'ds-quiz__label' }, a.label)))),
        h('div', { class: 'ds-quiz__nav' },
          step > 0 ? h('button', { class: 'ds-link', type: 'button', onclick: () => { step -= 1; renderStep(); focusHeading(); } }, Q.back) : null),
      );
    }

    function renderResult() {
      const { first, second } = recommend(answers);
      const style = byStyle[first];
      const reasons = [];
      quiz.questions.forEach(question => {
        const a = question.answers.find(x => x.id === answers[question.id]);
        if (a && a.points[first]) reasons.push({ why: a.why, pts: a.points[first] });
      });
      const top = reasons.sort((a, b) => b.pts - a.pts).slice(0, 3).map(r => r.why);
      const list = top.length > 1 ? top.slice(0, -1).join(Q.sep) + Q.and + top[top.length - 1] : (top[0] || '');
      const choose = id => () => {
        dialog.close();
        activate(id);
        showStudio();
      };
      show(
        h('p', { class: 'label ds-quiz__eyebrow' }, Q.result_eyebrow),
        h('h2', { class: 'ds-quiz__result', tabindex: '-1', 'data-ds-quiz-focus': true }, style.name),
        h('img', { class: 'ds-quiz__preview', src: style.preview, alt: '', width: '1002', height: '626' }),
        h('p', { class: 'ds-quiz__text' }, style.text),
        list ? h('p', { class: 'ds-quiz__why' }, fill(Q.because, { reasons: list })) : null,
        h('div', { class: 'ds-quiz__actions' },
          h('button', { class: 'btn btn--primary', type: 'button', onclick: choose(first) }, fill(Q.customize, { style: style.name })),
          second ? h('div', { class: 'ds-quiz__also' },
            h('p', {}, Q.also),
            h('button', { class: 'ds-btn-outline', type: 'button', onclick: choose(second) }, fill(Q.customize, { style: byStyle[second].name }))) : null,
          h('button', { class: 'ds-link', type: 'button', onclick: () => { answers = {}; step = 0; renderStep(); focusHeading(); } }, Q.again)),
        h('p', { class: 'ds-quiz__disclaimer' }, Q.disclaimer),
      );
    }

    const open = () => {
      answers = {};
      step = 0;
      renderStep();
      dialog.showModal();
      focusHeading();
    };
    $$('[data-ds-quiz-open]', document).forEach(button => {
      button.addEventListener('click', event => { event.preventDefault(); open(); });
      const wrap = button.closest('[data-ds-invite]');
      if (wrap) wrap.hidden = false;
    });
    $('[data-ds-quiz-close]', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    if (location.hash === '#discover') open();
  }

  /* ---------- Start ---------- */
  // The address chooses the style (and its selection); otherwise the first style.
  const params = new URLSearchParams(location.search);
  const asked = params.get('style');
  let first = asked;
  // A link from an earlier version of the studio (a style no longer offered): the first style, as
  // supplied, with a short note — its materials are not carried over to a different room.
  const legacy = !!asked && !panels[asked];
  if (!panels[first]) {
    const owner = !asked && data.styles.find(s => SLOTS.some(slot => s.materials[slot].some(m => m.id === params.get(KEYS[slot]))));
    first = owner && panels[owner.id] ? owner.id : Object.keys(panels)[0];
  }
  if (!legacy) {
    for (const slot of SLOTS) {
      const id = params.get(KEYS[slot]);
      if (panels[first].find(slot, id)) panels[first].state[slot] = id;
    }
  }
  for (const p of Object.values(panels)) p.sync('');
  activate(first);
  if (legacy) panels[first].status(fill(L.legacy_link, { style: panels[first].style.name }));

  window.GindiStudio = room; // used by the automated checks
  Object.defineProperty(window, 'GindiStudioReady', { get: () => ready });
  window.GindiStudioPage = { panels, activate, get active() { return active; }, drawBoard, recommend, score };
  root.classList.toggle('reduce-motion', reduceMotion.matches);
}
