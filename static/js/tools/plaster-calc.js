/*
 * Plaster & Spatter-Dash Calculator — calculation only (no page, no text).
 * Taken unchanged from the original, static/Tools/plaster-calculator.txt
 * ("Same logic as Eng_Mostafa_Elgindi_Plaster_Calculator.xlsx"): the stages
 * and their starting values, num(), up() and calc()'s arithmetic, including
 * the spatter dash taking the plaster's area and waste. Inputs are the
 * fields' raw values (strings). Page and wording: plaster.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GindiCalc = root.GindiCalc || {}).plaster = api;
})(this, function () {
  'use strict';

  // [key, name, area m², thickness mm, cement parts, sand parts, waste %, dry factor]
  var STAGES = [
    ["p", "المحارة", 300, 20, 1, 4, 10, 1.27],
    ["t", "الطرطشة", 300, 3, 1, 2, 10, 1.27]
  ];
  var FIELDS = [
    ["a", "المساحة (م²)"], ["th", "السُمك (مم)"], ["c", "أجزاء الأسمنت"],
    ["s", "أجزاء الرمل"], ["w", "الهالك %"], ["f", "معامل التحويل"]
  ];
  // The spatter dash shares the plaster's area and waste (read-only fields there).
  var LINKED = ["a", "w"];
  var num = function(v){ v = parseFloat(v); return isFinite(v) && v >= 0 ? v : null; };
  var up = function(x){ return Math.ceil(x - 1e-9); }; // ROUNDUP(x,0) for x >= 0

  var DEFAULTS = { bag: '50', dens: '1440', step: '0.5' };

  /*
   * input: { bag, dens, step, stages: [{ a, th, c, s, w, f }, { th, c, s, f }] }
   *   (the second stage's a and w are not read: as in the original, they are
   *    set from the first stage's — returned as `linked` for the page to show).
   */
  function compute(input) {
    var bag = num(input.bag), dens = num(input.dens) || 0, step = num(input.step);
    var linked = { a: num(input.stages[0].a) || 0, w: num(input.stages[0].w) || 0 };
    var S = STAGES.map(function(st, i){
      var raw = input.stages[i], g = function(f){ return num(i === 1 && LINKED.indexOf(f) >= 0 ? linked[f] : raw[f]) || 0; };
      var a = g("a"), th = g("th"), c = g("c"), s = g("s"), w = g("w") / 100, f = g("f");
      var mortar = a * th / 1000, dry = mortar * f, parts = c + s;
      var cemVol = parts ? dry * c / parts : 0, sand0 = parts ? dry * s / parts : 0;
      var kg0 = cemVol * dens, kg = kg0 * (1 + w), bags = bag ? kg / bag : 0, sand = sand0 * (1 + w);
      return {key: st[0], name: st[1], a: a, th: th, c: c, s: s, w: w, f: f, mortar: mortar, dry: dry, kg: kg, bags: bags, sand: sand};
    });
    var kg = 0, bags = 0, sand = 0;
    S.forEach(function(x){ kg += x.kg; bags += x.bags; sand += x.sand; });
    var buyBags = up(bags), buySand = step ? up(sand / step) * step : sand;
    return {bag: bag, dens: dens, step: step, linked: linked, S: S, kg: kg, bags: bags, sand: sand, buyBags: buyBags, buySand: buySand};
  }

  return { STAGES: STAGES, FIELDS: FIELDS, LINKED: LINKED, DEFAULTS: DEFAULTS, num: num, up: up, compute: compute };
});
