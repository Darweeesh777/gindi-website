/*
 * Tile & Ceramic Calculator — the page (English / Arabic).
 * Arithmetic: tiles-calc.js (unchanged from static/Tools/ceramic-calculator.txt).
 * Element ids, row numbers and option values are the original's.
 */
(function () {
  'use strict';
  var ui = window.GindiCalcUI, C = window.GindiCalc && window.GindiCalc.tiles;
  if (!ui || !C) return;
  var fmt = ui.fmt, esc = ui.esc, $ = ui.$, ar = ui.lang === 'ar';

  var T = ar ? {
    s1: 'الإعدادات العامة', wMin: 'الهالك — أدنى', wAvg: 'الهالك — متوسط', wMax: 'الهالك — أعلى', wExtra: 'هالك إضافي مباشر', joint: 'الفاصل بين البلاط',
    s1note: 'يُضاف الهالك الإضافي المباشر فوق نسب الهالك (الأدنى والمتوسط والأعلى) على كل الأرضيات والحوائط.',
    s2: 'أنواع البلاط ومقاساتها', s2hint: 'أدخل مقاس البلاطة بالسنتيمتر ومساحة الكرتونة (م²) كما هي مكتوبة على الكرتونة، وسعر المتر. اترك النوع غير المستخدم فارغًا.',
    tl: 'الطول', tw: 'العرض', tc: 'مساحة الكرتونة', tr: 'سعر المتر', pricePh: 'سعر المورّد', perCtn: ' قطعة/كرتونة',
    s3: 'مساحات الأرضيات والحوائط',
    s3hint: 'المساحة = الطول × العرض × العدد − الفتحات. للحوائط: أدخل المحيط في «الطول» والارتفاع في «العرض»، وخصم الأبواب والشبابيك في «خصم الفتحات». لإضافة أماكن أخرى اضغط «إضافة مكان».',
    l: 'الطول / المحيط', w: 'العرض / الارتفاع', n: 'العدد', o: 'خصم الفتحات', t: 'النوع', s: 'السطح', k: 'وزرة', dr: 'خصم الأبواب من الوزرة',
    add: 'إضافة مكان', remove: 'حذف ', sumArea: 'إجمالي المساحة الصافية', skOf: ' · وزرة ',
    s4: 'الوزرة', skH: 'ارتفاع الوزرة', skX: 'زيادة الوزرة (فوق الهالك)', sumSk: 'إجمالي الوزرة',
    s4note: 'تُحسب الوزرة لكل أرضية اختير لها «وزرة: نعم»: المحيط = 2 × (الطول + العرض) × العدد ناقص عرض الأبواب، وبنفس نوع بلاط الأرضية. تُضاف زيادة الوزرة فوق الهالك لأن القص يضيّع أكثر.',
    s5: 'اللاصق وطلب المورّد (اختياري)', glueCov: 'تغطية كيس اللاصق', glueCovPh: 'من الكيس', gluePrice: 'سعر كيس اللاصق', supplier: 'كراتين المورّد', supplierPh: 'العدد الذي طلبه',
    s5note: 'تختلف التغطية حسب مقاس البلاطة ونوع المسطرين، فأدخلها من الكيس نفسه. اللاصق محسوب على مساحة الأرضيات والحوائط.',
    m: 'م', m2: 'م²', cm: 'سم', mm: 'مم', egp: 'ج', egpM2: 'ج/م²', carton: 'كرتونة', piece: 'قطعة', bag: 'كيس',
    heroL: 'إجمالي الكراتين (متوسط) بعد الهالك', range: 'النطاق المتوقع (كرتونة)', rangeV: function (a, b) { return 'من ' + a + ' إلى ' + b; },
    area: 'م² صافٍ (شاملة الوزرة)', cost: 'التكلفة شاملة اللاصق (جنيه)', costMissing: 'أدخل سعر المتر لأنواع البلاط',
    sup: { high: 'أعلى من النطاق', low: 'أقل من النطاق', 'in': 'داخل النطاق' }, supMissing: 'أدخل كراتين المورّد أعلاه',
    supL: function (s, a) { return 'طلب ' + s + ' كرتونة | الحسبة ' + a + ' كرتونة'; },
    supLong: { none: 'أدخل عدد كراتين المورّد أعلاه', high: 'أعلى من النطاق — اسأله من أين جاء الرقم وبالتفصيل', low: 'أقل من النطاق — تأكد أنه لا يوجد مكان ناقص', 'in': 'داخل النطاق المعقول' },
    diff: function (d) { return ' (الفرق عن المتوسط ' + d + ')'; },
    breakdown: 'تفاصيل الشراء', after: 'المساحة بعد الهالك', tileCost: 'تكلفة البلاط', bags: 'أكياس اللاصق', cmpSup: 'المقارنة مع المورّد',
    missing: 'تنبيه: يوجد نوع عليه مساحة وليس له مساحة كرتونة، أدخلها في «أنواع البلاط».',
    dock: 'كرتونة (متوسط)',
    warn: 'الحسبة تقريبية. اشترِ الكمية كلها من نفس الدفعة (Batch) حتى لا تختلف الدرجة واللون، وراجعها مع المورّد ومهندس الموقع.',
    rTitle: 'تقرير السيراميك والبلاط', rTool: 'حاسبة السيراميك والبلاط', rAvg: 'إجمالي الكراتين (متوسط)', rArea: 'م² صافٍ شاملة الوزرة',
    rNote: function (a, b, c, x, j, h, k) { return 'الهالك ' + a + '% / ' + b + '% / ' + c + '% + إضافي ' + x + '% · الفاصل ' + j + ' مم · الوزرة ' + h + ' سم + زيادة ' + k + '%'; },
    rAreas: 'تفصيل المساحات', rAreaCols: ['المكان', 'النوع', 'السطح', 'الطول/المحيط', 'العرض/الارتفاع', 'العدد', 'الفتحات', 'الصافي (م²)', 'الوزرة (م²)'],
    rTypes: 'ملخص الكراتين والتكلفة', rTypeCols: ['النوع', 'المقاس (سم)', 'الكرتونة (م²)', 'المساحة', 'الوزرة', 'بعد الهالك', 'أدنى', 'متوسط', 'أعلى', 'القطع', 'التكلفة (ج)'],
    total: 'الإجمالي', rGlue: 'اللاصق: ', rSup: ' · طلب المورّد: ', rCartons: ' كرتونة، ',
    explain: [
      ['المساحة', 'الطول × العرض × العدد − الفتحات، وإذا كانت بالسالب تُحسب صفرًا.'],
      ['الوزرة', 'طول الوزرة الصافي × ارتفاعها ÷ 100.'],
      ['الهالك', 'المساحة × (1 + نسبة الهالك + الهالك الإضافي)، وتأخذ الوزرة أيضًا زيادة الوزرة.'],
      ['الكراتين', 'المساحة بعد الهالك ÷ مساحة الكرتونة، مقرّبة لأعلى لكل نوع. تُحسب 3 مرات بالهالك الأدنى والمتوسط والأعلى لتعطي النطاق.'],
      ['القطع', 'المساحة بعد الهالك (المتوسط) ÷ مساحة البلاطة مع الفاصل، مقرّبة لأعلى.'],
      ['التكلفة', 'الكراتين المتوسطة × مساحة الكرتونة × سعر المتر، + أكياس اللاصق × سعر الكيس.'],
      ['اللاصق', 'مساحة الأرضيات والحوائط ÷ تغطية الكيس، مقرّبة لأعلى.'],
      ['المورّد', 'إذا كان طلبه أعلى من الحد الأعلى فاسأله من أين جاء الرقم وبالتفصيل، وإذا كان أقل من الحد الأدنى فتأكد أنه لا يوجد مكان ناقص.']
    ]
  } : {
    s1: 'General settings', wMin: 'Waste — minimum', wAvg: 'Waste — average', wMax: 'Waste — maximum', wExtra: 'Additional direct waste', joint: 'Joint between tiles',
    s1note: 'The additional direct waste is added on top of the waste rates (minimum, average and maximum) for all floors and walls.',
    s2: 'Tile types and sizes', s2hint: 'Enter the tile size in centimetres and the carton area (m²) as printed on the carton, and the price per square metre. Leave a type you don’t use empty.',
    tl: 'Length', tw: 'Width', tc: 'Carton area', tr: 'Price per m²', pricePh: 'Supplier’s price', perCtn: ' pieces/carton',
    s3: 'Floor and wall areas',
    s3hint: 'Area = length × width × count − openings. For walls, enter the perimeter as the “length” and the height as the “width”, and doors and windows under “Openings deduction”. To add more places, choose “Add a place”.',
    l: 'Length / perimeter', w: 'Width / height', n: 'Count', o: 'Openings deduction', t: 'Type', s: 'Surface', k: 'Skirting', dr: 'Door widths off the skirting',
    add: 'Add a place', remove: 'Remove ', sumArea: 'Total net area', skOf: ' · skirting ',
    s4: 'Skirting', skH: 'Skirting height', skX: 'Skirting extra (on top of waste)', sumSk: 'Total skirting',
    s4note: 'Skirting is calculated for each floor set to “Skirting: Yes”: perimeter = 2 × (length + width) × count, less the door widths, in the same tile type as the floor. The skirting extra is added on top of the waste because cutting wastes more.',
    s5: 'Adhesive and supplier’s order (optional)', glueCov: 'Coverage per adhesive bag', glueCovPh: 'From the bag', gluePrice: 'Price per adhesive bag', supplier: 'Supplier’s cartons', supplierPh: 'The number ordered',
    s5note: 'Coverage depends on the tile size and the trowel, so take it from the bag itself. Adhesive is calculated on the floor and wall area.',
    m: 'm', m2: 'm²', cm: 'cm', mm: 'mm', egp: 'EGP', egpM2: 'EGP/m²', carton: 'cartons', piece: 'pieces', bag: 'bags',
    heroL: 'cartons in total (average), after waste', range: 'Expected range (cartons)', rangeV: function (a, b) { return a + ' to ' + b; },
    area: 'm² net (including skirting)', cost: 'Cost including adhesive (EGP)', costMissing: 'Enter the price per m² for the tile types',
    sup: { high: 'Above the range', low: 'Below the range', 'in': 'Within the range' }, supMissing: 'Enter the supplier’s cartons above',
    supL: function (s, a) { return 'Ordered ' + s + ' cartons | calculated ' + a + ' cartons'; },
    supLong: { none: 'Enter the supplier’s number of cartons above', high: 'Above the range — ask where the figure comes from, in detail', low: 'Below the range — make sure no place is missing', 'in': 'Within a reasonable range' },
    diff: function (d) { return ' (difference from the average: ' + d + ')'; },
    breakdown: 'Purchase breakdown', after: 'Area after waste', tileCost: 'Tile cost', bags: 'Adhesive bags', cmpSup: 'Supplier comparison',
    missing: 'Note: a tile type has an area but no carton area. Enter it under “Tile types and sizes”.',
    dock: 'cartons (average)',
    warn: 'This is an approximate calculation. Buy the whole quantity from the same batch so the shade and colour match, and check it with the supplier and the site engineer.',
    rTitle: 'Tile and ceramic report', rTool: 'Tile & Ceramic Calculator', rAvg: 'Total cartons (average)', rArea: 'm² net, including skirting',
    rNote: function (a, b, c, x, j, h, k) { return 'Waste ' + a + '% / ' + b + '% / ' + c + '% + additional ' + x + '% · joint ' + j + ' mm · skirting ' + h + ' cm + extra ' + k + '%'; },
    rAreas: 'Areas', rAreaCols: ['Place', 'Type', 'Surface', 'Length / perimeter', 'Width / height', 'Count', 'Openings', 'Net (m²)', 'Skirting (m²)'],
    rTypes: 'Cartons and cost', rTypeCols: ['Type', 'Size (cm)', 'Carton (m²)', 'Area', 'Skirting', 'After waste', 'Min', 'Average', 'Max', 'Pieces', 'Cost (EGP)'],
    total: 'Total', rGlue: 'Adhesive: ', rSup: ' · Supplier’s order: ', rCartons: ' cartons, ',
    explain: [
      ['Area', 'Length × width × count − openings; a negative result counts as zero.'],
      ['Skirting', 'Net skirting length × its height ÷ 100.'],
      ['Waste', 'Area × (1 + waste rate + additional waste); skirting also takes the skirting extra.'],
      ['Cartons', 'Area after waste ÷ carton area, rounded up for each type. Calculated three times — with the minimum, average and maximum waste — to give the range.'],
      ['Pieces', 'Area after waste (average) ÷ the tile’s area including the joint, rounded up.'],
      ['Cost', 'Average cartons × carton area × price per m², + adhesive bags × price per bag.'],
      ['Adhesive', 'Floor and wall area ÷ coverage per bag, rounded up.'],
      ['Supplier', 'If their order is above the maximum, ask where the figure comes from, in detail; if it is below the minimum, make sure no place is missing.']
    ]
  };

  // English names for the original's places, types, uses and surfaces (the values stay the original's).
  var EN = {
    'الريسبشن': 'Reception', 'غرفة 1': 'Room 1', 'غرفة 2': 'Room 2', 'غرفة 3': 'Room 3', 'الطرقة': 'Corridor',
    'المطبخ — أرضية': 'Kitchen — floor', 'المطبخ — حوائط': 'Kitchen — walls', 'حمام 1 — أرضية': 'Bathroom 1 — floor',
    'حمام 1 — حوائط': 'Bathroom 1 — walls', 'حمام 2 — أرضية': 'Bathroom 2 — floor', 'حمام 2 — حوائط': 'Bathroom 2 — walls',
    'البلكونة — أرضية': 'Balcony — floor', 'مكان إضافي': 'Extra place',
    'نوع 1': 'Type 1', 'نوع 2': 'Type 2', 'نوع 3': 'Type 3', 'أرضيات': 'floors', 'حوائط': 'walls', 'أرضيات الحمامات': 'bathroom floors',
    'أرضية': 'Floor', 'أخرى': 'Other'
  };
  var SURF_EN = { 'أرضية': 'Floor', 'حوائط': 'Walls', 'أخرى': 'Other' };
  var name = function (v) { return ar ? v : EN[v] || v; };
  var surf = function (v) { return ar ? v : SURF_EN[v] || v; };
  var SKIRT_LABEL = ar ? ['لا', 'نعم'] : ['No', 'Yes'];

  ui.register('tiles', function () {
    var box, addBtn, nextId = 0;

    function addArea(focus, a) {
      a = a || C.NEW_AREA;
      var i = nextId++, d = document.createElement('div');
      d.className = 'crow'; d.dataset.row = i;
      var title = name(a[0]);
      d.innerHTML =
        '<div class="crow__head"><div class="crow__name"><b class="ttl">' + esc(title) + '</b><small id="m' + i + '">0 ' + T.m2 + '</small></div>' +
        '<div class="crow__side"><span class="crow__tot" id="g' + i + '">0 ' + T.m2 + '</span>' +
        '<button type="button" class="del" aria-label="' + esc(T.remove + title) + '"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4"/></svg></button></div></div>' +
        '<div class="crow__fields crow__fields--4">' +
          ui.field({ id: 'l' + i, label: T.l, unit: T.m, placeholder: '0' }) +
          ui.field({ id: 'w' + i, label: T.w, unit: T.m, placeholder: '0' }) +
          ui.field({ id: 'n' + i, label: T.n, placeholder: '1' }) +
          ui.field({ id: 'o' + i, label: T.o, unit: T.m2, placeholder: '0' }) +
          ui.select({ id: 't' + i, label: T.t, options: C.TYPES.map(function (t) { return [t[0], name(t[0])]; }), value: C.TYPES[a[1]][0] }) +
          ui.select({ id: 's' + i, label: T.s, options: C.SURF.map(function (s) { return [s, surf(s)]; }), value: C.SURF[a[2]] }) +
          ui.select({ id: 'k' + i, label: T.k, options: C.SKIRT.map(function (s, k) { return [s, SKIRT_LABEL[k]]; }), value: C.SKIRT[a[3]] }) +
          ui.field({ id: 'dr' + i, label: T.dr, unit: T.m, placeholder: '0' }) +
        '</div>';
      d.querySelector('.del').addEventListener('click', function () { d.remove(); });
      box.insertBefore(d, addBtn);
      if (focus) $('l' + i).focus();
    }

    function build(form, summary) {
      var D = C.DEFAULTS;
      form.innerHTML =
        ui.panel({ n: 1, id: 'cp-general', title: T.s1, body:
          '<div class="cgrid cgrid--3">' +
            ui.field({ id: 'wMin', label: T.wMin, unit: '%', value: D.wMin }) +
            ui.field({ id: 'wAvg', label: T.wAvg, unit: '%', value: D.wAvg }) +
            ui.field({ id: 'wMax', label: T.wMax, unit: '%', value: D.wMax }) +
            ui.field({ id: 'wExtra', label: T.wExtra, unit: '%', value: D.wExtra }) +
            ui.field({ id: 'joint', label: T.joint, unit: T.mm, value: D.joint }) +
          '</div><p class="cnote">' + T.s1note + '</p>' }) +
        ui.panel({ n: 2, id: 'cp-types', title: T.s2, hint: T.s2hint, body:
          '<div class="crows" id="types">' + C.TYPES.map(function (t, k) {
            return '<div class="citem"><div class="crow__head"><div class="crow__name"><b>' + name(t[0]) + '</b><small>' + name(t[1]) + '</small></div>' +
              '<span class="crow__tot" id="tp' + k + '">—</span></div><div class="crow__fields crow__fields--4">' +
              ui.field({ id: 'tl' + k, label: T.tl, unit: T.cm, placeholder: '0' }) + ui.field({ id: 'tw' + k, label: T.tw, unit: T.cm, placeholder: '0' }) +
              ui.field({ id: 'tc' + k, label: T.tc, unit: T.m2, placeholder: '0' }) + ui.field({ id: 'tr' + k, label: T.tr, unit: T.egpM2, placeholder: '0' }) +
              '</div></div>';
          }).join('') + '</div>' }) +
        ui.panel({ n: 3, id: 'cp-areas', title: T.s3, hint: T.s3hint, body:
          '<div class="crows" id="areas"><button type="button" class="cadd" id="addArea"><span aria-hidden="true">+</span> ' + T.add + '</button></div>' +
          ui.sumline(T.sumArea, 'sumArea', T.m2) }) +
        ui.panel({ n: 4, id: 'cp-skirting', title: T.s4, body:
          '<div class="cgrid cgrid--2">' +
            ui.field({ id: 'skH', label: T.skH, unit: T.cm, value: D.skH }) +
            ui.field({ id: 'skX', label: T.skX, unit: '%', value: D.skX }) +
          '</div><p class="cnote">' + T.s4note + '</p>' + ui.sumline(T.sumSk, 'sumSk', T.m2) }) +
        ui.panel({ n: 5, id: 'cp-order', title: T.s5, fold: true, body:
          '<div class="cgrid cgrid--3">' +
            ui.field({ id: 'glueCov', label: T.glueCov, unit: T.m2, placeholder: T.glueCovPh }) +
            ui.field({ id: 'gluePrice', label: T.gluePrice, unit: T.egp, placeholder: T.pricePh }) +
            ui.field({ id: 'supplier', label: T.supplier, placeholder: T.supplierPh }) +
          '</div><p class="cnote">' + T.s5note + '</p>' });
      summary.innerHTML =
        ui.hero('kCartons', '', T.heroL) +
        '<div class="ckpis">' +
          ui.kpi('kRange', '', T.range) + ui.kpi('kArea', '', T.area) +
          ui.kpi('kCost', 'kCostL', T.cost, ' ckpi--wide') +
          ui.kpi('kSup', 'kSupL', '', ' ckpi--wide ckpi--text') +
        '</div>' +
        '<p class="calc__alert" id="check" role="status"></p>' +
        '<p class="cbreak__title label">' + T.breakdown + '</p><dl class="cbreak cbreak--grid" id="cmp"></dl>';
      box = $('areas'); addBtn = $('addArea');
      addBtn.addEventListener('click', function () { addArea(true); });
      C.AREAS.forEach(function (a) { addArea(false, a); });
    }

    function calc() {
      var rows = box.querySelectorAll('.crow');
      var r = C.compute({
        wMin: $('wMin').value, wAvg: $('wAvg').value, wMax: $('wMax').value, wExtra: $('wExtra').value, joint: $('joint').value,
        skH: $('skH').value, skX: $('skX').value, glueCov: $('glueCov').value, gluePrice: $('gluePrice').value, supplier: $('supplier').value,
        types: C.TYPES.map(function (t, k) { return { L: $('tl' + k).value, W: $('tw' + k).value, C: $('tc' + k).value, P: $('tr' + k).value }; }),
        areas: Array.prototype.map.call(rows, function (row) {
          var i = row.dataset.row;
          return { name: row.querySelector('.ttl').textContent, L: $('l' + i).value, W: $('w' + i).value, n: $('n' + i).value, o: $('o' + i).value,
                   t: $('t' + i).value, s: $('s' + i).value, k: $('k' + i).value, dr: $('dr' + i).value };
        })
      });
      var tot = r.tot;
      rows.forEach(function (row, k) {
        var i = row.dataset.row, x = r.rows[k];
        $('m' + i).textContent = esc(name(x.type)) + ' · ' + surf(x.s) + (x.sk ? T.skOf + fmt(x.sk, 2) + ' ' + T.m2 : '');
        $('g' + i).textContent = fmt(x.a, 2) + ' ' + T.m2;
      });
      r.T.forEach(function (t, k) { $('tp' + k).textContent = t.perCtn === null ? '—' : t.perCtn + T.perCtn; });
      var verdictLong = T.supLong[r.verdict || 'none'];
      var range = tot.max ? T.rangeV(tot.min, tot.max) : '—';

      $('sumArea').textContent = fmt(r.net, 2);
      $('sumSk').textContent = fmt(r.skAll, 2);
      $('kCartons').textContent = fmt(tot.avg);
      $('kRange').textContent = range;
      $('kArea').textContent = fmt(r.net + r.skAll, 2);
      $('kCost').textContent = r.all === null ? '—' : fmt(r.all);
      $('kCostL').textContent = r.all === null ? T.costMissing : T.cost;
      $('kCostL').setAttribute('data-state', r.all === null ? 'unpriced' : 'priced');
      $('kSup').textContent = r.verdict === null ? '—' : T.sup[r.verdict];
      $('kSup').setAttribute('data-state', r.verdict || 'none');
      $('kSupL').textContent = r.verdict === null ? T.supMissing : T.supL(fmt(r.sup), fmt(tot.avg));
      $('cmp').innerHTML = r.T.filter(function (t) { return t.area + t.sk > 0; }).map(function (t) {
        return '<dt>' + name(t.name) + ' (' + name(t.use) + ')</dt><dd>' + fmt(t.avg) + ' ' + T.carton + ' · ' + fmt(t.pieces) + ' ' + T.piece + '</dd>';
      }).join('') +
        '<dt>' + T.after + '</dt><dd>' + fmt(tot.after, 2) + ' ' + T.m2 + '</dd>' +
        '<dt>' + T.tileCost + '</dt><dd>' + (tot.cost === null ? '—' : fmt(tot.cost) + ' ' + T.egp) + '</dd>' +
        '<dt>' + T.bags + '</dt><dd>' + (r.bags === null ? '—' : fmt(r.bags) + ' ' + T.bag + (r.glueCost === null ? '' : ' · ' + fmt(r.glueCost) + ' ' + T.egp)) + '</dd>' +
        '<dt>' + T.cmpSup + '</dt><dd>' + verdictLong + (r.verdict === null ? '' : T.diff(fmt(r.sup - tot.avg))) + '</dd>';
      $('check').textContent = r.missing ? T.missing : '';
      $('check').setAttribute('data-state', r.missing ? 'missing' : '');

      var opt = function (v, dg) { return v === null || v === undefined ? '—' : fmt(v, dg); };
      var p = r.p;
      var aRows = r.A.map(function (a) {
        return '<tr><td class="l">' + esc(a.name) + '</td><td>' + name(a.type) + '</td><td>' + surf(a.s) + '</td><td>' + opt(a.L, 2) + '</td><td>' + opt(a.W, 2) + '</td><td>' + fmt(a.n, 2) +
          '</td><td>' + fmt(a.o, 2) + '</td><td class="hi">' + fmt(a.a, 2) + '</td><td>' + (a.sk ? fmt(a.sk, 2) : '—') + '</td></tr>';
      }).join('');
      var tRows = r.T.filter(function (t) { return t.area + t.sk > 0; }).map(function (t) {
        return '<tr><td class="l">' + name(t.name) + ' (' + name(t.use) + ')</td><td>' + (t.L && t.W ? '⁦' + fmt(t.L, 1) + '×' + fmt(t.W, 1) + '⁩' : '—') + '</td><td>' + opt(t.C, 2) +
          '</td><td>' + fmt(t.area, 2) + '</td><td>' + fmt(t.sk, 2) + '</td><td>' + fmt(t.after, 2) + '</td><td>' + t.min + '</td><td class="hi">' + t.avg + '</td><td>' + t.max +
          '</td><td>' + fmt(t.pieces) + '</td><td>' + opt(t.cost) + '</td></tr>';
      }).join('');
      var th = function (cols) { return '<thead><tr>' + cols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead>'; };
      ui.report({
        title: T.rTitle, tool: T.rTool,
        kpis: [[fmt(tot.avg), T.rAvg], [range, T.range], [fmt(r.net + r.skAll, 2), T.rArea], [opt(r.all), T.cost]],
        body:
          '<p class="r-note">' + T.rNote(fmt(p.wMin * 100, 1), fmt(p.wAvg * 100, 1), fmt(p.wMax * 100, 1), fmt(p.wX * 100, 1), fmt(p.j, 1), fmt(p.skH, 1), fmt(p.skX * 100, 1)) + '</p>' +
          '<h2>' + T.rAreas + '</h2><table>' + th(T.rAreaCols) + '<tbody>' + aRows +
          '</tbody><tfoot><tr><td>' + T.total + '</td><td></td><td></td><td></td><td></td><td></td><td></td><td class="hi">' + fmt(r.net, 2) + '</td><td>' + fmt(r.skAll, 2) + '</td></tr></tfoot></table>' +
          '<h2>' + T.rTypes + '</h2><table>' + th(T.rTypeCols) + '<tbody>' + tRows +
          '</tbody><tfoot><tr><td>' + T.total + '</td><td></td><td></td><td>' + fmt(tot.area, 2) + '</td><td>' + fmt(tot.sk, 2) + '</td><td>' + fmt(tot.after, 2) + '</td><td>' + tot.min +
          '</td><td class="hi">' + tot.avg + '</td><td>' + tot.max + '</td><td></td><td>' + opt(tot.cost) + '</td></tr></tfoot></table>' +
          '<p class="r-note">' + T.rGlue + (r.bags === null ? '—' : fmt(r.bags) + ' ' + T.bag + (r.glueCost === null ? '' : ' = ' + fmt(r.glueCost) + ' ' + T.egp)) +
            T.rSup + (r.sup === null ? '—' : fmt(r.sup) + T.rCartons + verdictLong) + '</p>' +
          '<p class="r-warn">' + T.warn + '</p>'
      });
      return { value: fmt(tot.avg), label: T.dock };
    }

    return { build: build, calc: calc, explain: T.explain, warn: T.warn };
  });
})();
