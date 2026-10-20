/*
 * The free calculators' shared page frame (templates/core/free_tool.html).
 *
 * Each calculator registers itself — GindiCalcUI.register(slug, factory) in
 * bricks.js, tiles.js, wire.js, paint.js — and keeps its arithmetic in
 * <slug>-calc.js. This file supplies what they share: the two-column layout
 * (inputs, then the navy results panel), field builders with units and
 * validation messages, Calculate / Reset / Print, the printable report's
 * frame, the results panel's sticky behaviour and the mobile results bar.
 *
 * As in the originals, results are recalculated on every change and once
 * when the page opens; "Calculate" recalculates and brings the results into
 * view. Numbers are always written with Western digits (en-US grouping) in
 * both languages, and inputs are read the same way in both.
 */
(function () {
  'use strict';

  var lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

  var TEXT = {
    en: {
      results: 'Results', calculate: 'Calculate', reset: 'Reset',
      print: 'Print report', printHint: 'Opens the print window. To keep a copy, choose “Save as PDF” there.',
      how: 'How was this calculated?', invalid: 'Enter a number of 0 or more.',
      viewResults: 'View results', updated: 'Results updated: ', resetDone: 'All fields are back to their starting values.',
      prepared: 'Prepared by: Eng/ Mostafa Elgindi | Gindi Innovations', advanced: 'Advanced settings',
      tableNote: 'Scroll sideways to see the whole table.'
    },
    ar: {
      results: 'النتيجة', calculate: 'احسب', reset: 'إعادة الضبط',
      print: 'طباعة التقرير', printHint: 'تُفتح نافذة الطباعة، ولحفظ نسخة اختر منها «حفظ كـ PDF».',
      how: 'كيف تم الحساب؟', invalid: 'أدخل رقمًا يساوي صفرًا أو أكبر.',
      viewResults: 'عرض النتيجة', updated: 'تم تحديث النتيجة: ', resetDone: 'عادت كل الخانات إلى قيمها الأولى.',
      prepared: 'إعداد: Eng/ Mostafa Elgindi | Gindi Innovations', advanced: 'إعدادات متقدمة',
      tableNote: 'مرّر الجدول أفقيًا لرؤيته كاملًا.'
    }
  }[lang];

  // The originals' number formatting, unchanged.
  var fmt = function (n, d) { return n.toLocaleString('en-US', { maximumFractionDigits: d || 0 }); };
  var esc = function (t) { return String(t).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); };
  var $ = function (id) { return document.getElementById(id); };
  var pick = function (o) { return o && typeof o === 'object' && (o.en !== undefined || o.ar !== undefined) ? o[lang] : o; };
  var DIGITS = '٠١٢٣٤٥٦٧٨٩';
  var stepNo = function (n) { return lang === 'ar' ? String(n).replace(/\d/g, function (d) { return DIGITS[d]; }) : String(n); };

  /* ---------- Field builders (HTML strings) ---------- */

  // A number field with its unit shown beside the value (and read with the label).
  function field(o) {
    var msg = o.id + '-msg', described = msg + (o.hintId ? ' ' + o.hintId : '');
    return '<div class="cf' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<label class="cf__label" for="' + o.id + '">' + o.label + (o.unit ? '<span class="visually-hidden"> (' + o.unit + ')</span>' : '') + '</label>' +
      '<div class="cf__box"><input class="cf__input" type="number" id="' + o.id + '" min="0" step="any" inputmode="' + (o.mode || 'decimal') + '"' +
        (o.value !== undefined && o.value !== '' ? ' value="' + esc(o.value) + '"' : '') +
        (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + ' aria-describedby="' + described + '">' +
        (o.unit ? '<span class="cf__unit" aria-hidden="true">' + o.unit + '</span>' : '') + '</div>' +
      '<p class="cf__msg" id="' + msg + '" hidden></p></div>';
  }

  // options: [[value, label]]; value: the selected option's value.
  function select(o) {
    return '<div class="cf' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<label class="cf__label" for="' + o.id + '">' + o.label + '</label>' +
      '<div class="cf__box cf__box--select"><select class="cf__input" id="' + o.id + '"' + (o.attrs || '') + '>' +
        options(o.options, o.value) + '</select></div></div>';
  }

  function options(list, value) {
    return list.map(function (op) {
      return '<option value="' + esc(op[0]) + '"' + (String(op[0]) === String(value) ? ' selected' : '') + (op[2] || '') + '>' + op[1] + '</option>';
    }).join('');
  }

  function textField(o) {
    return '<div class="cf' + (o.cls ? ' ' + o.cls : '') + '">' +
      '<label class="cf__label" for="' + o.id + '">' + o.label + '</label>' +
      '<div class="cf__box"><input class="cf__input cf__input--text" type="text" id="' + o.id + '"' +
        (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + ' autocomplete="off"></div></div>';
  }

  // A numbered input section; fold: a collapsible one (its values stay when closed).
  function panel(o) {
    var head = (o.n ? '<span class="cpanel__num" aria-hidden="true">' + stepNo(o.n) + '</span>' : '') +
      '<h2 class="cpanel__title" id="' + o.id + '-t">' + o.title + '</h2>';
    var body = (o.hint ? '<p class="cpanel__hint">' + o.hint + '</p>' : '') + o.body;
    if (o.fold) {
      return '<details class="cpanel cpanel--fold' + (o.cls ? ' ' + o.cls : '') + '" id="' + o.id + '"' + (o.open ? ' open' : '') + '>' +
        '<summary class="cpanel__head">' + head + '<span class="cpanel__chev" aria-hidden="true"></span></summary>' +
        '<div class="cpanel__body">' + body + '</div></details>';
    }
    return '<section class="cpanel' + (o.cls ? ' ' + o.cls : '') + '" id="' + o.id + '" aria-labelledby="' + o.id + '-t">' +
      '<div class="cpanel__head">' + head + '</div><div class="cpanel__body">' + body + '</div></section>';
  }

  // A collapsible group inside a section (e.g. advanced settings).
  function fold(o) {
    return '<details class="cfold' + (o.cls ? ' ' + o.cls : '') + '"' + (o.open ? ' open' : '') + '>' +
      '<summary class="cfold__head"><span>' + (o.title || TEXT.advanced) + '</span><span class="cpanel__chev" aria-hidden="true"></span></summary>' +
      '<div class="cfold__body">' + o.body + '</div></details>';
  }

  // A labelled total under a section ("Net wall area  11.67 m²").
  function sumline(label, id, unit) {
    return '<p class="csum"><span>' + label + '</span><span class="csum__val"><span id="' + id + '">0</span>' + (unit ? ' <span class="csum__unit">' + unit + '</span>' : '') + '</span></p>';
  }

  // A table that scrolls sideways on narrow screens (focusable, so keyboards can scroll it).
  function table(label, html) {
    return '<div class="ctable" role="region" tabindex="0" aria-label="' + esc(label) + '">' + html + '</div>';
  }

  /* ---------- Results panel builders ---------- */
  function hero(id, labelId, label) {
    return '<div class="ckpi ckpi--hero"><p class="ckpi__v" id="' + id + '">0</p><p class="ckpi__l"' + (labelId ? ' id="' + labelId + '"' : '') + '>' + (label || '') + '</p></div>';
  }
  function kpi(id, labelId, label, extra) {
    return '<div class="ckpi' + (extra || '') + '"><p class="ckpi__v" id="' + id + '">—</p><p class="ckpi__l"' + (labelId ? ' id="' + labelId + '"' : '') + '>' + (label || '') + '</p></div>';
  }

  /* ---------- Report frame ---------- */
  var logo = '';
  function report(o) {
    var d = new Date(), date = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    return '<header class="r-head">' + (logo ? '<img class="r-logo" src="' + logo + '" alt="Gindi Innovations" width="435" height="585">' : '') +
      '<div class="r-title"><h1>' + o.title + '</h1><p>' + o.tool + ' · <span dir="ltr">' + date + '</span></p></div></header>' +
      '<div class="r-kpis">' + o.kpis.map(function (k) { return '<div><b>' + k[0] + '</b><span>' + k[1] + '</span></div>'; }).join('') + '</div>' +
      o.body + '<p class="r-foot">' + TEXT.prepared + '</p>';
  }

  /* ---------- Validation (messages only: the values are read exactly as before) ---------- */
  function validate(el) {
    if (!el || el.tagName !== 'INPUT' || el.type !== 'number') return;
    var bad = el.validity.badInput || (el.value !== '' && parseFloat(el.value) < 0);
    var msg = $(el.id + '-msg');
    if (bad) el.setAttribute('aria-invalid', 'true'); else el.removeAttribute('aria-invalid');
    if (msg) { msg.hidden = !bad; msg.textContent = bad ? TEXT.invalid : ''; }
  }

  /* ---------- The page ---------- */
  var registry = {};
  function register(slug, factory) { registry[slug] = factory; }

  function start() {
    var root = document.querySelector('[data-calc]');
    if (!root || !registry[root.getAttribute('data-calc')]) return;
    var factory = registry[root.getAttribute('data-calc')];
    var wide = window.matchMedia('(min-width: 64em)');
    logo = root.getAttribute('data-logo') || '';
    var tool, summary, dock, live, form, io, ro;

    function run() {
      var r = tool.calc();
      if (dock && r) {
        dock.querySelector('[data-dock-value]').textContent = r.value;
        dock.querySelector('[data-dock-label]').textContent = r.label;
      }
      return r;
    }

    function build() {
      tool = factory(api);
      root.innerHTML =
        '<div class="calc__grid">' +
          '<form class="calc__form" novalidate data-form>' +
            '<div class="calc__panels" data-form-body></div>' +
            '<div class="calc__actions">' +
              '<button class="btn btn--primary calc__go" type="submit">' + TEXT.calculate + '</button>' +
              '<button class="btn calc__reset" type="button" data-reset>' + TEXT.reset + '</button>' +
            '</div>' +
            '<details class="calc-how"><summary class="calc-how__head"><span>' + TEXT.how + '</span><span class="cpanel__chev" aria-hidden="true"></span></summary>' +
              '<dl class="calc-how__list">' + tool.explain.map(function (e) { return '<dt>' + e[0] + '</dt><dd>' + e[1] + '</dd>'; }).join('') + '</dl>' +
            '</details>' +
          '</form>' +
          '<aside class="calc__summary theme-dark" id="calc-results" tabindex="-1" aria-labelledby="calc-results-title">' +
            '<p class="calc__summary-eyebrow label" id="calc-results-title">' + TEXT.results + '</p>' +
            '<div class="calc__results" data-summary-body></div>' +
            '<div class="calc__print"><button class="btn calc__print-btn" type="button" data-print aria-describedby="calc-print-hint">' +
              '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M5.5 7V2.5h9V7M5.5 14.5h-3v-7h15v7h-3M5.5 11.5h9v6h-9z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>' +
              TEXT.print + '</button><p class="calc__print-hint" id="calc-print-hint">' + TEXT.printHint + '</p></div>' +
            '<p class="calc__warn">' + tool.warn + '</p>' +
          '</aside>' +
        '</div>' +
        '<a class="calc-dock" href="#calc-results" data-dock hidden><span class="calc-dock__res"><span class="calc-dock__value" data-dock-value></span> ' +
          '<span class="calc-dock__label" data-dock-label></span></span><span class="calc-dock__go">' + TEXT.viewResults + '</span></a>' +
        '<p class="visually-hidden" role="status" data-live></p>';
      form = root.querySelector('[data-form]');
      summary = root.querySelector('.calc__summary');
      dock = root.querySelector('[data-dock]');
      live = root.querySelector('[data-live]');
      tool.build(root.querySelector('[data-form-body]'), root.querySelector('[data-summary-body]'));
      root.querySelectorAll('input[type="number"]').forEach(validate);
      run();
      watch();
    }

    // Sticky only while the whole panel fits under the header; otherwise it scrolls with the page.
    function fit() {
      if (!summary) return;
      var header = parseFloat(getComputedStyle(document.documentElement).fontSize) * 5;
      summary.classList.toggle('is-sticky', wide.matches && summary.offsetHeight <= window.innerHeight - header - 32);
    }

    // Narrow screens: a bar with the main result while the results panel is out of view.
    var seen = { form: false, summary: false };
    function dockState() { if (dock) dock.hidden = wide.matches || !seen.form || seen.summary; }
    function watch() {
      if (io) io.disconnect();
      if (ro) ro.disconnect();
      if ('ResizeObserver' in window) { ro = new ResizeObserver(fit); ro.observe(summary); }
      if (!('IntersectionObserver' in window)) return;
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { seen[e.target === summary ? 'summary' : 'form'] = e.isIntersecting; });
        dockState();
      });
      io.observe(form); io.observe(summary);
    }

    function showResults() {
      summary.focus({ preventScroll: true });
      if (!wide.matches || summary.getBoundingClientRect().top < 0 || summary.getBoundingClientRect().bottom > window.innerHeight) {
        summary.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      }
    }

    root.addEventListener('input', function (e) { validate(e.target); run(); });
    root.addEventListener('change', function (e) { validate(e.target); run(); });
    root.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = run();
      showResults();
      if (r) live.textContent = TEXT.updated + r.value + ' ' + r.label;
    });
    root.addEventListener('click', function (e) {
      if (e.target.closest('[data-reset]')) {
        build();
        root.querySelector('[data-reset]').focus();
        live.textContent = TEXT.resetDone;
      } else if (e.target.closest('[data-print]')) {
        run();
        window.print();
      } else if (e.target.closest('[data-dock]')) {
        e.preventDefault();
        showResults();
      } else if (e.target.closest('.del, .cadd')) {
        run();   // a row added or removed (the tool's own handler has already run), as in the originals
      }
    });
    window.addEventListener('resize', function () { fit(); dockState(); });
    wide.addEventListener('change', function () { fit(); dockState(); });
    window.addEventListener('beforeprint', run);

    build();
  }

  var api = {
    lang: lang, text: TEXT, fmt: fmt, esc: esc, $: $, pick: pick, stepNo: stepNo,
    field: field, select: select, options: options, textField: textField, panel: panel, fold: fold,
    sumline: sumline, table: table, hero: hero, kpi: kpi, register: register,
    // The printable report (#report), rebuilt with every calculation as in the originals.
    report: function (o) { $('report').innerHTML = report(o); }
  };
  window.GindiCalcUI = api;
  document.addEventListener('DOMContentLoaded', start);
})();
