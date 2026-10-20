/*
 * Electrical Wire Calculator — calculation only (no page, no text).
 * Taken unchanged from the original, static/Tools/wire-calculator.txt
 * ("Same logic as Eng_Mostafa_Elgindi_Wire_Calculator.xlsx"): the circuit
 * types, wire sizes, the Elsewedy price list and its date, the switch and
 * socket constants, num(), up() and calc()'s arithmetic. Inputs are the
 * fields' raw values (strings). Page and wording: wire.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GindiCalc = root.GindiCalc || {}).wire = api;
})(this, function () {
  'use strict';

  // repeat: one line per box (count fixed at 1), the + button adds another box with the same specs
  var TYPES = [
    {name:"غرفة",                  unit:"غرفة", repeat:true, room:true, note:"إنارة الغرفة ومفتاحها + لينية البرايز وتمديداتها", size:1.5, wires:3, scale:true, len:15},
    {name:"غسالة",                 note:"لينية مستقلة",                size:4,   wires:3, scale:false, len:12},
    {name:"غسالة أطباق",           note:"لينية مستقلة",                size:4,   wires:3, scale:false, len:12},
    {name:"تكييفات",               unit:"تكييف", repeat:true, note:"كل خانة = تكييف واحد", size:4, wires:3, scale:false, len:15},
    {name:"سخان فوري",             unit:"سخان فوري", repeat:true, note:"كل خانة = سخان واحد على لينية مستقلة", size:6, wires:3, scale:false, len:10},
    {name:"فرن / بوتاجاز كهربائي", note:"لينية مستقلة",                size:6,   wires:3, scale:false, len:10},
    {extra:true, name:"بند إضافي ١", note:"مثلاً كابل العداد أو أي لينية زيادة", size:4,  wires:3, scale:false, len:""},
    {extra:true, name:"بند إضافي ٢", note:"مثلاً كابل العداد أو أي لينية زيادة", size:10, wires:3, scale:false, len:""}
  ];
  var SIZES = [1.5, 2, 4, 6, 10, 16];
  // لستة أسعار السويدي للكابلات: سلك نحاس مجدول، لفة 100 م، جنيه شامل الضريبة (حدّث الأرقام والتاريخ هنا)
  var PRICE_DATE = "تحديث 2 يونيو 2026";
  var PRICES = {1.5: 1510.45, 2: 2008.73, 4: 3800.71, 6: 5722.30, 10: 9401.24, 16: 15047.57};
  var SWITCH = {len:5, wires:2, size:1.5}; // مفتاح إنارة: 5 م ثابتة × سلكين، 1.5 مم
  var SOCKET = {len:15, ext:3, wires:3, size:2}; // لينية بريزة واحدة للغرفة + تمديدة لكل بريزة زيادة
  var YES = "نعم", NO = "لا"; // the "affected by area?" choice's values
  var num = function(v){ v = parseFloat(v); return isFinite(v) && v >= 0 ? v : null; };
  var up = function(x){ return Math.ceil(x - 1e-9); }; // ROUNDUP(x,0) for x >= 0

  var DEFAULTS = { area: '', ref: '100', roll: '100', margin: '15', wmin: '10', wavg: '12', wmax: '15' };

  /*
   * input: { area, ref, roll, margin, wmin, wavg, wmax, elec,
   *          prices: [one per SIZES],
   *          rows: [{ ti, title, c?, k?, l, s, w, a, sn?, sl?, se?, se_e?, n? }] }
   *   A field the row does not have is left out (undefined), as in the original:
   *   c — count (rows that are not repeated), k — light switches and
   *   sn/sl/se/se_e — sockets (rooms), n — the item's name (extra items).
   */
  function compute(input) {
    var area = num(input.area), ref = num(input.ref);
    var roll = num(input.roll) || 0;
    var margin = (num(input.margin) || 0) / 100;
    var wmin = (num(input.wmin) || 0) / 100, wavg = (num(input.wavg) || 0) / 100, wmax = (num(input.wmax) || 0) / 100;
    var factor = (area === null || !ref) ? 1 : area / ref;

    var bySize = {}; SIZES.forEach(function(s){ bySize[s] = 0; });
    var sum = 0, P = [], rowLen = [];
    input.rows.forEach(function(r){
      var hasC = r.c !== undefined;
      var c = hasC ? (num(r.c) || 0) : 1, l = num(r.l) || 0, w = num(r.w) || 0;
      var f = r.a === "نعم" ? factor : 1;
      var g = c * l * w * f, nm = r.title, sz = parseFloat(r.s);
      if (r.n !== undefined && r.n.trim()) nm = r.n.trim();
      bySize[sz] += g;
      // part: 'light' for a room's lighting line (the original's "— إنارة"), '' otherwise.
      P.push({name: nm, part: r.k !== undefined ? 'light' : '', size: sz, qty: hasC ? c : 1, len: g});
      if (r.k !== undefined) { var sw = (num(r.k) || 0) * SWITCH.len * SWITCH.wires * f; bySize[SWITCH.size] += sw; g += sw;
        P.push({name: nm, part: 'switch', size: SWITCH.size, qty: num(r.k) || 0, len: sw}); }
      if (r.sn !== undefined) {
        var n = num(r.sn) || 0;
        var so = n > 0 ? ((num(r.sl) || 0) + (n - 1) * (num(r.se) || 0)) * parseFloat(r.se_e) * f : 0;
        bySize[SOCKET.size] += so; g += so;
        P.push({name: nm, part: r.se_e === "2" ? 'sockets-ungrounded' : 'sockets', size: SOCKET.size, qty: n, len: so});
      }
      sum += g;
      rowLen.push(g);
    });

    var T = {len:0, after:0, min:0, avg:0, max:0, cost:0}, anyPrice = false, S = [];
    SIZES.forEach(function(s, i){
      var L = bySize[s], D = L * (1 + wavg);
      var mn = roll ? up(L * (1 - margin) * (1 + wmin) / roll) : 0;
      var av = roll ? up(D / roll) : 0;
      var mx = roll ? up(L * (1 + margin) * (1 + wmax) / roll) : 0;
      var p = num(input.prices[i]);
      if (p !== null) { anyPrice = true; T.cost += av * p; }
      S.push({size: s, L: L, D: D, mn: mn, av: av, mx: mx, p: p, cost: p === null ? null : av * p});
      T.len += L; T.after += D; T.min += mn; T.avg += av; T.max += mx;
    });

    var e = num(input.elec);
    // The comparison: null (no figure), 'high', 'low' or 'in' — the original's order of checks.
    var verdict = e === null ? null : e > T.max ? 'high' : e < T.min ? 'low' : 'in';
    return {area: area, factor: factor, rowLen: rowLen, sum: sum, P: P, S: S, T: T, anyPrice: anyPrice, e: e, verdict: verdict,
            // As the original's report repeats them: the entered values (not divided by 100).
            settings: {roll: num(input.roll) || 0, wmin: num(input.wmin) || 0, wavg: num(input.wavg) || 0,
                       wmax: num(input.wmax) || 0, margin: num(input.margin) || 0}};
  }

  return { TYPES: TYPES, SIZES: SIZES, PRICE_DATE: PRICE_DATE, PRICES: PRICES, SWITCH: SWITCH, SOCKET: SOCKET,
           YES: YES, NO: NO, DEFAULTS: DEFAULTS, num: num, up: up, compute: compute };
});
