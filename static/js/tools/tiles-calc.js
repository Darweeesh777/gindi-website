/*
 * Tile & Ceramic Calculator — calculation only (no page, no text).
 * Taken unchanged from the original, static/Tools/ceramic-calculator.txt
 * ("Same logic as Eng_Mostafa_Elgindi_Ceramic_Calculator.xlsx"): the tile
 * types, surfaces and starting places, num(), up() and calc()'s arithmetic.
 * Inputs are the fields' raw values (strings). Page and wording: tiles.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GindiCalc = root.GindiCalc || {}).tiles = api;
})(this, function () {
  'use strict';

  var TYPES = [["نوع 1", "أرضيات"], ["نوع 2", "حوائط"], ["نوع 3", "أرضيات الحمامات"]];
  var SURF = ["أرضية", "حوائط", "أخرى"];
  // [place, type index, surface index, skirting?] — same rows as the sheet
  var AREAS = [
    ["الريسبشن", 0, 0, 1], ["غرفة 1", 0, 0, 1], ["غرفة 2", 0, 0, 1], ["غرفة 3", 0, 0, 1], ["الطرقة", 0, 0, 1],
    ["المطبخ — أرضية", 0, 0, 1], ["المطبخ — حوائط", 1, 1, 0], ["حمام 1 — أرضية", 2, 0, 0], ["حمام 1 — حوائط", 1, 1, 0],
    ["حمام 2 — أرضية", 2, 0, 0], ["حمام 2 — حوائط", 1, 1, 0], ["البلكونة — أرضية", 0, 0, 1]
  ];
  var SKIRT = ["لأ", "أيوه"]; // the skirting choice's values (no, yes)
  var NEW_AREA = ["مكان إضافي", 0, 0, 0]; // a place added with "+ Add a place"
  var num = function(v){ v = parseFloat(v); return isFinite(v) && v >= 0 ? v : null; };
  var up = function(x){ return Math.ceil(x - 1e-9); }; // ROUNDUP(x,0) for x >= 0

  var DEFAULTS = { wMin: '5', wAvg: '10', wMax: '15', wExtra: '10', joint: '3', skH: '10', skX: '10' };

  /*
   * input: { wMin, wAvg, wMax, wExtra, joint, skH, skX, glueCov, gluePrice, supplier,
   *          types: [{ L, W, C, P }] (one per TYPES),
   *          areas: [{ name, L, W, n, o, t, s, k, dr }] }
   *   t: a TYPES name, s: a SURF value, k: a SKIRT value.
   */
  function compute(input) {
    var g = function(v){ return num(v) || 0; };
    var wMin = g(input.wMin) / 100, wAvg = g(input.wAvg) / 100, wMax = g(input.wMax) / 100, wX = g(input.wExtra) / 100, j = g(input.joint);
    var skH = g(input.skH), skX = g(input.skX) / 100;
    var T = TYPES.map(function(t, k){ var r = input.types[k]; return {name: t[0], use: t[1], L: num(r.L), W: num(r.W), C: num(r.C) || null, P: num(r.P), area: 0, sk: 0}; });

    var net = 0, skAll = 0, A = [], rows = [];
    input.areas.forEach(function(r){
      var L = r.L === "" ? null : g(r.L), W = r.W === "" ? null : g(r.W);
      var n = r.n === "" ? 1 : g(r.n), o = g(r.o);
      var ti = TYPES.map(function(t){ return t[0]; }).indexOf(r.t), s = r.s, skOn = r.k === "أيوه";
      var a = L === null || W === null ? 0 : Math.max(0, L * W * n - o);
      var per = L === null || W === null ? 0 : 2 * (L + W) * n, skLen = skOn ? Math.max(0, per - g(r.dr)) : 0, sk = skLen * skH / 100;
      T[ti].area += a; T[ti].sk += sk; net += a; skAll += sk;
      rows.push({type: r.t, s: s, a: a, sk: sk});
      if (a || sk) A.push({name: r.name, type: T[ti].name, s: s, L: L, W: W, n: n, o: o, a: a, skLen: skLen, sk: sk});
    });

    var tot = {area: 0, sk: 0, after: 0, min: 0, avg: 0, max: 0, cost: null}, missing = false;
    T.forEach(function(t){
      var ctn = function(w){ return t.area + t.sk === 0 || !t.C ? 0 : up((t.area * (1 + w + wX) + t.sk * (1 + w + wX + skX)) / t.C); };
      t.after = t.area * (1 + wAvg + wX) + t.sk * (1 + wAvg + wX + skX);
      t.min = ctn(wMin); t.avg = ctn(wAvg); t.max = ctn(wMax);
      t.cost = t.avg && t.P !== null ? t.avg * t.C * t.P : null;
      t.perCtn = t.L && t.W && t.C ? Math.round(t.C / (t.L * t.W / 10000)) : null;
      t.pieces = t.L && t.W ? up(t.after / (((t.L + j / 10) * (t.W + j / 10)) / 10000)) : 0;
      if (t.area + t.sk > 0 && !t.C) missing = true;
      tot.area += t.area; tot.sk += t.sk; tot.after += t.after; tot.min += t.min; tot.avg += t.avg; tot.max += t.max;
      if (t.cost !== null) tot.cost = (tot.cost || 0) + t.cost;
    });

    var cov = num(input.glueCov), gp = num(input.gluePrice), sup = num(input.supplier);
    var bags = cov && net ? up(net / cov) : null, glueCost = bags !== null && gp !== null ? bags * gp : null;
    var all = tot.cost === null ? null : tot.cost + (glueCost || 0);
    // The supplier check: null (nothing to compare), 'high', 'low' or 'in' (the original's three verdicts).
    var verdict = sup === null || tot.max === 0 ? null : sup > tot.max ? "high" : sup < tot.min ? "low" : "in";

    return {T: T, rows: rows, A: A, tot: tot, net: net, skAll: skAll, missing: missing, bags: bags, glueCost: glueCost,
            all: all, sup: sup, verdict: verdict, p: {wMin: wMin, wAvg: wAvg, wMax: wMax, wX: wX, j: j, skH: skH, skX: skX}};
  }

  return { TYPES: TYPES, SURF: SURF, AREAS: AREAS, SKIRT: SKIRT, NEW_AREA: NEW_AREA, DEFAULTS: DEFAULTS,
           num: num, up: up, compute: compute };
});
