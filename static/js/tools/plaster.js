/*
 * Plaster & Spatter-Dash Calculator — the page (English / Arabic).
 * Arithmetic: plaster-calc.js (unchanged from static/Tools/plaster-calculator.txt).
 * Element ids are the original's.
 */
(function () {
  'use strict';
  var ui = window.GindiCalcUI, C = window.GindiCalc && window.GindiCalc.plaster;
  if (!ui || !C) return;
  var fmt = ui.fmt, $ = ui.$, ar = ui.lang === 'ar';

  var T = ar ? {
    s1: 'مدخلات كل مرحلة',
    s1hint: 'المساحة هي صافي مسطح الحوائط والأسقف التي ستُنفَّذ، وليست مساحة الشقة على الأرض. تُكتب هي والهالك مرة واحدة في المحارة، وتأخذهما الطرطشة تلقائيًا.',
    stages: ['المحارة', 'الطرطشة'], stageNote: ['الطبقة الأساسية', 'تُنفَّذ قبل المحارة على نفس الحوائط'],
    fields: { a: 'المساحة', th: 'السُمك', c: 'أجزاء الأسمنت', s: 'أجزاء الرمل', w: 'الهالك', f: 'معامل التحويل' }, sameAs: ' = المحارة',
    s1note: 'سُمك المحارة لا يشمل الطرطشة، والطبقتان تُحسبان منفصلتين. سُمك الطرطشة = متوسط سُمك مكافئ موزّع على المساحة، وليس ارتفاع الحبيبات. نسب الخلط بالحجم لا بالوزن، وقيم الطرطشة الافتراضية مثال تُعدَّل حسب التنفيذ.',
    s2: 'مدخلات عامة', bag: 'وزن الشيكارة', dens: 'كثافة الأسمنت', step: 'تقريب الرمل',
    s2note: 'كثافة الأسمنت السائب قيمة تقريبية. تقريب الرمل مثلًا 0.5 أو 1 م³ حسب طريقة توريد الرمل عندك.',
    m2: 'م²', m3: 'م³', mm: 'مم', kg: 'كجم', kgm3: 'كجم/م³',
    mortar: function (m, c, s) { return m + ' م³ مونة · خلطة ' + c + ':' + s; }, bags: 'شيكارة',
    bagsL: function (b, t) { return 'شيكارة ' + b + ' كجم = ' + t + ' كجم مشتراة'; }, noBag: 'أدخل وزن الشيكارة',
    sandL: function (s) { return 'م³ رمل للشراء (مقرّبة لأعلى كل ' + s + ' م³)'; },
    cem: 'كجم أسمنت شاملة الهالك (حسابيًا)', sandC: 'م³ رمل شاملة الهالك (حسابيًا)',
    breakdown: 'تفاصيل المراحل', perStage: function (b, s) { return b + ' شيكارة · ' + s + ' م³ رمل'; }, before: 'الشكاير قبل التقريب',
    rate: function (n) { return 'معدل فرد شيكارة ' + n; }, rateV: function (r) { return r + ' م²/شيكارة'; },
    dock: 'شيكارة أسمنت',
    warn: 'الحسبة تقديرية وتتغير حسب استواء الحوائط ونوع الرمل وطريقة الخلط والتنفيذ، ويجب أن يعتمدها مهندس مدني مختص.',
    rTitle: 'تقرير أسمنت ورمل المحارة والطرطشة', rTool: 'حاسبة أسمنت ورمل المحارة والطرطشة',
    rBags: 'شيكارة أسمنت للشراء', rSand: 'م³ رمل للشراء', rKg: 'كجم أسمنت شاملة الهالك',
    rNote: function (b, d, s) { return 'وزن الشيكارة ' + b + ' كجم · كثافة الأسمنت ' + d + ' كجم/م³ · تقريب الرمل ' + s + ' م³'; },
    rInputs: 'المدخلات', rInput: 'المدخل', rUnit: 'الوحدة', rResults: 'النتائج', rItem: 'البند', rTotal: 'الإجمالي',
    rIn: ['المساحة', 'السُمك', 'الخلطة (أسمنت:رمل)', 'الهالك', 'معامل التحويل'], byVolume: 'بالحجم',
    rOut: ['حجم المونة', 'الخامات الجافة', 'الأسمنت شامل الهالك', 'الشكاير قبل التقريب', 'الرمل شامل الهالك'],
    rBuy: function (b, bb, s, bs) { return 'الشراء: ' + b + ' شيكارة مقرّبة لأعلى = ' + bb + ' شيكارة، و' + s + ' م³ رمل مقرّبة لأعلى = ' + bs + ' م³.'; },
    rRate: function (n, r) { return ' معدل فرد شيكارة ' + n + ' ' + r + ' م².'; },
    explain: [
      ['حجم المونة', 'المساحة × السُمك بالمم ÷ 1000 (م³).'],
      ['الخامات الجافة', 'حجم المونة × معامل التحويل (1.27)، لأن المونة المبلولة تنكمش عن الخامات الجافة. المعامل لا يشمل الهالك.'],
      ['الأسمنت', 'الخامات الجافة × أجزاء الأسمنت ÷ مجموع الأجزاء، ثم × كثافة الأسمنت السائب ليصبح بالكيلوجرام.'],
      ['الرمل', 'الخامات الجافة × أجزاء الرمل ÷ مجموع الأجزاء (م³).'],
      ['الهالك', '10% افتراضيًا، خانة واحدة للمرحلتين، ويُضاف مرة واحدة فقط على الأسمنت والرمل.'],
      ['الشراء', 'الشكاير = إجمالي الأسمنت ÷ وزن الشيكارة مقرّبًا لأعلى. الرمل = الإجمالي مقرّبًا لأعلى إلى أقرب خطوة تقريب. التقريب على الإجمالي فقط.'],
      ['معدل الفرد', 'مساحة المرحلة ÷ شكايرها قبل التقريب (م² لكل شيكارة مع حصتها من الرمل)، لكل مرحلة وحدها لأن الطرطشة والمحارة على نفس الحوائط.']
    ]
  } : {
    s1: 'Inputs for each stage',
    s1hint: 'The area is the net surface of the walls and ceilings to be done, not the apartment’s floor area. Enter it and the waste once, under plaster; the spatter dash takes them automatically.',
    stages: ['Plaster', 'Spatter dash'], stageNote: ['The main coat', 'Applied before the plaster, on the same walls'],
    fields: { a: 'Area', th: 'Thickness', c: 'Cement parts', s: 'Sand parts', w: 'Waste', f: 'Dry-volume factor' }, sameAs: ' (= plaster)',
    s1note: 'The plaster thickness does not include the spatter dash; the two coats are calculated separately. The spatter-dash thickness is an equivalent average thickness spread over the area, not the height of its grains. Mix ratios are by volume, not weight; the spatter-dash defaults are an example, to be adjusted to how the work is done.',
    s2: 'General inputs', bag: 'Bag weight', dens: 'Cement density', step: 'Sand rounding',
    s2note: 'The bulk density of cement is an approximate value. Sand rounding is, for example, 0.5 or 1 m³, depending on how sand is delivered where you are.',
    m2: 'm²', m3: 'm³', mm: 'mm', kg: 'kg', kgm3: 'kg/m³',
    mortar: function (m, c, s) { return m + ' m³ mortar · mix ' + c + ':' + s; }, bags: 'bags',
    bagsL: function (b, t) { return 'bags of ' + b + ' kg = ' + t + ' kg bought'; }, noBag: 'Enter the bag weight',
    sandL: function (s) { return 'm³ of sand to buy (rounded up to every ' + s + ' m³)'; },
    cem: 'kg of cement including waste (calculated)', sandC: 'm³ of sand including waste (calculated)',
    breakdown: 'By stage', perStage: function (b, s) { return b + ' bags · ' + s + ' m³ sand'; }, before: 'Bags before rounding',
    rate: function (n) { return 'Coverage per bag — ' + n.toLowerCase(); }, rateV: function (r) { return r + ' m²/bag'; },
    dock: 'bags of cement',
    warn: 'This is an estimate. It changes with how even the walls are, the type of sand and the way the mortar is mixed and applied, and it should be approved by a qualified civil engineer.',
    rTitle: 'Plaster cement and sand report', rTool: 'Plaster & Spatter-Dash Calculator',
    rBags: 'Bags of cement to buy', rSand: 'm³ of sand to buy', rKg: 'kg of cement including waste',
    rNote: function (b, d, s) { return 'Bag weight ' + b + ' kg · cement density ' + d + ' kg/m³ · sand rounding ' + s + ' m³'; },
    rInputs: 'Inputs', rInput: 'Input', rUnit: 'Unit', rResults: 'Results', rItem: 'Item', rTotal: 'Total',
    rIn: ['Area', 'Thickness', 'Mix (cement:sand)', 'Waste', 'Dry-volume factor'], byVolume: 'by volume',
    rOut: ['Mortar volume', 'Dry materials', 'Cement including waste', 'Bags before rounding', 'Sand including waste'],
    rBuy: function (b, bb, s, bs) { return 'To buy: ' + b + ' bags, rounded up = ' + bb + ' bags; and ' + s + ' m³ of sand, rounded up = ' + bs + ' m³.'; },
    rRate: function (n, r) { return ' Coverage per bag, ' + n.toLowerCase() + ': ' + r + ' m².'; },
    explain: [
      ['Mortar volume', 'Area × thickness in mm ÷ 1000 (m³).'],
      ['Dry materials', 'Mortar volume × the dry-volume factor (1.27), because wet mortar shrinks compared with the dry materials. The factor does not include waste.'],
      ['Cement', 'Dry materials × cement parts ÷ total parts, then × the bulk density of cement to give kilograms.'],
      ['Sand', 'Dry materials × sand parts ÷ total parts (m³).'],
      ['Waste', '10% by default, one field for both stages, added only once to the cement and the sand.'],
      ['Buying', 'Bags = total cement ÷ bag weight, rounded up. Sand = the total, rounded up to the nearest rounding step. Only the totals are rounded.'],
      ['Coverage', 'A stage’s area ÷ its bags before rounding (m² per bag, with its share of sand) — for each stage on its own, because the spatter dash and the plaster cover the same walls.']
    ]
  };
  var UNITS = { a: T.m2, th: T.mm, c: '', s: '', w: '%', f: '' };

  ui.register('plaster', function () {
    function build(form, summary) {
      var D = C.DEFAULTS;
      form.innerHTML =
        ui.panel({ n: 1, id: 'cp-stages', title: T.s1, hint: T.s1hint, body:
          '<div class="crows" id="stages">' + C.STAGES.map(function (st, i) {
            return '<div class="citem"><div class="crow__head"><div class="crow__name"><b>' + T.stages[i] + '</b><small id="' + st[0] + 'm">0 ' + T.m3 + '</small>' +
              '<small>' + T.stageNote[i] + '</small></div><span class="crow__tot" id="' + st[0] + 'g">0 ' + T.bags + '</span></div>' +
              '<div class="crow__fields crow__fields--3">' +
              C.FIELDS.map(function (f, k) {
                var linked = i === 1 && C.LINKED.indexOf(f[0]) >= 0;
                var html = ui.field({ id: st[0] + f[0], label: T.fields[f[0]] + (linked ? T.sameAs : ''), unit: UNITS[f[0]], value: String(st[k + 2]) });
                return linked ? html.replace('<input ', '<input readonly data-linked ').replace('class="cf__box"', 'class="cf__box cf__box--linked"') : html;
              }).join('') + '</div></div>';
          }).join('') + '</div><p class="cnote">' + T.s1note + '</p>' }) +
        ui.panel({ n: 2, id: 'cp-general', title: T.s2, body:
          '<div class="cgrid cgrid--3">' +
            ui.field({ id: 'bag', label: T.bag, unit: T.kg, value: D.bag }) +
            ui.field({ id: 'dens', label: T.dens, unit: T.kgm3, value: D.dens }) +
            ui.field({ id: 'step', label: T.step, unit: T.m3, value: D.step }) +
          '</div><p class="cnote">' + T.s2note + '</p>' });
      summary.innerHTML =
        ui.hero('kBags', 'kBagsL', '') +
        '<div class="ckpi ckpi--hero ckpi--second"><p class="ckpi__v" id="kSand">0</p><p class="ckpi__l" id="kSandL"></p></div>' +
        '<div class="ckpis">' + ui.kpi('kCem', '', T.cem) + ui.kpi('kSandC', '', T.sandC) + '</div>' +
        '<p class="cbreak__title label">' + T.breakdown + '</p><dl class="cbreak cbreak--grid" id="cmp"></dl>';
    }

    function calc() {
      var r = C.compute({
        bag: $('bag').value, dens: $('dens').value, step: $('step').value,
        stages: C.STAGES.map(function (st) {
          var o = {};
          C.FIELDS.forEach(function (f) { o[f[0]] = $(st[0] + f[0]).value; });
          return o;
        })
      });
      // As in the original: the spatter dash's area and waste show the plaster's.
      $('ta').value = r.linked.a;
      $('tw').value = r.linked.w;
      r.S.forEach(function (x) {
        $(x.key + 'm').textContent = T.mortar(fmt(x.mortar, 2), fmt(x.c, 2), fmt(x.s, 2));
        $(x.key + 'g').textContent = fmt(x.bags, 2) + ' ' + T.bags;
      });
      var name = function (i) { return T.stages[i]; };
      $('kBags').textContent = fmt(r.buyBags);
      $('kBagsL').textContent = r.bag ? T.bagsL(fmt(r.bag, 2), fmt(r.buyBags * r.bag)) : T.noBag;
      $('kSand').textContent = fmt(r.buySand, 2);
      $('kSandL').textContent = T.sandL(fmt(r.step || 0, 2));
      $('kCem').textContent = fmt(r.kg, 2);
      $('kSandC').textContent = fmt(r.sand, 2);
      $('cmp').innerHTML = r.S.map(function (x, i) {
        return '<dt>' + name(i) + '</dt><dd>' + T.perStage(fmt(x.bags, 2), fmt(x.sand, 2)) + '</dd>';
      }).join('') + '<dt>' + T.before + '</dt><dd>' + fmt(r.bags, 2) + ' ' + T.bags + '</dd>' +
        r.S.map(function (x, i) {
          return '<dt>' + T.rate(name(i)) + '</dt><dd>' + (x.bags ? T.rateV(fmt(x.a / x.bags, 2)) : '—') + '</dd>';
        }).join('');

      var S = r.S;
      var head = function (first, extra) {
        return '<thead><tr><th>' + first + '</th>' + S.map(function (x, i) { return '<th>' + name(i) + '</th>'; }).join('') + extra + '</tr></thead>';
      };
      var row = function (label, f, unit, dg) {
        return '<tr><td class="l">' + label + '</td>' + S.map(function (x) { return '<td>' + fmt(f(x), dg) + '</td>'; }).join('') +
          '<td class="hi">' + fmt(S.reduce(function (t, x) { return t + f(x); }, 0), dg) + '</td><td>' + unit + '</td></tr>';
      };
      var inRow = function (label, f, unit) {
        return '<tr><td class="l">' + label + '</td>' + S.map(function (x) { return '<td>' + f(x) + '</td>'; }).join('') + '<td>' + unit + '</td></tr>';
      };
      ui.report({
        title: T.rTitle, tool: T.rTool,
        kpis: [[fmt(r.buyBags), T.rBags], [fmt(r.buySand, 2), T.rSand], [fmt(r.kg, 2), T.rKg]],
        body:
          '<p class="r-note">' + T.rNote(fmt(r.bag || 0, 2), fmt(r.dens), fmt(r.step || 0, 2)) + '</p>' +
          '<h2>' + T.rInputs + '</h2><table>' + head(T.rInput, '<th>' + T.rUnit + '</th>') + '<tbody>' +
            inRow(T.rIn[0], function (x) { return fmt(x.a, 2); }, T.m2) +
            inRow(T.rIn[1], function (x) { return fmt(x.th, 2); }, T.mm) +
            inRow(T.rIn[2], function (x) { return fmt(x.c, 2) + ':' + fmt(x.s, 2); }, T.byVolume) +
            inRow(T.rIn[3], function (x) { return fmt(x.w * 100, 1) + '%'; }, '') +
            inRow(T.rIn[4], function (x) { return fmt(x.f, 2); }, '') +
          '</tbody></table>' +
          '<h2>' + T.rResults + '</h2><table>' + head(T.rItem, '<th>' + T.rTotal + '</th><th>' + T.rUnit + '</th>') + '<tbody>' +
            row(T.rOut[0], function (x) { return x.mortar; }, T.m3, 2) +
            row(T.rOut[1], function (x) { return x.dry; }, T.m3, 2) +
            row(T.rOut[2], function (x) { return x.kg; }, T.kg, 2) +
            row(T.rOut[3], function (x) { return x.bags; }, T.bags, 2) +
            row(T.rOut[4], function (x) { return x.sand; }, T.m3, 2) +
          '</tbody></table>' +
          '<p class="r-note">' + T.rBuy(fmt(r.bags, 2), fmt(r.buyBags), fmt(r.sand, 2), fmt(r.buySand, 2)) +
            S.map(function (x, i) { return x.bags ? T.rRate(name(i), fmt(x.a / x.bags, 2)) : ''; }).join('') + '</p>' +
          '<p class="r-warn">' + T.warn + '</p>'
      });
      return { value: fmt(r.buyBags), label: T.dock };
    }

    return { build: build, calc: calc, explain: T.explain, warn: T.warn };
  });
})();
