/*
 * Gypsum Board Cost Calculator — the page (English / Arabic).
 * Arithmetic and starting rooms: gypsum-calc.js (unchanged from
 * static/Tools/gypsum-board-calculator.txt).
 * Element ids and option values are the original's.
 */
(function () {
  'use strict';
  var ui = window.GindiCalcUI, C = window.GindiCalc && window.GindiCalc.gypsum;
  if (!ui || !C) return;
  var fmt = ui.fmt, esc = ui.esc, $ = ui.$, ar = ui.lang === 'ar';

  var T = ar ? {
    s1: 'أسعار الوحدات',
    s1hint: 'أدخل سعر كل بند مرة واحدة، وغيّر وحدته إذا كنت تحاسب بطريقة أخرى (مثلًا الكمام بالعدد).',
    price: 'سعر الوحدة', unit: 'الوحدة', egp: 'ج',
    s2: 'الغرف',
    s2hint: 'اكتب اسم كل مكان واختر نوعه (غرفة أو حمام أو مطبخ)، ويُسجَّل الريسبشن والطرقة «غرفة». الفلات في الغرف، والأخضر في الحمامات، والأحمر في المطبخ.',
    place: 'المكان', type: 'النوع', placeN: 'مكان', remove: 'حذف ', add: 'إضافة غرفة', total: 'إجمالي التكلفة',
    heroL: 'إجمالي التكلفة (جنيه)', none: 'أدخل سعر الوحدة لكل بند في القسم ١ لتظهر التكلفة',
    kinds: ['الغرف', 'الحمامات', 'المطبخ'], kindL: function (name, n) { return name + ' (' + n + ') · جنيه'; },
    byItem: 'التكلفة حسب البند', dock: 'جنيه', dockNone: 'أدخل الأسعار',
    warn: 'الحسبة تقديرية، ويجب مراجعة الكميات على الطبيعة قبل المحاسبة.',
    rTitle: 'تقرير تكلفة الجبسوم بورد', rTool: 'حاسبة تكلفة الجبسوم بورد', rTotal: 'جنيه إجمالي التكلفة',
    rRooms: 'الغرف', rCost: 'التكلفة (ج)', rItems: 'التكلفة حسب البند', rItem: 'البند', rQty: 'الكمية', rPrice: 'سعر الوحدة (ج)', rSum: 'الإجمالي',
    explain: [
      ['تكلفة الغرفة', 'مجموع (كمية كل بند في الغرفة × سعر وحدته).'],
      ['إجمالي البند', 'مجموع كميات البند في كل الغرف × سعر الوحدة.'],
      ['حسب النوع', 'مجموع تكلفة الأماكن التي نوعها غرفة أو حمام أو مطبخ.'],
      ['الوحدات', 'الفلات والأخضر والأحمر بالمتر المربع، وبيت النور والستارة والكمام والشادو جاب بالمتر الطولي، ويمكنك تغييرها.']
    ]
  } : {
    s1: 'Unit prices',
    s1hint: 'Enter the price of each item once, and change its unit if you price it another way (for example, the curtain pelmet by the piece).',
    price: 'Unit price', unit: 'Unit', egp: 'EGP',
    s2: 'Rooms',
    s2hint: 'Name each place and choose its type (room, bathroom or kitchen); a reception or corridor counts as a room. Flat board goes in rooms, green board in bathrooms and red board in the kitchen.',
    place: 'Place', type: 'Type', placeN: 'Place', remove: 'Remove ', add: 'Add a room', total: 'Total cost',
    heroL: 'Total cost (EGP)', none: 'Enter the unit price of each item in section 1 to see the cost',
    kinds: ['Rooms', 'Bathrooms', 'Kitchen'], kindL: function (name, n) { return name + ' (' + n + ') · EGP'; },
    byItem: 'Cost by item', dock: 'EGP', dockNone: 'Enter prices',
    warn: 'This is an estimate. The quantities should be checked on site before final accounts.',
    rTitle: 'Gypsum board cost report', rTool: 'Gypsum Board Cost Calculator', rTotal: 'EGP total cost',
    rRooms: 'Rooms', rCost: 'Cost (EGP)', rItems: 'Cost by item', rItem: 'Item', rQty: 'Quantity', rPrice: 'Unit price (EGP)', rSum: 'Total',
    explain: [
      ['Room cost', 'The sum of (each item’s quantity in the room × its unit price).'],
      ['Item total', 'The item’s quantities across all rooms × its unit price.'],
      ['By type', 'The total cost of the places whose type is room, bathroom or kitchen.'],
      ['Units', 'Flat, green and red board by the square metre; light coves, curtain boxes, pelmets and shadow gaps by the linear metre. You can change them.']
    ]
  };

  // Names on the English page (the values stay the original's).
  var EN = {
    'فلات': 'Flat board', 'أخضر': 'Green board', 'أحمر': 'Red board', 'بيت النور': 'Light cove', 'بيت الستارة': 'Curtain box',
    'كمام الستارة': 'Curtain pelmet', 'شادو جاب': 'Shadow gap', 'م²': 'm²', 'م.ط': 'lin. m', 'عدد': 'pcs',
    'غرفة': 'Room', 'حمام': 'Bathroom', 'مطبخ': 'Kitchen', 'ريسبشن': 'Reception', 'طرقة': 'Corridor',
    'غرفة نوم 1': 'Bedroom 1', 'غرفة نوم 2': 'Bedroom 2', 'غرفة نوم 3': 'Bedroom 3', 'حمام 1': 'Bathroom 1', 'حمام 2': 'Bathroom 2'
  };
  var name = function (s) { return ar ? s : EN[s] || s; };
  var pairs = function (list) { return list.map(function (v) { return [v, name(v)]; }); };

  // A quantity field's unit, beside the value and read with the label.
  function setUnit(id, u) {
    var f = $(id).closest('.cf');
    f.querySelector('.visually-hidden').textContent = ' (' + u + ')';
    f.querySelector('.cf__unit').textContent = u;
  }

  ui.register('gypsum', function () {
    var seq = 0;

    function addRoom(r, focus) {
      var i = ++seq, d = document.createElement('div');
      d.className = 'citem room-box'; d.dataset.room = i;
      d.innerHTML =
        '<div class="crow__head"><div class="crow__name"><b class="ttl"></b></div>' +
        '<div class="crow__side"><span class="crow__tot tot">0 ' + T.egp + '</span>' +
        '<button type="button" class="del" aria-label="' + T.remove + '"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4"/></svg></button></div></div>' +
        '<div class="crow__fields">' +
          ui.textField({ id: 'n' + i, label: T.place, value: r[0] ? name(r[0]) : '' }) +
          ui.select({ id: 't' + i, label: T.type, options: pairs(C.TYPES), value: r[1] }) +
        '</div>' +
        '<div class="crow__fields crow__fields--4">' + C.ITEMS.map(function (it, j) {
          return ui.field({ id: 'q' + i + '_' + j, label: name(it[0]), unit: name(it[1]), value: r[2][j] || 0 });
        }).join('') + '</div>';
      d.querySelector('.del').addEventListener('click', function () { d.remove(); });
      $('rooms').appendChild(d);
      if (focus) $('n' + i).focus();
    }

    function build(form, summary) {
      form.innerHTML =
        ui.panel({ n: 1, id: 'cp-prices', title: T.s1, hint: T.s1hint, body:
          '<div class="cgrid cgrid--2" id="prices">' + C.ITEMS.map(function (it, j) {
            return '<div class="citem"><div class="crow__name"><b>' + name(it[0]) + '</b></div><div class="crow__fields">' +
              ui.field({ id: 'p' + j, label: T.price, unit: T.egp, value: '0' }) +
              ui.select({ id: 'u' + j, label: T.unit, options: pairs(C.UNITS), value: it[1] }) +
            '</div></div>';
          }).join('') + '</div>' }) +
        ui.panel({ n: 2, id: 'cp-rooms', title: T.s2, hint: T.s2hint, body:
          '<div class="crows" id="rooms"></div>' +
          '<button type="button" class="cadd" id="addRoom"><span aria-hidden="true">+</span> ' + T.add + '</button>' +
          ui.sumline(T.total, 'totC', T.egp) });
      summary.innerHTML =
        ui.hero('kTot', 'kTotL', T.heroL) +
        '<div class="ckpis">' +
          ui.kpi('kR', 'kRL', '') + ui.kpi('kB', 'kBL', '') + ui.kpi('kK', 'kKL', '', ' ckpi--wide') +
        '</div>' +
        '<p class="cbreak__title label">' + T.byItem + '</p><dl class="cbreak cbreak--grid" id="cmp"></dl>';
      $('addRoom').addEventListener('click', function () { addRoom(['', C.TYPES[0], []], true); });
      C.ROOMS.forEach(function (r) { addRoom(r); });
    }

    function calc() {
      var rows = $('rooms').querySelectorAll('.room-box');
      var U = C.ITEMS.map(function (_, j) { return name($('u' + j).value); });
      var r = C.compute({
        prices: C.ITEMS.map(function (_, j) { return $('p' + j).value; }),
        rooms: Array.prototype.map.call(rows, function (row, k) {
          var i = row.dataset.room;
          return {
            name: $('n' + i).value.trim() || T.placeN + ' ' + (k + 1),
            type: $('t' + i).value,
            q: C.ITEMS.map(function (_, j) { return $('q' + i + '_' + j).value; })
          };
        })
      });
      rows.forEach(function (row, k) {
        var i = row.dataset.room, x = r.rooms[k];
        row.querySelector('.ttl').textContent = x.name;
        row.querySelector('.del').setAttribute('aria-label', T.remove + x.name);
        row.querySelector('.tot').textContent = fmt(x.cost, 2) + ' ' + T.egp;
        U.forEach(function (u, j) { setUnit('q' + i + '_' + j, u); });
      });
      $('totC').textContent = fmt(r.T, 2);
      $('kTot').textContent = r.T ? fmt(r.T) : '—';
      $('kTotL').textContent = r.T ? T.heroL : T.none;
      $('kTotL').setAttribute('data-state', r.T ? 'priced' : 'none');
      [['kR', 0], ['kB', 1], ['kK', 2]].forEach(function (p) {
        var t = r.byT[C.TYPES[p[1]]];
        $(p[0]).textContent = fmt(t[0]);
        $(p[0] + 'L').textContent = T.kindL(T.kinds[p[1]], t[1]);
      });
      $('cmp').innerHTML = C.ITEMS.map(function (it, j) {
        return '<dt>' + name(it[0]) + '</dt><dd>' + fmt(r.Q[j], 2) + ' ' + U[j] + ' · ' + fmt(r.C[j], 2) + ' ' + T.egp + '</dd>';
      }).join('');

      var td = function (v, cls) { return '<td' + (cls ? ' class="' + cls + '"' : '') + '>' + v + '</td>'; };
      var kpi = function (k) { var t = r.byT[C.TYPES[k]]; return [fmt(t[0]), T.kinds[k] + ' (' + t[1] + ')']; };
      ui.report({
        title: T.rTitle, tool: T.rTool,
        kpis: [[fmt(r.T), T.rTotal], kpi(0), kpi(1), kpi(2)],
        body:
          '<h2>' + T.rRooms + '</h2><table><thead><tr><th>' + T.place + '</th><th>' + T.type + '</th>' +
            C.ITEMS.map(function (it, j) { return '<th>' + name(it[0]) + '<br>(' + U[j] + ')</th>'; }).join('') + '<th>' + T.rCost + '</th></tr></thead><tbody>' +
            r.rooms.map(function (x) {
              return '<tr>' + td(esc(x.name), 'l') + td(name(x.type)) +
                x.q.map(function (v) { return td(fmt(v, 2)); }).join('') + td(fmt(x.cost, 2), 'hi') + '</tr>';
            }).join('') +
          '</tbody><tfoot><tr>' + td(T.rSum, 'l') + td('') + r.Q.map(function (v) { return td(fmt(v, 2)); }).join('') + td(fmt(r.T, 2), 'hi') + '</tr></tfoot></table>' +
          '<h2>' + T.rItems + '</h2><table><thead><tr><th>' + T.rItem + '</th><th>' + T.rQty + '</th><th>' + T.unit + '</th><th>' + T.rPrice + '</th><th>' + T.rCost + '</th></tr></thead><tbody>' +
            C.ITEMS.map(function (it, j) {
              return '<tr>' + td(name(it[0]), 'l') + td(fmt(r.Q[j], 2)) + td(U[j]) + td(fmt(r.P[j], 2)) + td(fmt(r.C[j], 2), 'hi') + '</tr>';
            }).join('') +
          '</tbody><tfoot><tr>' + td(T.rSum, 'l') + td('') + td('') + td('') + td(fmt(r.T, 2), 'hi') + '</tr></tfoot></table>' +
          '<p class="r-warn">' + T.warn + '</p>'
      });
      return r.T ? { value: fmt(r.T), label: T.dock } : { value: '—', label: T.dockNone };
    }

    return { build: build, calc: calc, explain: T.explain, warn: T.warn };
  });
})();
