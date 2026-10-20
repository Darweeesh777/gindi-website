/*
 * Electrical Wire Calculator — the page (English / Arabic).
 * Arithmetic: wire-calc.js (unchanged from static/Tools/wire-calculator.txt).
 * Element ids, row numbers and option values are the original's.
 */
(function () {
  'use strict';
  var ui = window.GindiCalcUI, C = window.GindiCalc && window.GindiCalc.wire;
  if (!ui || !C) return;
  var fmt = ui.fmt, esc = ui.esc, $ = ui.$, ar = ui.lang === 'ar';

  var T = ar ? {
    s1: 'المدخلات العامة', area: 'مساحة الشقة', areaPh: 'مثلًا 120', roll: 'طول اللفة الواحدة', ref: 'المساحة المرجعية للأطوال', margin: 'هامش اختلاف الأطوال (±)',
    wmin: 'الهالك — الحد الأدنى', wavg: 'الهالك — المتوسط', wmax: 'الهالك — الحد الأعلى',
    s1note: 'بنود الإنارة ومفاتيحها والبرايز تُضرب أطوالها في (مساحة الشقة ÷ المساحة المرجعية). إذا تُركت مساحة الشقة فارغة تُحسب دون تحجيم.',
    s2: 'تفصيل الدوائر',
    s2hint: 'لكل بند أدخل العدد وطول الوحدة. لكل غرفة خط إنارة ومفتاحه، وخط بريزة واحد والبرايز الأخرى تمديدات منه، وكل خانة تكييف أو سخان فوري = جهاز واحد. الإجمالي = العدد × الطول × عدد الأسلاك، والبنود التي «تتأثر بالمساحة» تُضرب في (مساحة الشقة ÷ المساحة المرجعية).',
    types: [
      { name: 'غرفة', unit: 'غرفة', note: 'إنارة الغرفة ومفتاحها + خط البرايز وتمديداته' },
      { name: 'غسالة', note: 'خط مستقل' }, { name: 'غسالة أطباق', note: 'خط مستقل' },
      { name: 'تكييفات', unit: 'تكييف', note: 'كل خانة = تكييف واحد' },
      { name: 'سخان فوري', unit: 'سخان فوري', note: 'كل خانة = سخان واحد على خط مستقل' },
      { name: 'فرن / بوتاجاز كهربائي', note: 'خط مستقل' },
      { name: 'بند إضافي ١', note: 'مثلًا كابل العداد أو أي خط إضافي' }, { name: 'بند إضافي ٢', note: 'مثلًا كابل العداد أو أي خط إضافي' }
    ],
    add: 'إضافة ', remove: 'حذف ', count: 'العدد', switches: 'مفاتيح الإنارة', lenRoom: 'طول خط الإنارة', lenRepeat: 'الطول', lenUnit: 'طول الوحدة',
    size: 'مقاس السلك', wires: 'عدد الأسلاك في الخط', scale: 'يتأثر بالمساحة؟', yes: 'نعم', no: 'لا', itemName: 'اسم البند (اختياري)',
    light: 'الإنارة', sockets: 'البرايز (مقاس 2 مم²)', sn: 'عدد البرايز', sl: 'طول خط البريزة', se: 'طول التمديدة لكل بريزة إضافية', earth: 'البرايز مؤرَّضة؟',
    earthYes: 'نعم (3 أسلاك)', earthNo: 'لا (سلكان)', sumLen: 'إجمالي الأطوال', m: 'م', m2: 'م²', mm2: 'مم²', egp: 'ج',
    s3: 'اللفات حسب مقاس السلك', cols: ['المقاس', 'الطول (م)', 'بعد الهالك (م)', 'أدنى', 'متوسط', 'أعلى', 'سعر اللفة (ج)', 'التكلفة'], total: 'الإجمالي',
    rollPrice: function (s) { return 'سعر لفة ' + s + ' مم²'; },
    s3note: function (d) { return 'اللفات مقرّبة لأعلى لكل مقاس. الأسعار مأخوذة من <b>قائمة أسعار السويدي للكابلات (سلك نحاس مجدول، لفة 100 م، شاملة الضريبة)</b> (' + d + ')، ويمكنك تعديلها إذا كان سعر السوق عندك مختلفًا.'; },
    s4: 'المقارنة مع طلب الكهربائي', elec: 'عدد اللفات التي طلبها الكهربائي', elecPh: 'اتركه فارغًا إن لم يوجد',
    cElec: 'اللفات التي طلبها الكهربائي', cRange: 'نطاق الحسبة (أدنى – أعلى)', cDiff: 'الفرق عن المتوسط', rolls: 'لفة',
    verdict: { none: 'أدخل عدد اللفات التي طلبها الكهربائي للمقارنة.', high: 'أعلى من النطاق: اسأله من أين جاء الرقم وبالتفصيل.',
               low: 'أقل من النطاق: تأكد أنه لا يوجد بند ناقص.', 'in': 'داخل النطاق المعقول ✓' },
    heroL: 'إجمالي اللفات (متوسط) بعد الهالك', range: 'النطاق المتوقع (لفة)', lenL: 'متر قبل الهالك', lenLArea: function (a) { return 'متر قبل الهالك — شقة ' + a + ' م²'; },
    costL: 'التكلفة التقديرية (جنيه)', costNone: 'أدخل أسعار اللفات لتظهر التكلفة', dock: 'لفة (متوسط)',
    partLight: ' — إنارة', partSwitch: ' — مفتاح إنارة', partSockets: ' — برايز', partUngrounded: ' — برايز (بدون أرضي)',
    warn: 'الحسبة تقريبية وتتغير حسب توزيع اللوحة وعدد النقاط وأطوال المسارات والأحمال، ويجب أن يعتمدها مهندس كهرباء مختص.',
    rTitle: 'تقرير كميات أسلاك الكهرباء', rTool: 'حاسبة كميات أسلاك الكهرباء', rAvg: 'إجمالي اللفات (متوسط)', rLen: 'إجمالي الأطوال (متر قبل الهالك)', rArea: 'مساحة الشقة (م²)',
    rSizes: 'عدد اللفات لكل مقاس سلك', rCols: ['المقاس', 'الطول (م)', 'بعد الهالك (م)', 'أدنى', 'متوسط', 'أعلى'], rCost: 'التكلفة (ج)',
    rNote: function (roll, a, b, c, m) { return 'طول اللفة ' + roll + ' م · الهالك ' + a + '% / ' + b + '% / ' + c + '% · هامش الأطوال ±' + m + '% · اللفات مقرّبة لأعلى لكل مقاس.'; },
    rPrices: function (d) { return ' · الأسعار من قائمة السويدي (مجدول) ' + d + '، وقد تتغير.'; },
    rParts: 'تفصيل البنود', rPartCols: ['البند', 'المقاس', 'العدد', 'الطول (م)'], rNone: 'لا توجد بنود مسجلة',
    rCmp: 'المقارنة مع طلب الكهربائي', rAsked: function (e) { return 'طلب الكهربائي <b>' + e + '</b> لفة · '; },
    explain: [
      ['الخط (اللينية)', 'الدائرة التي تخرج من قاطع في اللوحة وتخدم مجموعة نقاط أو جهازًا واحدًا.'],
      ['عدد الأسلاك', 'كل خط = 3 أسلاك: فاز + نيوترال + أرضي، فيُضرب الطول في 3.'],
      ['مفتاح الإنارة', 'السلك النازل من السقف إلى المفتاح، ويُحسب مع كل غرفة: سلكان (المفتاح يقطع الفاز فقط) بطول ثابت 5 م لكل مفتاح، مقاس 1.5 مم².'],
      ['البرايز', 'لكل غرفة خط بريزة واحد من اللوحة إلى أول بريزة، وباقي برايز الغرفة تمديدات منه. الطول = طول الخط + (عدد البرايز − 1) × طول التمديدة، ويُضرب في 3 أسلاك (فاز + نيوترال + أرضي) بمقاس 2 مم²، أو في سلكين فقط إذا كانت البرايز غير مؤرَّضة.'],
      ['المقاسات', 'الإنارة 1.5 مم²، البرايز 2 مم²، الغسالات والتكييفات 4 مم²، السخان الفوري والفرن 6 مم².'],
      ['المساحة', 'الإنارة ومفاتيحها والبرايز يُضرب طولها في مساحة الشقة ÷ المساحة المرجعية. إذا تُركت مساحة الشقة فارغة تُحسب دون تحجيم. الأجهزة خطوط مستقلة لا تتأثر بالمساحة.'],
      ['الهالك والنطاق', 'الهالك 10% أدنى و12% متوسط و15% أعلى، وهامش ±15% للأطوال يعطي النطاق الأدنى والأعلى للفات.'],
      ['الغرف والأجهزة', 'كل غرفة = خط إنارة + مفتاح إنارة + خط برايز بتمديداته (يمكنك زيادة عدد المفاتيح إذا كان في الغرفة أكثر من مفتاح). كل خانة تكييف أو سخان فوري = جهاز واحد. اضغط «إضافة» لتظهر خانة جديدة بنفس المواصفات.'],
      ['غير محسوب', 'كابل العداد إلى اللوحة (غالبًا 10 أو 16 مم²) ويمكنك إضافته في بند إضافي، والتيار الخفيف (إنتركم ودش وإنترنت وكاميرات).']
    ]
  } : {
    s1: 'General inputs', area: 'Apartment area', areaPh: 'e.g. 120', roll: 'Length of one roll', ref: 'Reference area for the lengths', margin: 'Length variation margin (±)',
    wmin: 'Waste — minimum', wavg: 'Waste — average', wmax: 'Waste — maximum',
    s1note: 'Lighting, light switches and sockets are multiplied by (apartment area ÷ reference area). If the apartment area is left empty, no scaling is applied.',
    s2: 'Circuit details',
    s2hint: 'For each item, enter the count and the length per unit. Each room has a lighting line and its switch, plus one socket line with the room’s other sockets as extensions from it; each air-conditioner or instant-heater box is one appliance. Total = count × length × number of wires, and items that “scale with area” are multiplied by (apartment area ÷ reference area).',
    types: [
      { name: 'Room', unit: 'Room', note: 'Room lighting and its switch + the socket line and its extensions' },
      { name: 'Washing machine', note: 'Dedicated circuit' }, { name: 'Dishwasher', note: 'Dedicated circuit' },
      { name: 'Air conditioners', unit: 'Air conditioner', note: 'Each box = one air conditioner' },
      { name: 'Instant water heater', unit: 'Instant water heater', note: 'Each box = one heater on its own circuit' },
      { name: 'Electric oven / cooker', note: 'Dedicated circuit' },
      { name: 'Extra item 1', note: 'For example the meter cable, or any additional circuit' }, { name: 'Extra item 2', note: 'For example the meter cable, or any additional circuit' }
    ],
    add: 'Add ', remove: 'Remove ', count: 'Count', switches: 'Light switches', lenRoom: 'Lighting line length', lenRepeat: 'Length', lenUnit: 'Length per unit',
    size: 'Wire size', wires: 'Wires in the line', scale: 'Scales with the area?', yes: 'Yes', no: 'No', itemName: 'Item name (optional)',
    light: 'Lighting', sockets: 'Sockets (2 mm²)', sn: 'Number of sockets', sl: 'Socket line length', se: 'Extension per extra socket', earth: 'Earthed sockets?',
    earthYes: 'Yes (3 wires)', earthNo: 'No (2 wires)', sumLen: 'Total length', m: 'm', m2: 'm²', mm2: 'mm²', egp: 'EGP',
    s3: 'Rolls by wire size', cols: ['Size', 'Length (m)', 'After waste (m)', 'Min', 'Average', 'Max', 'Roll price (EGP)', 'Cost'], total: 'Total',
    rollPrice: function (s) { return 'Price of a ' + s + ' mm² roll'; },
    s3note: function (d) { return 'Rolls are rounded up for each size. Prices are taken from the <b>Elsewedy Cables price list (stranded copper wire, 100 m roll, including tax)</b> (' + d + '); you can change them if your market price differs.'; },
    s4: 'Comparison with the electrician’s request', elec: 'Rolls the electrician asked for', elecPh: 'Leave empty if none',
    cElec: 'Rolls the electrician asked for', cRange: 'Calculated range (min – max)', cDiff: 'Difference from the average', rolls: 'rolls',
    verdict: { none: 'Enter the number of rolls the electrician asked for to compare.', high: 'Above the range: ask where the figure comes from, in detail.',
               low: 'Below the range: make sure no item is missing.', 'in': 'Within a reasonable range ✓' },
    heroL: 'rolls in total (average), after waste', range: 'Expected range (rolls)', lenL: 'metres before waste', lenLArea: function (a) { return 'metres before waste — ' + a + ' m² apartment'; },
    costL: 'Estimated cost (EGP)', costNone: 'Enter roll prices to see the cost', dock: 'rolls (average)',
    partLight: ' — lighting', partSwitch: ' — light switch', partSockets: ' — sockets', partUngrounded: ' — sockets (no earth)',
    warn: 'This is an approximate calculation. It changes with the panel layout, the number of points, the cable routes and the loads, and it must be approved by a qualified electrical engineer.',
    rTitle: 'Electrical wire quantities report', rTool: 'Electrical Wire Calculator', rAvg: 'Total rolls (average)', rLen: 'Total length (metres before waste)', rArea: 'Apartment area (m²)',
    rSizes: 'Rolls for each wire size', rCols: ['Size', 'Length (m)', 'After waste (m)', 'Min', 'Average', 'Max'], rCost: 'Cost (EGP)',
    rNote: function (roll, a, b, c, m) { return 'Roll length ' + roll + ' m · waste ' + a + '% / ' + b + '% / ' + c + '% · length margin ±' + m + '% · rolls rounded up for each size.'; },
    rPrices: function (d) { return ' · Prices from the Elsewedy list (stranded) ' + d + '; they may change.'; },
    rParts: 'Items', rPartCols: ['Item', 'Size', 'Count', 'Length (m)'], rNone: 'No items entered',
    rCmp: 'Comparison with the electrician’s request', rAsked: function (e) { return 'The electrician asked for <b>' + e + '</b> rolls · '; },
    explain: [
      ['Circuit', 'A line leaving a breaker in the panel, serving a group of points or a single appliance.'],
      ['Number of wires', 'Each circuit = 3 wires: phase + neutral + earth, so the length is multiplied by 3.'],
      ['Light switch', 'The wire from the ceiling down to the switch, counted with each room: 2 wires (the switch breaks the phase only), a fixed 5 m per switch, 1.5 mm².'],
      ['Sockets', 'Each room has one socket line from the panel to the first socket; the room’s other sockets are extensions from it. Length = line length + (number of sockets − 1) × extension length, multiplied by 3 wires (phase + neutral + earth) at 2 mm², or by 2 wires only if the sockets are not earthed.'],
      ['Sizes', 'Lighting 1.5 mm², sockets 2 mm², washing machines and air conditioners 4 mm², instant heater and oven 6 mm².'],
      ['Area', 'Lighting, light switches and sockets are multiplied by apartment area ÷ reference area. If the apartment area is empty, no scaling is applied. Appliances are separate circuits and don’t scale with the area.'],
      ['Waste and range', 'Waste is 10% minimum, 12% average and 15% maximum, and a ±15% length margin gives the minimum and maximum number of rolls.'],
      ['Rooms and appliances', 'Each room = a lighting line + a light switch + a socket line with its extensions (you can increase the switches if the room has more than one). Each air-conditioner or instant-heater box is one appliance. Choose “Add” for a new box with the same specification.'],
      ['Not included', 'The meter-to-panel cable (usually 10 or 16 mm²), which you can add as an extra item, and low-current wiring (intercom, satellite, internet and cameras).']
    ]
  };

  // The price list's date, as written in the data ("تحديث 2 يونيو 2026"), on the English page.
  var MONTHS = { 'يناير': 'January', 'فبراير': 'February', 'مارس': 'March', 'أبريل': 'April', 'مايو': 'May', 'يونيو': 'June',
                 'يوليو': 'July', 'أغسطس': 'August', 'سبتمبر': 'September', 'أكتوبر': 'October', 'نوفمبر': 'November', 'ديسمبر': 'December' };
  var priceDate = ar ? C.PRICE_DATE : C.PRICE_DATE.replace('تحديث', 'updated').replace(/[؀-ۿ]+/g, function (w) { return MONTHS[w] || w; });

  ui.register('wire', function () {
    var box, nextId = 0;

    function addRow(ti, focus) {
      var t = C.TYPES[ti], L = T.types[ti], i = nextId++, g = $('grp' + ti);
      var d = document.createElement('div');
      d.className = 'crow'; d.dataset.row = i; d.dataset.type = ti;
      d.innerHTML =
        '<div class="crow__head"><div class="crow__name"><b class="ttl"></b><small>' + L.note + '</small></div>' +
        '<div class="crow__side"><span class="crow__tot" id="g' + i + '">0 ' + T.m + '</span>' +
        (t.repeat ? '<button type="button" class="del" aria-label="' + T.remove + '"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4"/></svg></button>' : '') +
        '</div></div>' +
        (t.extra ? '<div class="crow__fields">' + ui.textField({ id: 'n' + i, label: T.itemName, cls: 'cf--wide' }) + '</div>' : '') +
        (t.room ? '<p class="crow__sub">' + T.light + '</p>' : '') +
        '<div class="crow__fields">' +
          (t.repeat ? '' : ui.field({ id: 'c' + i, label: T.count, mode: 'numeric', placeholder: '0' })) +
          (t.room ? ui.field({ id: 'k' + i, label: T.switches, mode: 'numeric', value: '1' }) : '') +
          ui.field({ id: 'l' + i, label: t.room ? T.lenRoom : t.repeat ? T.lenRepeat : T.lenUnit, unit: T.m, value: String(t.len) }) +
          ui.select({ id: 's' + i, label: T.size, options: C.SIZES.map(function (s) { return [s, s + ' ' + T.mm2]; }), value: t.size }) +
          ui.field({ id: 'w' + i, label: T.wires, value: String(t.wires), mode: 'numeric' }) +
          ui.select({ id: 'a' + i, label: T.scale, options: [[C.YES, T.yes], [C.NO, T.no]], value: t.scale ? C.YES : C.NO }) +
        '</div>' +
        (t.room ?
          '<p class="crow__sub">' + T.sockets + '</p><div class="crow__fields">' +
            ui.field({ id: 'sn' + i, label: T.sn, mode: 'numeric', value: '1' }) +
            ui.field({ id: 'sl' + i, label: T.sl, unit: T.m, value: String(C.SOCKET.len) }) +
            ui.field({ id: 'se' + i, label: T.se, unit: T.m, value: String(C.SOCKET.ext) }) +
            ui.select({ id: 'se_e' + i, label: T.earth, options: [['3', T.earthYes], ['2', T.earthNo]], value: '3' }) +
          '</div>' : '');
      var del = d.querySelector('.del');
      if (del) del.addEventListener('click', function () { d.remove(); renumber(ti); });
      var add = $('add' + ti);
      g.insertBefore(d, add || null);
      renumber(ti);
      if (focus) $('l' + i).focus();
    }

    function renumber(ti) {
      var t = C.TYPES[ti], L = T.types[ti], rows = $('grp' + ti).querySelectorAll('.crow');
      rows.forEach(function (r, k) {
        var title = t.repeat ? L.unit + ' ' + (k + 1) : L.name;
        r.querySelector('.ttl').textContent = title;
        var del = r.querySelector('.del');
        if (del) { del.hidden = rows.length === 1; del.setAttribute('aria-label', T.remove + title); }
      });
    }

    function build(form, summary) {
      var D = C.DEFAULTS;
      form.innerHTML =
        ui.panel({ n: 1, id: 'cp-general', title: T.s1, body:
          '<div class="cgrid cgrid--2">' +
            ui.field({ id: 'area', label: T.area, unit: T.m2, placeholder: T.areaPh }) +
            ui.field({ id: 'roll', label: T.roll, unit: T.m, value: D.roll }) +
          '</div>' +
          ui.fold({ body:
            '<div class="cgrid cgrid--2">' +
              ui.field({ id: 'ref', label: T.ref, unit: T.m2, value: D.ref }) +
              ui.field({ id: 'margin', label: T.margin, unit: '%', value: D.margin }) +
            '</div><div class="cgrid cgrid--3">' +
              ui.field({ id: 'wmin', label: T.wmin, unit: '%', value: D.wmin }) +
              ui.field({ id: 'wavg', label: T.wavg, unit: '%', value: D.wavg }) +
              ui.field({ id: 'wmax', label: T.wmax, unit: '%', value: D.wmax }) +
            '</div><p class="cnote">' + T.s1note + '</p>' }) }) +
        ui.panel({ n: 2, id: 'cp-circuits', title: T.s2, hint: T.s2hint, body:
          '<div class="crows" id="items"></div>' + ui.sumline(T.sumLen, 'sumLen', T.m) }) +
        ui.panel({ n: 3, id: 'cp-sizes', title: T.s3, body:
          ui.table(T.s3, '<table><thead><tr>' + T.cols.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('') + '</tr></thead><tbody id="sizes">' +
            C.SIZES.map(function (s, i) {
              return '<tr><th scope="row" class="ctable__size">' + s + ' ' + T.mm2 + '</th><td id="L' + i + '"></td><td id="D' + i + '"></td><td id="E' + i + '"></td><td class="res" id="F' + i +
                '"></td><td id="G' + i + '"></td><td><label class="visually-hidden" for="p' + i + '">' + T.rollPrice(s) + ' (' + T.egp + ')</label>' +
                '<div class="cf__box"><input class="cf__input" type="number" id="p' + i + '" min="0" step="any" inputmode="decimal" value="' + (C.PRICES[s] || '') + '" aria-describedby="p' + i + '-msg"></div>' +
                '<p class="cf__msg" id="p' + i + '-msg" hidden></p></td><td id="I' + i + '"></td></tr>';
            }).join('') +
            '</tbody><tfoot><tr><th scope="row">' + T.total + '</th><td id="tLen">0</td><td id="tAfter">0</td><td id="tMin">0</td><td id="tAvg">0</td><td id="tMax">0</td><td></td><td id="tCost"></td></tr></tfoot></table>') +
          '<p class="cnote">' + T.s3note(priceDate) + '</p>' }) +
        ui.panel({ n: 4, id: 'cp-compare', title: T.s4, body:
          '<div class="cgrid cgrid--2">' + ui.field({ id: 'elec', label: T.elec, mode: 'numeric', placeholder: T.elecPh }) + '</div>' +
          '<dl class="ccmp">' +
            '<div><dt>' + T.cElec + '</dt><dd id="cElec">—</dd></div>' +
            '<div><dt>' + T.cRange + '</dt><dd id="cRange">—</dd></div>' +
            '<div><dt>' + T.cDiff + '</dt><dd id="cDiff">—</dd></div>' +
          '</dl><p class="cverdict" id="verdict" role="status">' + T.verdict.none + '</p>' });
      summary.innerHTML =
        ui.hero('kTotal', '', T.heroL) +
        '<div class="ckpis">' + ui.kpi('kRange', '', T.range) + ui.kpi('kLen', 'kLenL', T.lenL) +
          ui.kpi('wCost', 'wCostL', T.costL, ' ckpi--wide') + '</div>';
      box = $('items');
      C.TYPES.forEach(function (t, ti) {
        var g = document.createElement('div');
        g.className = 'cgroup'; g.id = 'grp' + ti;
        box.appendChild(g);
        if (t.repeat) {
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'cadd'; b.id = 'add' + ti;
          b.innerHTML = '<span aria-hidden="true">+</span> ' + T.add + T.types[ti].unit;
          b.addEventListener('click', function () { addRow(ti, true); });
          g.appendChild(b);
        }
        addRow(ti, false);
      });
    }

    function calc() {
      var rows = box.querySelectorAll('.crow');
      var val = function (id) { var el = $(id); return el ? el.value : undefined; };
      var r = C.compute({
        area: $('area').value, ref: $('ref').value, roll: $('roll').value, margin: $('margin').value,
        wmin: $('wmin').value, wavg: $('wavg').value, wmax: $('wmax').value, elec: $('elec').value,
        prices: C.SIZES.map(function (s, i) { return $('p' + i).value; }),
        rows: Array.prototype.map.call(rows, function (row) {
          var i = row.dataset.row;
          return { title: row.querySelector('.ttl').textContent, c: val('c' + i), k: val('k' + i), l: $('l' + i).value, s: $('s' + i).value,
                   w: $('w' + i).value, a: $('a' + i).value, sn: val('sn' + i), sl: val('sl' + i), se: val('se' + i), se_e: val('se_e' + i), n: val('n' + i) };
        })
      });
      rows.forEach(function (row, k) { $('g' + row.dataset.row).textContent = fmt(r.rowLen[k], 1) + ' ' + T.m; });
      $('sumLen').textContent = fmt(r.sum, 1);
      r.S.forEach(function (x, i) {
        $('L' + i).textContent = fmt(x.L, 1); $('D' + i).textContent = fmt(x.D, 1);
        $('E' + i).textContent = x.mn; $('F' + i).textContent = x.av; $('G' + i).textContent = x.mx;
        $('I' + i).textContent = x.p === null ? '' : fmt(x.av * x.p);
      });
      var Tt = r.T;
      $('tLen').textContent = fmt(Tt.len, 1); $('tAfter').textContent = fmt(Tt.after, 1);
      $('tMin').textContent = Tt.min; $('tAvg').textContent = Tt.avg; $('tMax').textContent = Tt.max;
      $('tCost').textContent = r.anyPrice ? fmt(Tt.cost) + ' ' + T.egp : '';

      var range = Tt.max === 0 ? '—' : Tt.min + ' – ' + Tt.max;
      $('kTotal').textContent = Tt.avg;
      $('kRange').textContent = range;
      $('kLen').textContent = fmt(Tt.len, 1);
      $('kLenL').textContent = r.area === null ? T.lenL : T.lenLArea(fmt(r.area, 1));
      $('wCost').textContent = r.anyPrice ? fmt(Tt.cost) : '—';
      $('wCostL').textContent = r.anyPrice ? T.costL : T.costNone;

      var e = r.e, v = $('verdict');
      $('cElec').textContent = e === null ? '—' : fmt(e, 1);
      $('cRange').textContent = Tt.max === 0 ? '—' : range + ' ' + T.rolls;
      $('cDiff').textContent = e === null ? '—' : (e - Tt.avg > 0 ? '+' : '') + fmt(e - Tt.avg, 1) + ' ' + T.rolls;
      v.className = 'cverdict' + (r.verdict === null ? '' : r.verdict === 'in' ? ' ok' : ' bad');
      v.textContent = T.verdict[r.verdict || 'none'];
      v.setAttribute('data-state', r.verdict || 'none');

      var part = { light: T.partLight, 'switch': T.partSwitch, sockets: T.partSockets, 'sockets-ungrounded': T.partUngrounded, '': '' };
      var parts = r.P.filter(function (x) { return x.len > 0; }).map(function (x) {
        return '<tr><td class="l">' + esc(x.name + part[x.part]) + '</td><td>' + x.size + ' ' + T.mm2 + '</td><td>' + fmt(x.qty, 1) + '</td><td>' + fmt(x.len, 1) + '</td></tr>';
      }).join('') || '<tr><td colspan="4">' + T.rNone + '</td></tr>';
      var sizes = r.S.filter(function (x) { return x.L > 0; }).map(function (x) {
        return '<tr><td>' + x.size + ' ' + T.mm2 + '</td><td>' + fmt(x.L, 1) + '</td><td>' + fmt(x.D, 1) + '</td><td>' + x.mn + '</td><td class="hi">' + x.av + '</td><td>' + x.mx + '</td>' +
          (r.anyPrice ? '<td>' + (x.cost === null ? '—' : fmt(x.cost)) + '</td>' : '') + '</tr>';
      }).join('');
      var st = r.settings;
      var kpis = [[Tt.avg, T.rAvg], [Tt.max ? Tt.min + ' – ' + Tt.max : '—', T.range], [fmt(Tt.len, 1), T.rLen]];
      if (r.area !== null) kpis.push([fmt(r.area, 1), T.rArea]);
      ui.report({
        title: T.rTitle, tool: T.rTool, kpis: kpis,
        body:
          '<h2>' + T.rSizes + '</h2><table><thead><tr>' + T.rCols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + (r.anyPrice ? '<th>' + T.rCost + '</th>' : '') +
          '</tr></thead><tbody>' + sizes + '</tbody><tfoot><tr><td>' + T.total + '</td><td>' + fmt(Tt.len, 1) + '</td><td>' + fmt(Tt.after, 1) + '</td><td>' + Tt.min +
          '</td><td class="hi">' + Tt.avg + '</td><td>' + Tt.max + '</td>' + (r.anyPrice ? '<td>' + fmt(Tt.cost) + '</td>' : '') + '</tr></tfoot></table>' +
          '<p class="r-note">' + T.rNote(fmt(st.roll), fmt(st.wmin, 1), fmt(st.wavg, 1), fmt(st.wmax, 1), fmt(st.margin, 1)) + (r.anyPrice ? T.rPrices(priceDate) : '') + '</p>' +
          '<h2>' + T.rParts + '</h2><table><thead><tr>' + T.rPartCols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + parts + '</tbody></table>' +
          (e !== null ? '<h2>' + T.rCmp + '</h2><p class="r-cmp">' + T.rAsked(fmt(e, 1)) + esc(v.textContent) + '</p>' : '') +
          '<p class="r-warn">' + T.warn + '</p>'
      });
      return { value: String(Tt.avg), label: T.dock };
    }

    return { build: build, calc: calc, explain: T.explain, warn: T.warn };
  });
})();
