/*
 * Brick Quantity & Cost Calculator — calculation only (no page, no text).
 * Taken unchanged from the original, static/Tools/brick-calculator.txt
 * ("Same logic as Eng_Mostafa_Elgindi_Brick_Calculator.xlsx"): the brick
 * list, the thickness names, num(), up() and calc()'s arithmetic. Inputs are
 * the fields' raw values (strings, as the original read them from the page).
 * Page and wording: bricks.js. Checks: tools/calc-tests/.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GindiCalc = root.GindiCalc || {}).bricks = api;
})(this, function () {
  'use strict';

  // [name, length, width, height] in cm — same list as sheet «أنواع الطوب»
  var BRICKS = [
    ["طوب أحمر طفلي مصمت", 25, 12, 6],
    ["طوب أحمر طفلي مفرغ", 24, 11, 6],
    ["طوب أحمر طفلي مفرغ", 25, 12, 13],
    ["طوب أحمر طفلي مفرغ", 40, 20, 20],
    ["طوب أسمنتي مصمت", 25, 12, 6],
    ["طوب أسمنتي مفرغ", 25, 12, 12],
    ["بلوك أسمنتي مفرغ", 40, 20, 20],
    ["بلوك أسمنتي مفرغ", 40, 15, 20],
    ["بلوك أسمنتي مفرغ", 40, 10, 20],
    ["طوب رملي جيري", 25, 12, 6],
    ["طوب خفيف (خرسانة خلوية)", 60, 20, 20],
    ["طوب خفيف (خرسانة خلوية)", 60, 15, 20],
    ["طوب خفيف (خرسانة خلوية)", 60, 10, 20],
    ["طوب واجهات (فيس)", 24, 11, 6]
  ];
  var THICK = ["نص طوبة", "طوبة", "طوبة ونص"];
  var num = function(v){ v = parseFloat(v); return isFinite(v) && v >= 0 ? v : null; };
  var up = function(x){ return Math.ceil(x - 1e-9); }; // ROUNDUP(x,0) for x >= 0

  // The original page's starting values: the first brick, no price, 5% waste,
  // a 1 cm joint, one wall of 5 x 3 m with 3.33 m² of openings, half a brick thick.
  var DEFAULTS = { brick: '0', price: '', waste: '5', joint: '1', wall: ['5', '3', '3.33'] };

  /*
   * input: { brick: '0'…'13', price, waste, joint,
   *          walls: [{ L, H, O, t }] }   (t: one of THICK)
   */
  function compute(input) {
    var b = BRICKS[input.brick];
    var j = num(input.joint) || 0, waste = (num(input.waste) || 0) / 100, price = num(input.price);
    var half = 10000 / ((b[1] + j) * (b[3] + j)), full = 10000 / ((b[2] + j) * (b[3] + j));

    var area = 0, net = 0, W = [];
    input.walls.forEach(function(w){
      var L = num(w.L) || 0, H = num(w.H) || 0, O = num(w.O) || 0, t = w.t;
      var a = Math.max(0, L * H - O);
      var rate = t === THICK[1] ? full : t === THICK[2] ? half + full : half;
      var n = a * rate;
      area += a; net += n;
      W.push({L: L, H: H, O: O, t: t, a: a, rate: rate, n: n});
    });
    var gross = net * (1 + waste), buy = up(gross);
    var cost = price === null ? null : buy / 1000 * price;
    return {b: b, j: j, waste: waste, price: price, half: half, full: full, walls: W,
            area: area, net: net, gross: gross, buy: buy, cost: cost};
  }

  return { BRICKS: BRICKS, THICK: THICK, DEFAULTS: DEFAULTS, num: num, up: up, compute: compute };
});
