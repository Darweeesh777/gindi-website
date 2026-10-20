/*
 * Brick Quantity & Cost Calculator — the page (English / Arabic).
 * Arithmetic: bricks-calc.js (unchanged from static/Tools/brick-calculator.txt).
 * Element ids, row numbers and option values are the original's.
 */
(function () {
  'use strict';
  var ui = window.GindiCalcUI, C = window.GindiCalc && window.GindiCalc.bricks;
  if (!ui || !C) return;
  var fmt = ui.fmt, esc = ui.esc, $ = ui.$, ar = ui.lang === 'ar';

  var T = ar ? {
    s1: 'الطوبة والسعر', brick: 'نوع الطوبة ومقاسها', price: 'سعر الألف طوبة', pricePh: 'سعر المورّد', egp: 'ج',
    adv: 'إعدادات متقدمة', waste: 'نسبة الهالك', joint: 'سُمك العرموس (المونة بين الطوب)', cm: 'سم',
    jointHint: 'عادةً 1 سم للطوب العادي، ونحو 0.3 سم للطوب الخفيف المركّب باللاصق. الهالك عادةً من 3% إلى 5%.',
    s2: 'أبعاد الحوائط',
    s2hint: 'لكل حائط أدخل الطول والارتفاع بالمتر، ومساحة الأبواب والشبابيك فيه إن وُجدت (مثلًا باب ⁦0.9×2.1⁩ + شباك ⁦1.2×1.2⁩ = 3.33 م²)، ثم اختر سُمك الحائط.',
    wall: 'حائط', remove: 'حذف ', L: 'الطول', H: 'الارتفاع', O: 'خصم الفتحات', thick: 'سُمك الحائط', m: 'م', m2: 'م²',
    add: 'إضافة حائط', sumArea: 'صافي مساحة الحوائط', net: ' صافي', bricks: 'طوبة',
    sizeInfo: 'الطول × العرض × الارتفاع: ', perM2Half: ' طوبة/م² (نصف طوبة)',
    buyL: function (w) { return 'طوبة للشراء شاملة ' + w + '% هالك'; }, cost: 'التكلفة الإجمالية (جنيه)', costMissing: 'أدخل سعر الألف طوبة لتظهر التكلفة',
    rate: 'طوبة في المتر المربع (نصف طوبة)', cNet: 'عدد الطوب الصافي', cWaste: 'الهالك', cRate2: 'طوب المتر (حائط طوبة)', perM2: ' طوبة/م²',
    dock: 'طوبة للشراء',
    warn: 'الحسبة تقديرية وتتغير حسب مقاس الطوب الفعلي وسُمك العرموس وطريقة التنفيذ، ويجب أن يعتمدها مهندس مدني مختص.',
    rTitle: 'تقرير كمية وتكلفة الطوب', rTool: 'حاسبة كميات وتكلفة الطوب', rBuy: 'طوبة للشراء شاملة الهالك', rArea: 'صافي مساحة الحوائط (م²)',
    rBrick: 'الطوبة: ', rJoint: ' · العرموس ', rWaste: ' · الهالك ', rPrice: ' · سعر الألف طوبة ',
    rWalls: 'تفصيل الحوائط', rCols: ['الحائط', 'الطول (م)', 'الارتفاع (م)', 'الفتحات (م²)', 'السُمك', 'الصافي (م²)', 'طوب/م²', 'عدد الطوب'], total: 'الإجمالي',
    rFormula: function (net, w, gross, buy) { return 'عدد الطوب الصافي ' + net + ' × (1 + ' + w + '% هالك) = ' + gross + '، مقرّبًا لأعلى = ' + buy + ' طوبة.'; },
    explain: [
      ['المساحة الصافية', 'الطول × الارتفاع − مساحة الفتحات.'],
      ['نصف طوبة', 'حائط سُمكه عرض الطوبة: طوب المتر = 10000 ÷ ((طول الطوبة + العرموس) × (ارتفاعها + العرموس)) بالسنتيمتر.'],
      ['طوبة', 'حائط سُمكه طول الطوبة: طوب المتر = 10000 ÷ ((عرض الطوبة + العرموس) × (ارتفاعها + العرموس))، أي نحو ضعف النصف طوبة.'],
      ['طوبة ونصف', 'طوب النصف طوبة + طوب الطوبة.'],
      ['الهالك', 'مجموع الطوب × (1 + الهالك)، ثم يُقرّب لأعلى إلى طوبة كاملة. عادةً من 3% إلى 5%.'],
      ['التكلفة', 'عدد الطوب للشراء ÷ 1000 × سعر الألف طوبة.'],
      ['العرموس', '1 سم للطوب العادي، ونحو 0.3 سم للطوب الخفيف الذي يُركّب باللاصق.'],
      ['المقاسات', 'الشائعة في السوق المصري، وتختلف قليلًا من مصنع لآخر، فراجع مقاس المورّد. البلوك والطوب الخفيف يُبنيان عادةً نصف طوبة.'],
      ['غير محسوب', 'أسمنت ورمل المونة.']
    ]
  } : {
    s1: 'Brick and price', brick: 'Brick type and size', price: 'Price per thousand bricks', pricePh: 'Supplier’s price', egp: 'EGP',
    adv: 'Advanced settings', waste: 'Waste', joint: 'Mortar joint thickness', cm: 'cm',
    jointHint: 'Usually 1 cm for ordinary bricks and about 0.3 cm for lightweight bricks laid with adhesive. Waste is usually 3% to 5%.',
    s2: 'Wall dimensions',
    s2hint: 'For each wall, enter its length and height in metres and the area of any doors and windows in it (for example a 0.9×2.1 door + a 1.2×1.2 window = 3.33 m²), then choose the wall’s thickness.',
    wall: 'Wall', remove: 'Remove ', L: 'Length', H: 'Height', O: 'Openings deduction', thick: 'Wall thickness', m: 'm', m2: 'm²',
    add: 'Add a wall', sumArea: 'Net wall area', net: ' net', bricks: 'bricks',
    sizeInfo: 'Length × width × height: ', perM2Half: ' bricks/m² (half-brick wall)',
    buyL: function (w) { return 'bricks to buy, including ' + w + '% waste'; }, cost: 'Total cost (EGP)', costMissing: 'Enter the price per thousand bricks to see the cost',
    rate: 'bricks per m² (half-brick wall)', cNet: 'Net brick count', cWaste: 'Waste', cRate2: 'Bricks per m² (one-brick wall)', perM2: ' bricks/m²',
    dock: 'bricks to buy',
    warn: 'This is an estimate. It changes with the actual brick size, the joint thickness and the way the work is done, and it should be approved by a qualified civil engineer.',
    rTitle: 'Brick quantity and cost report', rTool: 'Brick Quantity & Cost Calculator', rBuy: 'Bricks to buy, including waste', rArea: 'Net wall area (m²)',
    rBrick: 'Brick: ', rJoint: ' · joint ', rWaste: ' · waste ', rPrice: ' · price per thousand bricks ',
    rWalls: 'Walls', rCols: ['Wall', 'Length (m)', 'Height (m)', 'Openings (m²)', 'Thickness', 'Net (m²)', 'Bricks/m²', 'Bricks'], total: 'Total',
    rFormula: function (net, w, gross, buy) { return 'Net bricks ' + net + ' × (1 + ' + w + '% waste) = ' + gross + ', rounded up = ' + buy + ' bricks.'; },
    explain: [
      ['Net area', 'Length × height − area of the openings.'],
      ['Half brick', 'A wall as thick as the brick’s width: bricks per m² = 10000 ÷ ((brick length + joint) × (brick height + joint)), in centimetres.'],
      ['One brick', 'A wall as thick as the brick’s length: bricks per m² = 10000 ÷ ((brick width + joint) × (brick height + joint)) — about twice the half-brick figure.'],
      ['One and a half', 'The half-brick figure + the one-brick figure.'],
      ['Waste', 'Total bricks × (1 + waste), then rounded up to a whole brick. Usually 3% to 5%.'],
      ['Cost', 'Bricks to buy ÷ 1000 × the price per thousand bricks.'],
      ['Joint', '1 cm for ordinary bricks; about 0.3 cm for lightweight bricks laid with adhesive.'],
      ['Sizes', 'Common sizes in the Egyptian market; they vary slightly between factories, so check your supplier’s size. Blocks and lightweight bricks are usually laid as half-brick walls.'],
      ['Not included', 'Cement and sand for the mortar.']
    ]
  };

  // Brick and thickness names on the English page (the values stay the original's).
  var NAMES = {
    'طوب أحمر طفلي مصمت': 'Solid red clay brick', 'طوب أحمر طفلي مفرغ': 'Hollow red clay brick',
    'طوب أسمنتي مصمت': 'Solid cement brick', 'طوب أسمنتي مفرغ': 'Hollow cement brick', 'بلوك أسمنتي مفرغ': 'Hollow cement block',
    'طوب رملي جيري': 'Sand-lime brick', 'طوب خفيف (خرسانة خلوية)': 'Lightweight brick (aerated concrete)', 'طوب واجهات (فيس)': 'Facing brick'
  };
  var THICK_LABEL = ar ? ['نصف طوبة', 'طوبة', 'طوبة ونصف'] : ['Half brick', 'One brick', 'One and a half bricks'];
  var thickLabel = function (t) { var k = C.THICK.indexOf(t); return k < 0 ? esc(t) : THICK_LABEL[k]; };
  // LRI…PDI keeps "25×12×6" reading left-to-right inside Arabic text
  var dims = function (b) { return '⁦' + b[1] + '×' + b[2] + '×' + b[3] + '⁩ ' + T.cm; };
  var label = function (b) { return (ar ? b[0] : NAMES[b[0]] || b[0]) + '  ' + dims(b); };

  ui.register('bricks', function () {
    var box, addBtn, nextId = 0;

    function addWall(focus, L, H, O) {
      var i = nextId++, d = document.createElement('div');
      d.className = 'crow'; d.dataset.row = i;
      d.innerHTML =
        '<div class="crow__head"><div class="crow__name"><b class="ttl"></b><small id="m' + i + '">0 ' + T.m2 + '</small></div>' +
        '<div class="crow__side"><span class="crow__tot" id="g' + i + '">0 ' + T.bricks + '</span>' +
        '<button type="button" class="del" aria-label="' + T.remove + '"><svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.4"/></svg></button></div></div>' +
        '<div class="crow__fields crow__fields--4">' +
          ui.field({ id: 'l' + i, label: T.L, unit: T.m, value: L || '', placeholder: '0' }) +
          ui.field({ id: 'h' + i, label: T.H, unit: T.m, value: H || '', placeholder: '0' }) +
          ui.field({ id: 'o' + i, label: T.O, unit: T.m2, value: O || '', placeholder: '0' }) +
          ui.select({ id: 't' + i, label: T.thick, options: C.THICK.map(function (t, k) { return [t, THICK_LABEL[k]]; }), value: C.THICK[0] }) +
        '</div>';
      d.querySelector('.del').addEventListener('click', function () { d.remove(); renumber(); });
      box.insertBefore(d, addBtn);
      renumber();
      if (focus) $('l' + i).focus();
    }

    function renumber() {
      var rows = box.querySelectorAll('.crow');
      rows.forEach(function (r, k) {
        var name = T.wall + ' ' + (k + 1);
        r.querySelector('.ttl').textContent = name;
        var del = r.querySelector('.del');
        del.hidden = rows.length === 1;
        del.setAttribute('aria-label', T.remove + name);
      });
    }

    function build(form, summary) {
      var D = C.DEFAULTS;
      form.innerHTML =
        ui.panel({ n: 1, id: 'cp-brick', title: T.s1, body:
          ui.select({ id: 'brick', label: T.brick, options: C.BRICKS.map(function (b, i) { return [i, label(b)]; }), value: D.brick, cls: 'cf--wide' }) +
          '<p class="cinfo" id="sizeInfo"></p>' +
          '<div class="cgrid cgrid--2">' + ui.field({ id: 'price', label: T.price, unit: T.egp, placeholder: T.pricePh }) + '</div>' +
          ui.fold({ title: T.adv, body:
            '<div class="cgrid cgrid--2">' +
              ui.field({ id: 'waste', label: T.waste, unit: '%', value: D.waste }) +
              ui.field({ id: 'joint', label: T.joint, unit: T.cm, value: D.joint }) +
            '</div><p class="cnote">' + T.jointHint + '</p>' }) }) +
        ui.panel({ n: 2, id: 'cp-walls', title: T.s2, hint: T.s2hint, body:
          '<div class="crows" id="walls"><button type="button" class="cadd" id="addWall"><span aria-hidden="true">+</span> ' + T.add + '</button></div>' +
          ui.sumline(T.sumArea, 'sumArea', T.m2) });
      summary.innerHTML =
        ui.hero('kBricks', 'kBricksL', '') +
        '<div class="ckpis">' + ui.kpi('kCost', 'kCostL', T.cost) + ui.kpi('kRate', '', T.rate) + '</div>' +
        '<dl class="cbreak">' +
          '<div><dt>' + T.cNet + '</dt><dd id="cNet">0</dd></div>' +
          '<div><dt>' + T.cWaste + '</dt><dd id="cWaste">0</dd></div>' +
          '<div><dt>' + T.cRate2 + '</dt><dd id="cRate2">0</dd></div>' +
        '</dl>';
      box = $('walls'); addBtn = $('addWall');
      addBtn.addEventListener('click', function () { addWall(true); });
      addWall(false, D.wall[0], D.wall[1], D.wall[2]);
    }

    function calc() {
      var rows = box.querySelectorAll('.crow');
      var r = C.compute({
        brick: $('brick').value, price: $('price').value, waste: $('waste').value, joint: $('joint').value,
        walls: Array.prototype.map.call(rows, function (row) {
          var i = row.dataset.row;
          return { L: $('l' + i).value, H: $('h' + i).value, O: $('o' + i).value, t: $('t' + i).value };
        })
      });
      $('sizeInfo').innerHTML = T.sizeInfo + dims(r.b) + ' · ' + fmt(r.half, 1) + T.perM2Half;
      rows.forEach(function (row, k) {
        var i = row.dataset.row, w = r.walls[k];
        $('m' + i).textContent = fmt(w.a, 2) + ' ' + T.m2 + T.net;
        $('g' + i).textContent = fmt(w.n) + ' ' + T.bricks;
      });
      $('sumArea').textContent = fmt(r.area, 2);
      $('kBricks').textContent = fmt(r.buy);
      $('kBricksL').textContent = T.buyL(fmt(r.waste * 100, 1));
      $('kCost').textContent = r.cost === null ? '—' : fmt(r.cost);
      $('kCostL').textContent = r.cost === null ? T.costMissing : T.cost;
      $('kCostL').setAttribute('data-state', r.cost === null ? 'unpriced' : 'priced');
      $('kRate').textContent = fmt(r.half, 1);
      $('cNet').textContent = fmt(r.net, 1) + ' ' + T.bricks;
      $('cWaste').textContent = fmt(r.gross - r.net, 1) + ' ' + T.bricks;
      $('cRate2').textContent = fmt(r.full, 1) + T.perM2;

      var tr = r.walls.map(function (w, k) {
        return '<tr><td class="l">' + esc(rows[k].querySelector('.ttl').textContent) + '</td><td>' + fmt(w.L, 2) + '</td><td>' + fmt(w.H, 2) + '</td><td>' + fmt(w.O, 2) +
          '</td><td>' + thickLabel(w.t) + '</td><td>' + fmt(w.a, 2) + '</td><td>' + fmt(w.rate, 1) + '</td><td class="hi">' + fmt(w.n) + '</td></tr>';
      }).join('');
      ui.report({
        title: T.rTitle, tool: T.rTool,
        kpis: [[fmt(r.buy), T.rBuy], [r.cost === null ? '—' : fmt(r.cost), T.cost], [fmt(r.area, 2), T.rArea]],
        body:
          '<p class="r-note">' + T.rBrick + esc(label(r.b)) + T.rJoint + fmt(r.j, 2) + ' ' + T.cm + T.rWaste + fmt(r.waste * 100, 1) + '%' +
            (r.price === null ? '' : T.rPrice + fmt(r.price, 2) + ' ' + T.egp) + '</p>' +
          '<h2>' + T.rWalls + '</h2><table><thead><tr>' + T.rCols.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>' + tr +
          '</tbody><tfoot><tr><td>' + T.total + '</td><td></td><td></td><td></td><td></td><td>' + fmt(r.area, 2) + '</td><td></td><td class="hi">' + fmt(r.net) + '</td></tr></tfoot></table>' +
          '<p class="r-note">' + T.rFormula(fmt(r.net, 1), fmt(r.waste * 100, 1), fmt(r.net * (1 + r.waste), 1), fmt(r.buy)) + '</p>' +
          '<p class="r-warn">' + T.warn + '</p>'
      });
      return { value: fmt(r.buy), label: T.dock };
    }

    return { build: build, calc: calc, explain: T.explain, warn: T.warn };
  });
})();
