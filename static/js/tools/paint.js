/*
 * Paint Quantity & Cost Calculator — the page (English / Arabic).
 * Arithmetic and product data: paint-calc.js (unchanged from
 * static/Tools/paint-calculator.txt). Product names are shown exactly as in
 * the original, in both languages. Element ids and option values are the original's.
 */
(function () {
  'use strict';
  var ui = window.GindiCalcUI, C = window.GindiCalc && window.GindiCalc.paint;
  if (!ui || !C) return;
  var fmt = ui.fmt, esc = ui.esc, $ = ui.$, ar = ui.lang === 'ar';

  var T = ar ? {
    s1: 'المساحة والإعدادات', flat: 'مساحة الشقة', height: 'الارتفاع', waste: 'الهالك', labour: 'المصنعية', labourPh: 'سعر النقاش',
    s1hint: 'أدخل مساحة الشقة والارتفاع فقط، وستُقدَّر الحوائط والفتحات والسقف تلقائيًا. وإذا كان معك المقاس الفعلي لأيٍّ منها فأدخله في خانته.',
    measured: 'المقاسات الفعلية (اختياري)', len: 'طول الحوائط', open: 'الفتحات', ceil: 'السقف', auto: 'تلقائي',
    measuredNote: 'إذا تُركت فارغة: طول الحوائط ≈ مساحة الشقة × 1 م (الحائط الداخلي يُدهن من الوجهين)، والفتحات ≈ 12.5% من الحوائط، والسقف ≈ 93% من مساحة الشقة.',
    sumArea: 'صافي المساحة الكلية', m: 'م', m2: 'م²', egp: 'ج', egpM2: 'ج/م²',
    info: function (L, H, O, w) { return 'الحوائط: ' + L + ' م × ' + H + ' م − فتحات ' + O + ' م² = ' + w + ' م²'; },
    lenEst: ' (الطول مقدَّر)', ceilInfo: ' · السقف ', ceilEst: ' (مقدَّر)',
    s2: 'مراحل الدهان',
    s2hint: 'تعرض كل مرحلة أصنافها فقط. في الوجه النهائي اختر الشركة أولًا (GLC أو Jotun) ثم الخامة. لكل مرحلة اختر الخامة وعدد الأوجه (في المعجون = عدد السكاكين، و0 إذا لن تُنفَّذ المرحلة)، وهل تُنفَّذ على السقف أيضًا، وأدخل سعر العبوة من مورّدك.',
    stages: ['سيلر', 'معجون', 'صنفرة', 'بطانة', 'الوجه النهائي'], brand: 'الشركة', product: 'الخامة', coats: 'عدد الأوجه', ceiling: 'على السقف أيضًا؟',
    yes: 'نعم', no: 'لا', price: 'سعر العبوة', units: { 'لتر': 'لتر', 'كجم': 'كجم', 'فرخ': 'فرخ' },
    rate: function (r, u, rg, pack) { return 'معدل الفرد ' + r + ' م²/' + u + ' للوجه' + (rg ? ' (' + rg + ')' : '') + ' · العبوة ' + pack; },
    range: function (s) { return s; },
    heroL: 'التكلفة الإجمالية (جنيه)', partial: ' · توجد أسعار ناقصة', none: 'أدخل أسعار العبوات والمصنعية لتظهر التكلفة',
    mat: function (w) { return 'تكلفة الخامات شاملة ' + w + '% هالك'; }, perM2: 'تكلفة المتر (ج/م²)', buy: 'للشراء', dockNone: 'أدخل الأسعار', dock: 'جنيه',
    warn: 'الحسبة تقديرية وتتغير حسب حالة المحارة وامتصاصها وطريقة التنفيذ، ويجب أن يعتمدها مهندس مختص.',
    rTitle: 'تقرير كميات وتكلفة الدهانات', rTool: 'حاسبة كميات وتكلفة الدهانات', rGrand: 'التكلفة الإجمالية (جنيه)', rTotal: 'صافي المساحة الكلية (م²)',
    rMat: 'تكلفة الخامات (جنيه)', rLab: 'المصنعية (جنيه)',
    rNote: function (f, info, c, w) { return 'مساحة الشقة ' + f + ' م² · ' + info + ' · السقف ' + c + ' م² · الهالك ' + w + '%'; },
    rLabour: function (l) { return ' · المصنعية ' + l + ' ج/م²'; }, rEst: ' · (توجد مقاسات مقدَّرة من مساحة الشقة)',
    rStages: 'الكميات لكل مرحلة', rCols: ['المرحلة', 'الخامة', 'الأوجه', 'المساحة (م²)', 'معدل الفرد', 'الكمية', 'للشراء', 'التكلفة (ج)'], rMatTotal: 'إجمالي الخامات',
    rFormula: 'الكمية = مساحة المرحلة × عدد الأوجه ÷ معدل الفرد × (1 + الهالك)، والعبوات مقرّبة لأعلى. المعدلات من بيانات GLC وJotun الرسمية.',
    explain: [
      ['الحوائط', 'طول الحوائط × الارتفاع − الفتحات.'],
      ['التقدير', 'إذا تُركت الخانة فارغة: طول الحوائط ≈ مساحة الشقة × 1 م (الحائط الداخلي يُدهن من الوجهين)، والفتحات ≈ 12.5% من الحوائط، والسقف ≈ 93% من مساحة الشقة. أي إن شقة 80 م² بارتفاع 3 م ≈ 210 م² حوائط + 74 م² سقف.'],
      ['مساحة المرحلة', 'الحوائط + السقف إذا اخترت «على السقف = نعم».'],
      ['الكمية', 'مساحة المرحلة × عدد الأوجه ÷ معدل الفرد × (1 + الهالك).'],
      ['العبوات', 'الكمية ÷ حجم العبوة، مقرّبة لأعلى إلى عبوة كاملة.'],
      ['التكلفة', 'عدد العبوات × سعر العبوة، والمصنعية = صافي المساحة الكلية × سعر المتر.'],
      ['المعدلات', 'GLC من بياناتها الرسمية (متوسط الحد الأدنى والأقصى للوجه). Jotun من صفحة كل منتج على موقع Jotun مصر (التغطية للتر في الوجه). الصنفرة 10 م² للفرخ تقديرًا.'],
      ['عبوات Jotun', 'فينوماستيك 0.9 و3.6 و9 و18 لتر، فراجع الأحجام المتاحة مع التاجر.']
    ]
  } : {
    s1: 'Area and settings', flat: 'Apartment area', height: 'Height', waste: 'Waste', labour: 'Labour', labourPh: 'Painter’s rate',
    s1hint: 'Enter only the apartment area and the height: the walls, openings and ceiling are estimated from them. If you have the actual size of any of them, enter it below.',
    measured: 'Actual measurements (optional)', len: 'Wall length', open: 'Openings', ceil: 'Ceiling', auto: 'Auto',
    measuredNote: 'If left empty: wall length ≈ apartment area × 1 m (inner walls are painted on both sides), openings ≈ 12.5% of the walls, and ceiling ≈ 93% of the apartment area.',
    sumArea: 'Net total area', m: 'm', m2: 'm²', egp: 'EGP', egpM2: 'EGP/m²',
    info: function (L, H, O, w) { return 'Walls: ' + L + ' m × ' + H + ' m − openings ' + O + ' m² = ' + w + ' m²'; },
    lenEst: ' (length estimated)', ceilInfo: ' · ceiling ', ceilEst: ' (estimated)',
    s2: 'Painting stages',
    s2hint: 'Each stage lists only its own products. For the finish coat, choose the brand first (GLC or Jotun), then the product. For each stage choose the product and the number of coats (for putty, the number of passes; 0 if the stage is skipped), whether it is also done on the ceiling, and enter your supplier’s price per pack.',
    stages: ['Sealer', 'Putty', 'Sanding', 'Base coat', 'Finish coat'], brand: 'Brand', product: 'Product', coats: 'Coats', ceiling: 'On the ceiling too?',
    yes: 'Yes', no: 'No', price: 'Price per pack', units: { 'لتر': 'L', 'كجم': 'kg', 'فرخ': 'sheet' },
    rate: function (r, u, rg, pack) { return 'Coverage ' + r + ' m²/' + u + ' per coat' + (rg ? ' (' + rg + ')' : '') + ' · pack ' + pack; },
    range: function (s) { return s.replace(' عند GLC', ' per GLC').replace('تغطية Jotun', 'Jotun coverage'); },
    heroL: 'Total cost (EGP)', partial: ' · some prices are missing', none: 'Enter pack prices and labour to see the cost',
    mat: function (w) { return 'Materials cost, including ' + w + '% waste'; }, perM2: 'Cost per m² (EGP/m²)', buy: 'To buy', dockNone: 'Enter prices', dock: 'EGP',
    warn: 'This is an estimate. It changes with the condition and absorbency of the plaster and the way the work is done, and it should be approved by a qualified engineer.',
    rTitle: 'Paint quantity and cost report', rTool: 'Paint Quantity & Cost Calculator', rGrand: 'Total cost (EGP)', rTotal: 'Net total area (m²)',
    rMat: 'Materials cost (EGP)', rLab: 'Labour (EGP)',
    rNote: function (f, info, c, w) { return 'Apartment area ' + f + ' m² · ' + info + ' · ceiling ' + c + ' m² · waste ' + w + '%'; },
    rLabour: function (l) { return ' · labour ' + l + ' EGP/m²'; }, rEst: ' · (some sizes are estimated from the apartment area)',
    rStages: 'Quantities by stage', rCols: ['Stage', 'Product', 'Coats', 'Area (m²)', 'Coverage', 'Quantity', 'To buy', 'Cost (EGP)'], rMatTotal: 'Total materials',
    rFormula: 'Quantity = stage area × coats ÷ coverage × (1 + waste); packs are rounded up. Coverage rates from GLC’s and Jotun’s official data.',
    explain: [
      ['Walls', 'Wall length × height − openings.'],
      ['Estimates', 'If a field is left empty: wall length ≈ apartment area × 1 m (inner walls are painted on both sides), openings ≈ 12.5% of the walls, and ceiling ≈ 93% of the apartment area. So an 80 m² apartment with a 3 m height ≈ 210 m² of walls + 74 m² of ceiling.'],
      ['Stage area', 'The walls, + the ceiling if you chose “On the ceiling too = Yes”.'],
      ['Quantity', 'Stage area × coats ÷ coverage × (1 + waste).'],
      ['Packs', 'Quantity ÷ pack size, rounded up to a whole pack.'],
      ['Cost', 'Packs × price per pack; labour = net total area × price per m².'],
      ['Coverage rates', 'GLC from its official data (the average of the minimum and maximum per coat). Jotun from each product’s page on Jotun Egypt’s website (coverage per litre per coat). Sanding: 10 m² per sheet, an estimate.'],
      ['Jotun packs', 'Fenomastic comes in 0.9, 3.6, 9 and 18 L; check the sizes available with your dealer.']
    ]
  };
  var unit = function (u) { return T.units[u] || u; };

  ui.register('paint', function () {
    function productOptions(brand, cats) {
      return C.productsFor(brand, cats).map(function (i) { return [i, esc(C.PRODUCTS[i][0])]; });
    }

    function build(form, summary) {
      var D = C.DEFAULTS;
      form.innerHTML =
        ui.panel({ n: 1, id: 'cp-area', title: T.s1, hint: T.s1hint, body:
          '<div class="cgrid cgrid--2">' +
            ui.field({ id: 'flat', label: T.flat, unit: T.m2, value: D.flat }) +
            ui.field({ id: 'height', label: T.height, unit: T.m, value: D.height }) +
            ui.field({ id: 'waste', label: T.waste, unit: '%', value: D.waste }) +
            ui.field({ id: 'labour', label: T.labour, unit: T.egpM2, placeholder: T.labourPh }) +
          '</div>' +
          ui.fold({ title: T.measured, body:
            '<div class="cgrid cgrid--3">' +
              ui.field({ id: 'len', label: T.len, unit: T.m, placeholder: T.auto }) +
              ui.field({ id: 'open', label: T.open, unit: T.m2, placeholder: T.auto }) +
              ui.field({ id: 'ceil', label: T.ceil, unit: T.m2, placeholder: T.auto }) +
            '</div><p class="cnote">' + T.measuredNote + '</p>' }) +
          '<p class="cinfo" id="areaInfo"></p>' + ui.sumline(T.sumArea, 'sumArea', T.m2) }) +
        ui.panel({ n: 2, id: 'cp-stages', title: T.s2, hint: T.s2hint, body:
          '<div class="crows" id="stages">' + C.STAGES.map(function (s, i) {
            var fin = i === C.FIN;
            return '<div class="citem citem--stage"><div class="crow__head"><div class="crow__name"><b>' + (i + 1) + '. ' + T.stages[i] + '</b><small id="m' + i + '">0 ' + T.m2 + '</small></div>' +
              '<span class="crow__tot" id="g' + i + '">—</span></div>' +
              '<div class="crow__fields">' +
                (fin ? ui.select({ id: 'brand', label: T.brand, options: [['Jotun', 'Jotun'], ['GLC', 'GLC']], value: C.FIN_BRAND }) : '') +
                ui.select({ id: 'p' + i, label: T.product, options: productOptions(fin ? C.FIN_BRAND : '', C.CATS[i]), value: C.idx(s[1]), cls: 'cf--wide cf--product' }) +
              '</div>' +
              '<p class="crow__rate" id="r' + i + '"></p>' +
              '<div class="crow__fields crow__fields--3">' +
                ui.select({ id: 'c' + i, label: T.coats, options: C.COATS.map(function (n) { return [n, n]; }), value: s[2] }) +
                ui.select({ id: 's' + i, label: T.ceiling, options: [[C.YES, T.yes], [C.NO, T.no]], value: s[3] ? C.YES : C.NO }) +
                ui.field({ id: 'v' + i, label: T.price, unit: T.egp, placeholder: '0' }) +
              '</div></div>';
          }).join('') + '</div>' });
      summary.innerHTML =
        ui.hero('kTotal', 'kTotalL', T.heroL) +
        '<div class="ckpis">' + ui.kpi('kMat', 'kMatL', '') + ui.kpi('kM2', '', T.perM2) + '</div>' +
        '<p class="cbreak__title label">' + T.buy + '</p><dl class="cbreak cbreak--grid" id="buyList"></dl>';
      // The finish coat's brand: its product list and default product change with it (as in the original).
      $('brand').addEventListener('change', function () {
        var b = $('brand').value, sel = $('p' + C.FIN);
        sel.innerHTML = ui.options(productOptions(b, C.CATS[C.FIN]));
        sel.value = C.idx(C.BRANDS[b]);
      });
    }

    function calc() {
      var r = C.compute({
        flat: $('flat').value, height: $('height').value, len: $('len').value, open: $('open').value, ceil: $('ceil').value,
        waste: $('waste').value, labour: $('labour').value,
        stages: C.STAGES.map(function (s, i) { return { p: $('p' + i).value, c: $('c' + i).value, s: $('s' + i).value, v: $('v' + i).value }; })
      });
      var info = T.info(fmt(r.L, 1), fmt(r.H, 2), fmt(r.O, 1), fmt(r.walls, 1));
      $('areaInfo').textContent = info + (r.lenEst ? T.lenEst : '') + T.ceilInfo + fmt(r.ceil, 1) + ' ' + T.m2 + (r.ceilEst ? T.ceilEst : '');
      $('sumArea').textContent = fmt(r.total, 2);

      var buy = '', rows = '';
      r.S.forEach(function (s, i) {
        var u = unit(s.unit), pack = fmt(s.size, 3) + ' ' + u;
        $('m' + i).textContent = fmt(s.area, 1) + ' ' + T.m2 + ' · ' + fmt(s.qty, 1) + ' ' + u;
        $('g' + i).textContent = s.packs ? s.packs + ' × ' + pack : '—';
        $('r' + i).textContent = T.rate(fmt(s.rate, 2), u, s.range ? T.range(s.range) : '', pack);
        if (s.packs) buy += '<dt>' + (i + 1) + '. ' + T.stages[i] + '</dt><dd>' + s.packs + ' × ' + pack + '</dd>';
        rows += '<tr><td class="l">' + (i + 1) + '. ' + esc(T.stages[i]) + '</td><td class="l">' + esc(s.prod) + '</td><td>' + s.coats + '</td><td>' + fmt(s.area, 1) +
          '</td><td>' + fmt(s.rate, 2) + '</td><td>' + fmt(s.qty, 1) + ' ' + u + '</td><td class="hi">' + (s.packs ? s.packs + ' × ' + esc(pack) : '—') +
          '</td><td>' + (s.cost === null ? '—' : fmt(s.cost)) + '</td></tr>';
      });
      $('kTotal').textContent = r.anyPrice ? fmt(r.grand) : '—';
      $('kTotalL').textContent = r.anyPrice ? T.heroL + (r.priced ? '' : T.partial) : T.none;
      $('kTotalL').setAttribute('data-state', r.anyPrice ? (r.priced ? 'priced' : 'partial') : 'none');
      $('kMat').textContent = r.mat > 0 ? fmt(r.mat) : '—';
      $('kMatL').textContent = T.mat(fmt(r.waste * 100, 1));
      $('kM2').textContent = r.anyPrice && r.total > 0 ? fmt(r.grand / r.total, 2) : '—';
      $('buyList').innerHTML = buy || '<dt>' + T.buy + '</dt><dd>—</dd>';

      ui.report({
        title: T.rTitle, tool: T.rTool,
        kpis: [[r.anyPrice ? fmt(r.grand) : '—', T.rGrand], [fmt(r.total, 1), T.rTotal], [r.mat > 0 ? fmt(r.mat) : '—', T.rMat], [r.labour === null ? '—' : fmt(r.lab), T.rLab]],
        body:
          '<p class="r-note">' + T.rNote(fmt(r.flat, 1), info, fmt(r.ceil, 1), fmt(r.waste * 100, 1)) + (r.labour === null ? '' : T.rLabour(fmt(r.labour, 2))) + (r.est ? T.rEst : '') + '</p>' +
          '<h2>' + T.rStages + '</h2><table><thead><tr>' + T.rCols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + rows +
          '</tbody><tfoot><tr><td>' + T.rMatTotal + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td class="hi">' + (r.mat > 0 ? fmt(r.mat) : '—') + '</td></tr></tfoot></table>' +
          '<p class="r-note">' + T.rFormula + '</p>' +
          '<p class="r-warn">' + T.warn + '</p>'
      });
      return r.anyPrice ? { value: fmt(r.grand), label: T.dock } : { value: '—', label: T.dockNone };
    }

    return { build: build, calc: calc, explain: T.explain, warn: T.warn };
  });
})();
