/*
 * Gypsum Board Cost Calculator — calculation only (no page, no text).
 * Taken unchanged from the original, static/Tools/gypsum-board-calculator.txt
 * ("Same logic as Eng_Mostafa_Elgindi_Gypsum_Board_Calculator.xlsx"): the items,
 * units, place types, starting rooms, num() and calc()'s arithmetic. Inputs are
 * the fields' raw values (strings, as the original read them from the page).
 * Page and wording: gypsum.js. Checks: tools/calc-tests/.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GindiCalc = root.GindiCalc || {}).gypsum = api;
})(this, function () {
  'use strict';

  // [item, default unit]; then [place, type, quantity of each item]
  var ITEMS = [["فلات","م²"],["أخضر","م²"],["أحمر","م²"],["بيت النور","م.ط"],["بيت الستارة","م.ط"],["كمام الستارة","م.ط"],["شادو جاب","م.ط"]];
  var UNITS = ["م²","م.ط","عدد"], TYPES = ["غرفة","حمام","مطبخ"];
  var ROOMS = [["ريسبشن","غرفة",[30,0,0,22,6,6,22]], ["غرفة نوم 1","غرفة",[16,0,0,16,4,4,16]],
               ["غرفة نوم 2","غرفة",[14,0,0,15,3.5,3.5,15]], ["غرفة نوم 3","غرفة",[12,0,0,14,3.5,3.5,14]],
               ["طرقة","غرفة",[8,0,0,0,0,0,12]], ["حمام 1","حمام",[0,5,0,0,0,0,9]],
               ["حمام 2","حمام",[0,4,0,0,0,0,8]], ["مطبخ","مطبخ",[0,0,10,0,0,0,13]]];
  var num = function(v){ v = parseFloat(v); return isFinite(v) && v >= 0 ? v : 0; };

  /*
   * input: { prices: [one per item], rooms: [{ name, type, q: [one per item] }] }
   *   (type: one of TYPES). The unit is only a label: it changes no figure.
   */
  function compute(input) {
    var P = ITEMS.map(function(_, j){ return num(input.prices[j]); });
    var Q = ITEMS.map(function(){ return 0; });
    var byT = {"غرفة": [0, 0], "حمام": [0, 0], "مطبخ": [0, 0]};
    var rooms = input.rooms.map(function(room){
      var q = room.q.map(function(v){ return num(v); }), type = room.type;
      var cost = q.reduce(function(t, v, j){ Q[j] += v; return t + v * P[j]; }, 0);
      byT[type][0] += cost; byT[type][1] += 1;
      return {name: room.name, type: type, q: q, cost: cost};
    });
    var C = Q.map(function(q, j){ return q * P[j]; });
    var T = C.reduce(function(a, b){ return a + b; }, 0);
    return {rooms: rooms, P: P, Q: Q, C: C, T: T, byT: byT};
  }

  return { ITEMS: ITEMS, UNITS: UNITS, TYPES: TYPES, ROOMS: ROOMS, num: num, compute: compute };
});
