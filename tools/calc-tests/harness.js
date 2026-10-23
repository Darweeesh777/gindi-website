/*
 * Runs in the page (original static/Tools/*.txt or an integrated tool page).
 * window.__calc.apply(steps) — see scenarios.py
 * window.__calc.capture(tool, side) — every displayed result as tokens
 *   (numbers as written, or "—" for an empty value), so English, Arabic and the original
 *   wording compare equal exactly when the figures are equal.
 */
(function () {
  'use strict';
  var TOKEN = /[-+]?\d+(?:,\d{3})*(?:\.\d+)?/g;
  function text(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : null; }
  // A lone "—" is the calculators' "no value"; elsewhere a dash is only wording.
  // Arabic-Indic digits (the original's «بند إضافي ١») count as the digits they are.
  function tokens(s) {
    if (s === null) return null;
    s = s.replace(/[٠-٩]/g, function (d) { return String(d.charCodeAt(0) - 0x660); });
    return s === '—' ? ['—'] : (s.match(TOKEN) || []);
  }
  function byId(id) { return document.getElementById(id); }

  function apply(steps) {
    steps.forEach(function (s) {
      var el;
      if (s[0] === 'set') {
        el = byId(s[1]);
        if (!el) throw new Error('no element #' + s[1]);
        el.value = s[2];
        if (el.tagName === 'SELECT' && el.value !== s[2]) throw new Error('no option ' + s[2] + ' in #' + s[1]);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (s[0] === 'click') {
        el = document.querySelector(s[1]);
        if (!el) throw new Error('no element ' + s[1]);
        el.click();
      } else if (s[0] === 'del') {
        el = document.querySelector('[data-row="' + s[1] + '"] .del');
        if (!el) throw new Error('no remove button in row ' + s[1]);
        el.click();
      }
    });
  }

  var OUT = {
    bricks: { ids: ['sizeInfo', 'sumArea', 'kBricks', 'kBricksL', 'kCost', 'kRate', 'cNet', 'cWaste', 'cRate2'], dyn: /^[mg]\d+$/ },
    tiles: { ids: ['sumArea', 'sumSk', 'kCartons', 'kRange', 'kArea', 'kCost', 'kSupL'], dyn: /^(tp|m|g)\d+$/, list: 'cmp' },
    wire: { ids: ['sumLen', 'tLen', 'tAfter', 'tMin', 'tAvg', 'tMax', 'tCost', 'kTotal', 'kRange', 'kLen', 'kLenL', 'cElec', 'cRange', 'cDiff'],
            dyn: /^(g|L|D|E|F|G|I)\d+$/ },
    paint: { ids: ['areaInfo', 'sumArea', 'kTotal', 'kMat', 'kMatL', 'kM2'], dyn: /^[mgr]\d+$/, list: 'buyList' },
    // plaster: also the spatter dash's linked (read-only) area and waste, which calc() writes.
    plaster: { ids: ['kBags', 'kBagsL', 'kSand', 'kSandL', 'kCem', 'kSandC'], dyn: /^[pt][mg]$/, list: 'cmp', values: ['ta', 'tw'] }
  };

  // States carried by wording alone (no figures): the original's text, the new page's data-state.
  function probes(tool, side) {
    var p = {};
    function st(id, fromText) {
      var el = byId(id);
      p[id] = side === 'new' ? (el.getAttribute('data-state') || '') : fromText(text(el), el);
    }
    if (tool === 'tiles') {
      st('kSup', function (t) { return t === '—' ? 'none' : t.indexOf('أعلى') === 0 ? 'high' : t.indexOf('أقل') === 0 ? 'low' : 'in'; });
      st('check', function (t) { return t ? 'missing' : ''; });
      st('kCostL', function (t) { return t.indexOf('اكتب') === 0 ? 'unpriced' : 'priced'; });
    } else if (tool === 'wire') {
      st('verdict', function (t, el) {
        return el.classList.contains('ok') ? 'in' : !el.classList.contains('bad') ? 'none' : t.indexOf('أعلى') === 0 ? 'high' : 'low';
      });
    } else if (tool === 'paint') {
      st('kTotalL', function (t) { return t.indexOf('اكتب') === 0 ? 'none' : t.indexOf('ناقصة') >= 0 ? 'partial' : 'priced'; });
    } else if (tool === 'bricks') {
      st('kCostL', function (t) { return t.indexOf('اكتب') === 0 ? 'unpriced' : 'priced'; });
    }
    return p;
  }

  function capture(tool, side) {
    var o = OUT[tool], out = { ids: {}, dyn: {}, probes: probes(tool, side) };
    o.ids.forEach(function (id) { out.ids[id] = tokens(text(byId(id))); });
    Array.prototype.forEach.call(document.querySelectorAll('[id]'), function (el) {
      if (o.dyn.test(el.id) && !/^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(el.tagName)) out.dyn[el.id] = tokens(text(el));
    });
    if (o.values) out.values = o.values.map(function (id) { return byId(id).value; });
    if (o.list) out.list = Array.prototype.map.call(byId(o.list).children, function (c) { return tokens(text(c)); });
    var rows = document.querySelectorAll('[data-row]');
    out.rows = Array.prototype.map.call(rows, function (r) {
      var del = r.querySelector('.del');
      return { row: r.getAttribute('data-row'), title: tokens(text(r.querySelector('.ttl'))), del: del ? !del.hidden : null };
    });
    // Option lists: product names exactly (paint); brick sizes as figures.
    if (tool === 'paint') {
      out.options = {};
      for (var i = 0; i < 5; i++) {
        var sel = byId('p' + i);
        out.options['p' + i] = { value: sel.value, names: Array.prototype.map.call(sel.options, function (op) { return op.value + '|' + op.textContent.trim(); }) };
      }
      out.options.brand = byId('brand').value;
    }
    if (tool === 'bricks') out.options = Array.prototype.map.call(byId('brick').options, function (op) { return tokens(op.textContent); });
    var rep = byId('report');
    out.report = {
      kpis: Array.prototype.map.call(rep.querySelectorAll('.r-kpis b'), function (b) { return tokens(text(b)); }),
      tables: Array.prototype.map.call(rep.querySelectorAll('table'), function (t) {
        return Array.prototype.map.call(t.querySelectorAll('tbody tr, tfoot tr'), function (tr) {
          return Array.prototype.map.call(tr.querySelectorAll('td'), function (td) { return tokens(text(td)); });
        });
      }),
      notes: Array.prototype.map.call(rep.querySelectorAll('.r-note, .r-cmp'), function (n) { return tokens(text(n)); })
    };
    return out;
  }

  window.__calc = { apply: apply, capture: capture };
})();
