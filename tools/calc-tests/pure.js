/*
 * Regression checks of the pure calculation modules (static/js/tools/*-calc.js),
 * without any page: compute() is called with raw field values and the results
 * compared with figures worked out by hand from the original formulas.
 * Run: python tools/calc-tests/run.py pure (loads pure.html in headless Chrome).
 * The modules also load under CommonJS (module.exports) for other runners.
 */
(function () {
  'use strict';
  var G = window.GindiCalc, lines = [], passed = 0, failed = 0;
  function close(a, b) { return typeof b === 'number' ? Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)) : a === b; }
  function eq(label, got, want) {
    if (close(got, want)) { passed++; } else { failed++; lines.push('FAIL ' + label + ': got ' + got + ', want ' + want); }
  }

  /* ---------- Bricks ---------- */
  var B = G.bricks, half = 'نص طوبة', one = 'طوبة', oneHalf = 'طوبة ونص';
  eq('bricks: 14 brick types', B.BRICKS.length, 14);
  eq('bricks: thickness names', B.THICK.join('|'), [half, one, oneHalf].join('|'));
  var r = B.compute({ brick: '0', price: '', waste: '5', joint: '1', walls: [{ L: '5', H: '3', O: '3.33', t: half }] });
  eq('bricks default: half-brick rate', r.half, 10000 / (26 * 7));
  eq('bricks default: one-brick rate', r.full, 10000 / (13 * 7));
  eq('bricks default: net area', r.area, 11.67);
  eq('bricks default: net bricks', r.net, 641.2087912087911);
  eq('bricks default: with waste', r.gross, 673.2692307692307);
  eq('bricks default: to buy (rounded up)', r.buy, 674);
  eq('bricks default: no price, no cost', r.cost, null);
  r = B.compute({ brick: '0', price: '4500', waste: '5', joint: '1', walls: [{ L: '6', H: '3', O: '2.5', t: oneHalf }] });
  eq('bricks 1.5: rate = half + full', r.walls[0].rate, 10000 / (26 * 7) + 10000 / (13 * 7));
  eq('bricks 1.5: to buy', r.buy, 2683);
  eq('bricks 1.5: cost = buy / 1000 × price', r.cost, 12073.5);
  r = B.compute({ brick: '0', price: '', waste: '0', joint: '0', walls: [{ L: '3', H: '1', O: '0', t: half }] });
  eq('bricks: exactly 200 stays 200', r.buy, 200);
  r = B.compute({ brick: '0', price: '-5', waste: '-5', joint: '', walls: [{ L: '3', H: '1', O: '50', t: one }] });
  eq('bricks: openings larger than the wall give 0', r.area, 0);
  eq('bricks: negative price is no price', r.cost, null);
  eq('bricks: negative waste counts as 0', r.waste, 0);

  /* ---------- Tiles ---------- */
  var Ti = G.tiles, yes = 'أيوه', no = 'لأ';
  var types = [{ L: '60', W: '60', C: '1.44', P: '350' }, { L: '', W: '', C: '', P: '' }, { L: '', W: '', C: '', P: '' }];
  var area = function (o) { var a = { name: 'x', L: '', W: '', n: '', o: '', t: 'نوع 1', s: 'أرضية', k: no, dr: '' }; for (var k in o) a[k] = o[k]; return a; };
  var base = { wMin: '5', wAvg: '10', wMax: '15', wExtra: '10', joint: '3', skH: '10', skX: '10', glueCov: '', gluePrice: '', supplier: '', types: types };
  var input = function (o) { var x = {}; for (var k in base) x[k] = base[k]; for (k in o) x[k] = o[k]; return x; };
  eq('tiles: 12 starting places', Ti.AREAS.length, 12);
  var t = Ti.compute(input({ areas: [area({ L: '6', W: '5', k: yes, dr: '1' })] }));
  eq('tiles: skirting area = (perimeter − doors) × height ÷ 100', t.skAll, 2.1);
  eq('tiles: area after average waste', t.T[0].after, 38.73);
  eq('tiles: cartons min', t.T[0].min, 26);
  eq('tiles: cartons average', t.T[0].avg, 27);
  eq('tiles: cartons max', t.T[0].max, 29);
  eq('tiles: cost = avg cartons × carton m² × price', t.T[0].cost, 27 * 1.44 * 350);
  eq('tiles: pieces per carton', t.T[0].perCtn, 4);
  eq('tiles: pieces (with 3 mm joint)', t.T[0].pieces, 107);
  eq('tiles: no supplier figure, no verdict', t.verdict, null);
  t = Ti.compute(input({ supplier: '40', areas: [area({ L: '6', W: '5', k: yes, dr: '1' })] }));
  eq('tiles: supplier above the max is "high"', t.verdict, 'high');
  t = Ti.compute(input({ supplier: '27', areas: [area({ L: '6', W: '5', k: yes, dr: '1' })] }));
  eq('tiles: supplier within the range is "in"', t.verdict, 'in');
  t = Ti.compute(input({ areas: [area({ L: '6', W: '5', n: '' }), area({ L: '6', W: '5', n: '0' })] }));
  eq('tiles: empty count means 1, zero means 0', t.rows[0].a + '|' + t.rows[1].a, '30|0');
  t = Ti.compute(input({ glueCov: '4', gluePrice: '180', areas: [area({ L: '6', W: '5' })] }));
  eq('tiles: adhesive bags = area ÷ coverage, rounded up', t.bags, 8);
  eq('tiles: cost includes the adhesive', t.all, t.tot.cost + 8 * 180);

  /* ---------- Wire ---------- */
  var W = G.wire, Y = 'نعم', N = 'لا';
  eq('wire: sizes', W.SIZES.join(','), '1.5,2,4,6,10,16');
  eq('wire: price of a 1.5 mm² roll', W.PRICES[1.5], 1510.45);
  eq('wire: price list date', W.PRICE_DATE, 'تحديث 2 يونيو 2026');
  var rows = [
    { title: 'غرفة 1', k: '1', l: '15', s: '1.5', w: '3', a: Y, sn: '1', sl: '15', se: '3', se_e: '3' },
    { title: 'غسالة', c: '', l: '12', s: '4', w: '3', a: N },
    { title: 'غسالة أطباق', c: '', l: '12', s: '4', w: '3', a: N },
    { title: 'تكييف 1', l: '15', s: '4', w: '3', a: N },
    { title: 'سخان فوري 1', l: '10', s: '6', w: '3', a: N },
    { title: 'فرن / بوتاجاز كهربائي', c: '', l: '10', s: '6', w: '3', a: N },
    { title: 'بند إضافي ١', c: '', n: '', l: '', s: '4', w: '3', a: N },
    { title: 'بند إضافي ٢', c: '', n: '', l: '', s: '10', w: '3', a: N }
  ];
  var prices = W.SIZES.map(function (s) { return String(W.PRICES[s]); });
  var winput = function (o) { var x = { area: '', ref: '100', roll: '100', margin: '15', wmin: '10', wavg: '12', wmax: '15', elec: '', prices: prices, rows: rows }; for (var k in o) x[k] = o[k]; return x; };
  var w = W.compute(winput({}));
  eq('wire default: room = lighting 45 + switch 10 + sockets 45', w.rowLen[0], 100);
  eq('wire default: total length', w.T.len, 175);
  eq('wire default: after average waste', w.T.after, 196);
  eq('wire default: rolls (avg)', w.T.avg, 4);
  eq('wire default: cost of the average rolls', w.T.cost, 13042.19);
  w = W.compute(winput({ area: '150' }));
  eq('wire: area 150 ÷ reference 100 scales the room only', w.rowLen[0], 150);
  eq('wire: appliances do not scale', w.rowLen[3], 45);
  w = W.compute(winput({ area: '150', ref: '0' }));
  eq('wire: reference 0 means no scaling', w.factor, 1);
  w = W.compute(winput({ elec: '9' }));
  eq('wire: above the max is "high"', w.verdict, 'high');
  w = W.compute(winput({ elec: '4' }));
  eq('wire: within the range is "in"', w.verdict, 'in');
  w = W.compute(winput({ roll: '0' }));
  eq('wire: no roll length, no rolls', w.T.avg + w.T.min + w.T.max, 0);

  /* ---------- Paint ---------- */
  var P = G.paint;
  eq('paint: 150 products', P.PRODUCTS.length, 150);
  eq('paint: last product is sandpaper', P.PRODUCTS[149][0], 'ورق صنفرة');
  var stages = P.STAGES.map(function (s) { return { p: String(P.idx(s[1])), c: String(s[2]), s: s[3] ? Y : N, v: '' }; });
  var pinput = function (o) { var x = { flat: '80', height: '3', len: '', open: '', ceil: '', waste: '10', labour: '', stages: stages }; for (var k in o) x[k] = o[k]; return x; };
  var p = P.compute(pinput({}));
  eq('paint default: openings = 12.5% of the walls', p.O, 30);
  eq('paint default: walls', p.walls, 210);
  eq('paint default: ceiling = 93% of the apartment', p.ceil, 74.4);
  eq('paint default: sealer packs', p.S[0].packs, 4);
  eq('paint default: putty packs', p.S[1].packs, 17);
  eq('paint default: sanding sheets', p.S[2].packs, 63);
  eq('paint default: base coat packs', p.S[3].packs, 9);
  eq('paint default: finish packs', p.S[4].packs, 17);
  eq('paint default: no prices, no total', p.anyPrice, false);
  p = P.compute(pinput({ labour: '35' }));
  eq('paint: labour = net area × rate', p.lab, 284.4 * 35);
  eq('paint: labour alone makes a total, with prices missing', p.anyPrice + '|' + p.priced, 'true|false');
  var noCoats = stages.map(function (s) { return { p: s.p, c: '0', s: s.s, v: '100' }; });
  p = P.compute(pinput({ stages: noCoats }));
  eq('paint: 0 coats, no packs and no cost', p.mat, 0);
  eq('paint: GLC finish default', P.PRODUCTS[P.idx(P.BRANDS.GLC)][0], 'GLC سوبر بلاتين لاكشري مط 7000 — 9 لتر');
  eq('paint: the finish stage lists only finishes', P.productsFor('Jotun', ['finish']).every(function (i) { return P.PRODUCTS[i][5] === 'finish' && P.brandOf(P.PRODUCTS[i]) === 'Jotun'; }), true);

  /* ---------- Plaster ---------- */
  var PL = G.plaster;
  var pst = function (o, t) { var a = { a: '300', th: '20', c: '1', s: '4', w: '10', f: '1.27' }, b = { a: '999', th: '3', c: '1', s: '2', w: '99', f: '1.27' }, k;
    for (k in o || {}) a[k] = o[k]; for (k in t || {}) b[k] = t[k]; return [a, b]; };
  var pin = function (o, a, b) { var x = { bag: '50', dens: '1440', step: '0.5', stages: pst(a, b) }; for (var k in o || {}) x[k] = o[k]; return x; };
  var pl = PL.compute(pin());
  eq('plaster default: plaster mortar = area × thickness ÷ 1000', pl.S[0].mortar, 6);
  eq('plaster default: dry materials = mortar × 1.27', pl.S[0].dry, 7.62);
  eq('plaster default: plaster cement incl. waste (kg)', pl.S[0].kg, 7.62 / 5 * 1440 * 1.1);
  eq('plaster default: plaster sand incl. waste (m³)', pl.S[0].sand, 7.62 * 4 / 5 * 1.1);
  eq('plaster default: spatter dash takes the plaster area, not its own', pl.S[1].a, 300);
  eq('plaster default: spatter dash takes the plaster waste', pl.S[1].w, 0.1);
  eq('plaster default: spatter dash bags', pl.S[1].bags, 0.9 * 1.27 / 3 * 1440 * 1.1 / 50);
  eq('plaster default: bags to buy (rounded up)', pl.buyBags, 61);
  eq('plaster default: sand to buy (up to the next 0.5 m³)', pl.buySand, 8);
  pl = PL.compute(pin({ step: '' }));
  eq('plaster: no sand rounding step, the exact total', pl.buySand, pl.sand);
  pl = PL.compute(pin({ bag: '' }));
  eq('plaster: no bag weight, no bags', pl.bags, 0);
  pl = PL.compute(pin({}, { c: '0', s: '0' }));
  eq('plaster: no mix parts, no materials', pl.S[0].kg + pl.S[0].sand, 0);
  pl = PL.compute(pin({ dens: '1000', step: '0.5' }, { th: '10', c: '1', s: '0', w: '0', f: '1', a: '100' }, { th: '0' }));
  eq('plaster: exactly 20 bags stays 20', pl.buyBags, 20);

  window.__pure = { lines: lines, passed: passed, failed: failed };
})();
