/*
 * Paint Quantity & Cost Calculator — calculation only (no page, no text).
 * Taken unchanged from the original, static/Tools/paint-calculator.txt
 * ("Same logic as Eng_Mostafa_Elgindi_Paint_Calculator.xlsx"): the product
 * list (names, units, coverage, pack sizes, GLC ranges, kinds), the brand
 * defaults, the stages, num(), up() and calc()'s arithmetic. Inputs are the
 * fields' raw values (strings). Page and wording: paint.js.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else (root.GindiCalc = root.GindiCalc || {}).paint = api;
})(this, function () {
  'use strict';

  // [name, unit, rate m²/unit/coat (GLC average), pack size, GLC min–max] — same list as sheet «الخامات»
  var PRODUCTS = [
    ["GLC المقاوم 0017 — 0.65 لتر", "لتر", 11.5, 0.65, "10–13 عند GLC", "sealer"],
    ["GLC المقاوم 0017 — 2.4 لتر", "لتر", 11.5, 2.4, "10–13 عند GLC", "sealer"],
    ["GLC المقاوم 0017 — 9 لتر", "لتر", 11.5, 9.0, "10–13 عند GLC", "sealer"],
    ["GLC المقاوم 0017 — 14 لتر", "لتر", 11.5, 14.0, "10–13 عند GLC", "sealer"],
    ["GLC سوبر بلاتين برايمر مائي — 3 لتر", "لتر", 9.0, 3.0, "8–10 عند GLC", "sealer"],
    ["GLC سوبر بلاتين برايمر مائي — 9 لتر", "لتر", 9.0, 9.0, "8–10 عند GLC", "sealer"],
    ["GLC ستورم شيلد بنيتريتنج سيلر — 0.75 لتر", "لتر", 10.0, 0.75, "9–11 عند GLC", "sealer"],
    ["GLC ستورم شيلد بنيتريتنج سيلر — 3 لتر", "لتر", 10.0, 3.0, "9–11 عند GLC", "sealer"],
    ["GLC ستورم شيلد بنيتريتنج سيلر — 20 لتر", "لتر", 10.0, 20.0, "9–11 عند GLC", "sealer"],
    ["GLC ستورم شيلد نانو بنيترايتنج برايمر — 9 لتر", "لتر", 9.5, 9.0, "8–11 عند GLC", "sealer"],
    ["GLC ستورم شيلد نانو بنيترايتنج برايمر — 18 لتر", "لتر", 9.5, 18.0, "8–11 عند GLC", "sealer"],
    ["GLC معجون داي-تون 100 — 1 كجم", "كجم", 2.5, 1.0, "2–3 عند GLC", "putty"],
    ["GLC معجون داي-تون 100 — 4 كجم", "كجم", 2.5, 4.0, "2–3 عند GLC", "putty"],
    ["GLC معجون داي-تون 100 — 15 كجم", "كجم", 2.5, 15.0, "2–3 عند GLC", "putty"],
    ["GLC معجون داي-تون 100 — 18 كجم", "كجم", 2.5, 18.0, "2–3 عند GLC", "putty"],
    ["GLC معجون داي-تون 100 — 20 كجم", "كجم", 2.5, 20.0, "2–3 عند GLC", "putty"],
    ["GLC معجون أكريليك 900 — 4 كجم", "كجم", 3.0, 4.0, "2–4 عند GLC", "putty"],
    ["GLC معجون أكريليك 900 — 15 كجم", "كجم", 3.0, 15.0, "2–4 عند GLC", "putty"],
    ["GLC معجون تاكت — 1 كجم", "كجم", 2.5, 1.0, "2–3 عند GLC", "putty"],
    ["GLC معجون تاكت — 5 كجم", "كجم", 2.5, 5.0, "2–3 عند GLC", "putty"],
    ["GLC معجون تاكت — 15 كجم", "كجم", 2.5, 15.0, "2–3 عند GLC", "putty"],
    ["GLC معجون تاكت — 22 كجم", "كجم", 2.5, 22.0, "2–3 عند GLC", "putty"],
    ["GLC برما ستار 660 — 15 كجم", "كجم", 2.5, 15.0, "2–3 عند GLC", "putty"],
    ["GLC ستورم شيلد بريميوم فيلر — 10 كجم", "كجم", 2.5, 10.0, "2–3 عند GLC", "putty"],
    ["GLC ستورم شيلد بريميوم فيلر — 20 كجم", "كجم", 2.5, 20.0, "2–3 عند GLC", "putty"],
    ["GLC سوبر داي-تون 3030 — 3.8 لتر", "لتر", 10.0, 3.8, "9–11 عند GLC", "base"],
    ["GLC سوبر داي-تون 3030 — 14 لتر", "لتر", 10.0, 14.0, "9–11 عند GLC", "base"],
    ["GLC داي-تون 200 — 3.5 لتر", "لتر", 9.0, 3.5, "8–10 عند GLC", "base"],
    ["GLC داي-تون 200 — 8 لتر", "لتر", 9.0, 8.0, "8–10 عند GLC", "base"],
    ["GLC فيرست كوت أبيض 505 — 2.1 لتر", "لتر", 10.0, 2.1, "9–11 عند GLC", "base"],
    ["GLC فيرست كوت أبيض 505 — 3.75 لتر", "لتر", 10.0, 3.75, "9–11 عند GLC", "base"],
    ["GLC جلتكس 20000 — 0.65 لتر", "لتر", 12.5, 0.65, "11–14 عند GLC", "base"],
    ["GLC جلتكس 20000 — 2.5 لتر", "لتر", 12.5, 2.5, "11–14 عند GLC", "base"],
    ["GLC جلتكس 20000 — 9 لتر", "لتر", 12.5, 9.0, "11–14 عند GLC", "base"],
    ["GLC جلتكس 20000 — 18 لتر", "لتر", 12.5, 18.0, "11–14 عند GLC", "base"],
    ["GLC جلتكس 25000 — 0.65 لتر", "لتر", 13.5, 0.65, "12–15 عند GLC", "base"],
    ["GLC جلتكس 25000 — 2.5 لتر", "لتر", 13.5, 2.5, "12–15 عند GLC", "base"],
    ["GLC جلتكس 15000 — 2.5 لتر", "لتر", 11.0, 2.5, "10–12 عند GLC", "base"],
    ["GLC جلتكس 15000 — 9 لتر", "لتر", 11.0, 9.0, "10–12 عند GLC", "base"],
    ["GLC داي-ستون 7070 — 0.65 لتر", "لتر", 10.5, 0.65, "9–12 عند GLC", "base"],
    ["GLC داي-ستون 7070 — 2.5 لتر", "لتر", 10.5, 2.5, "9–12 عند GLC", "base"],
    ["GLC داي-ستون 7070 — 9 لتر", "لتر", 10.5, 9.0, "9–12 عند GLC", "base"],
    ["GLC سوبر بلاتين داي-تون 3030 — 2.7 لتر", "لتر", 9.0, 2.7, "8–10 عند GLC", "base"],
    ["GLC سوبر بلاتين داي-تون 3030 — 9 لتر", "لتر", 9.0, 9.0, "8–10 عند GLC", "base"],
    ["GLC سوبر بلاتين داي ستون 7070 — 0.9 لتر", "لتر", 10.5, 0.9, "9–12 عند GLC", "base"],
    ["GLC سوبر بلاتين داي ستون 7070 — 2.7 لتر", "لتر", 10.5, 2.7, "9–12 عند GLC", "base"],
    ["GLC سوبر بلاتين داي ستون 7070 — 9 لتر", "لتر", 10.5, 9.0, "9–12 عند GLC", "base"],
    ["GLC داي-ستون 7070 ألوان جاهزه — 0.65 لتر", "لتر", 10.5, 0.65, "9–12 عند GLC", "base"],
    ["GLC داي-ستون 7070 ألوان جاهزه — 2.5 لتر", "لتر", 10.5, 2.5, "9–12 عند GLC", "base"],
    ["GLC داي-ستون 7070 ألوان جاهزه — 9 لتر", "لتر", 10.5, 9.0, "9–12 عند GLC", "base"],
    ["GLC ستورم شيلد أندركوت — 9 لتر", "لتر", 12.0, 9.0, "11–13 عند GLC", "base"],
    ["GLC سوبر لاك 786 — 0.35 لتر", "لتر", 14.0, 0.35, "13–15 عند GLC", "finish"],
    ["GLC سوبر لاك 786 — 0.7 لتر", "لتر", 14.0, 0.7, "13–15 عند GLC", "finish"],
    ["GLC سوبر لاك 786 — 2 لتر", "لتر", 14.0, 2.0, "13–15 عند GLC", "finish"],
    ["GLC سوبر لاك 786 — 4 لتر", "لتر", 14.0, 4.0, "13–15 عند GLC", "finish"],
    ["GLC سوبر لاك 786 — 9 لتر", "لتر", 14.0, 9.0, "13–15 عند GLC", "finish"],
    ["GLC جل نيل 290 — 9 لتر", "لتر", 17.0, 9.0, "16–18 عند GLC", "finish"],
    ["GLC زيجزاج جليز 303 — 0.325 لتر", "لتر", 17.5, 0.325, "15–20 عند GLC", "finish"],
    ["GLC زيجزاج جليز 303 — 0.75 لتر", "لتر", 17.5, 0.75, "15–20 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 15000 — 0.9 لتر", "لتر", 10.0, 0.9, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 15000 — 2.7 لتر", "لتر", 10.0, 2.7, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 15000 — 9 لتر", "لتر", 10.0, 9.0, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 20000 — 0.9 لتر", "لتر", 11.5, 0.9, "10–13 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 20000 — 2.7 لتر", "لتر", 11.5, 2.7, "10–13 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 20000 — 9 لتر", "لتر", 11.5, 9.0, "10–13 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك لامع — 0.9 لتر", "لتر", 14.0, 0.9, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك لامع — 2.7 لتر", "لتر", 14.0, 2.7, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك لامع — 9 لتر", "لتر", 14.0, 9.0, "13–15 عند GLC", "finish"],
    ["GLC أمبيانس ارمادا — 0.9 لتر", "لتر", 7.0, 0.9, "6–8 عند GLC", "finish"],
    ["GLC أمبيانس ارمادا — 2.7 لتر", "لتر", 7.0, 2.7, "6–8 عند GLC", "finish"],
    ["GLC أمبيانس ماربللو ستوكو — 0.9 لتر", "لتر", 3.5, 0.9, "3–4 عند GLC", "finish"],
    ["GLC أمبيانس ماربللو ستوكو — 2.7 لتر", "لتر", 3.5, 2.7, "3–4 عند GLC", "finish"],
    ["GLC أمبيانس ماربللو ستوكو — 9 لتر", "لتر", 3.5, 9.0, "3–4 عند GLC", "finish"],
    ["GLC أمبيانس كراكيل فينيش — 1 لتر", "لتر", 9.0, 1.0, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس دايموند — 0.32 لتر", "لتر", 9.0, 0.32, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس دايموند — 0.9 لتر", "لتر", 9.0, 0.9, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس هاي سينس — 0.4 لتر", "لتر", 9.0, 0.4, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس هاي سينس — 0.75 لتر", "لتر", 9.0, 0.75, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس شيل شاين — 0.32 لتر", "لتر", 9.0, 0.32, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس شيل شاين — 0.9 لتر", "لتر", 9.0, 0.9, "8–10 عند GLC", "finish"],
    ["GLC أمبيانس سيناو — 0.9 لتر", "لتر", 4.0, 0.9, "3–5 عند GLC", "finish"],
    ["GLC أمبيانس سيناو — 2.7 لتر", "لتر", 4.0, 2.7, "3–5 عند GLC", "finish"],
    ["GLC أمبيانس سينفوني — 0.9 لتر", "لتر", 4.0, 0.9, "3–5 عند GLC", "finish"],
    ["GLC أمبيانس سينفوني — 2.7 لتر", "لتر", 4.0, 2.7, "3–5 عند GLC", "finish"],
    ["GLC لؤلؤ — 0.7 لتر", "لتر", 15.0, 0.7, "14–16 عند GLC", "finish"],
    ["GLC لؤلؤ — 2 لتر", "لتر", 15.0, 2.0, "14–16 عند GLC", "finish"],
    ["GLC لؤلؤ — 3.75 لتر", "لتر", 15.0, 3.75, "14–16 عند GLC", "finish"],
    ["GLC سوبر لاك 500 — 2.15 لتر", "لتر", 14.0, 2.15, "13–15 عند GLC", "finish"],
    ["GLC جل نيل 29 — 2.25 لتر", "لتر", 12.0, 2.25, "10–14 عند GLC", "finish"],
    ["GLC جل نيل 29 — 8.5 لتر", "لتر", 12.0, 8.5, "10–14 عند GLC", "finish"],
    ["GLC برما كول 001 — 2.5 لتر", "لتر", 10.0, 2.5, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 25000 — 0.9 لتر", "لتر", 13.5, 0.9, "12–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 25000 — 2.7 لتر", "لتر", 13.5, 2.7, "12–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين جلتكس 25000 — 9 لتر", "لتر", 13.5, 9.0, "12–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك نصف لامع — 0.9 لتر", "لتر", 14.0, 0.9, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك نصف لامع — 2.7 لتر", "لتر", 14.0, 2.7, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك نصف لامع — 9 لتر", "لتر", 14.0, 9.0, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك مط — 0.9 لتر", "لتر", 14.0, 0.9, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك مط — 2.7 لتر", "لتر", 14.0, 2.7, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين سوبر لاك مط — 9 لتر", "لتر", 14.0, 9.0, "13–15 عند GLC", "finish"],
    ["GLC سوبر بلاتين لاكشري مط 7000 — 0.9 لتر", "لتر", 10.0, 0.9, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين لاكشري مط 7000 — 2.7 لتر", "لتر", 10.0, 2.7, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين لاكشري مط 7000 — 9 لتر", "لتر", 10.0, 9.0, "9–11 عند GLC", "finish"],
    ["GLC سوبر بلاتين هايجين سيلك 8000 — 0.9 لتر", "لتر", 11.0, 0.9, "10–12 عند GLC", "finish"],
    ["GLC سوبر بلاتين هايجين سيلك 8000 — 2.7 لتر", "لتر", 11.0, 2.7, "10–12 عند GLC", "finish"],
    ["GLC سوبر بلاتين هايجين سيلك 8000 — 9 لتر", "لتر", 11.0, 9.0, "10–12 عند GLC", "finish"],
    ["GLC أمبيانس ڤلڤتووا — 0.9 لتر", "لتر", 7.0, 0.9, "6–8 عند GLC", "finish"],
    ["GLC أمبيانس ڤلڤتووا — 2.7 لتر", "لتر", 7.0, 2.7, "6–8 عند GLC", "finish"],
    ["GLC أمبيانس موزايك نيو — 0.9 لتر", "لتر", 6.5, 0.9, "5–8 عند GLC", "finish"],
    ["GLC أمبيانس موزايك نيو — 2.7 لتر", "لتر", 6.5, 2.7, "5–8 عند GLC", "finish"],
    ["GLC أمبيانس ميكسيكانو نيو — 2.5 لتر", "لتر", 1.5, 2.5, "1–2 عند GLC", "finish"],
    ["GLC أمبيانس ميكسيكانو نيو — 9 لتر", "لتر", 1.5, 9.0, "1–2 عند GLC", "finish"],
    ["GLC أمبيانس كلر ڤاروني — 0.9 لتر", "لتر", 7.0, 0.9, "6–8 عند GLC", "finish"],
    ["GLC أمبيانس كلر ڤاروني — 2.7 لتر", "لتر", 7.0, 2.7, "6–8 عند GLC", "finish"],
    ["GLC ستورم شيلد بريميوم توب كوت مط — 1 لتر", "لتر", 10.0, 1.0, "9–11 عند GLC", "finish"],
    ["GLC ستورم شيلد بريميوم توب كوت مط — 9 لتر", "لتر", 10.0, 9.0, "9–11 عند GLC", "finish"],
    ["GLC ستورم شيلد بريميوم توب كوت سيلك — 1 لتر", "لتر", 13.0, 1.0, "12–14 عند GLC", "finish"],
    ["GLC ستورم شيلد بريميوم توب كوت سيلك — 9 لتر", "لتر", 13.0, 9.0, "12–14 عند GLC", "finish"],
    ["GLC فليكس أنتي-كاربونيشن — 9 لتر", "لتر", 10.5, 9.0, "10–11 عند GLC", "finish"],
    ["GLC ستورم شيلد بلاتزو هاي تكس — 20 لتر", "لتر", 1.5, 20.0, "1–2 عند GLC", "finish"],
    ["GLC ستورم شيلد بلاتزو هاي تكس لايت — 20 لتر", "لتر", 1.5, 20.0, "1–2 عند GLC", "finish"],
    ["GLC ستورم شيلد بلاتزو هاي تكس رويال — 20 لتر", "لتر", 1.5, 20.0, "1–2 عند GLC", "finish"],
    ["GLC ستورم شيلد بلاتزو ميديوم تكس — 9 لتر", "لتر", 1.5, 9.0, "1–2 عند GLC", "finish"],
    ["Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 0.9 لتر", "لتر", 10.3, 0.9, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 3.6 لتر", "لتر", 10.3, 3.6, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 9 لتر", "لتر", 10.3, 9, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 18 لتر", "لتر", 10.3, 18, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 0.9 لتر", "لتر", 9.06, 0.9, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 3.6 لتر", "لتر", 9.06, 3.6, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 9 لتر", "لتر", 9.06, 9, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك بيتي ناعم حريري (My Home Smooth Silk) — 18 لتر", "لتر", 9.06, 18, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 0.9 لتر", "لتر", 10, 0.9, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 3.6 لتر", "لتر", 10, 3.6, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 9 لتر", "لتر", 10, 9, "تغطية Jotun", "finish"],
    ["Jotun فينوماستيك مذهل راقي (Wonderwall Lux) — 18 لتر", "لتر", 10, 18, "تغطية Jotun", "finish"],
    ["Jotun ليدي لمسة شامواه (Touch of Suede) — 0.9 لتر", "لتر", 11.8, 0.9, "تغطية Jotun", "finish"],
    ["Jotun ليدي لمسة شامواه (Touch of Suede) — 2.7 لتر", "لتر", 11.8, 2.7, "تغطية Jotun", "finish"],
    ["Jotun ليدي بيرل (Pearl) — 0.9 لتر", "لتر", 9, 0.9, "تغطية Jotun", "finish"],
    ["Jotun ليدي بيرل (Pearl) — 3.6 لتر", "لتر", 9, 3.6, "تغطية Jotun", "finish"],
    ["Jotun ليدي رويال فلفيت (Royal Velvet) — 0.9 لتر", "لتر", 9, 0.9, "تغطية Jotun", "finish"],
    ["Jotun ليدي رويال فلفيت (Royal Velvet) — 3.6 لتر", "لتر", 9, 3.6, "تغطية Jotun", "finish"],
    ["Jotun ليدي جليز (Glaze) — 0.45 لتر", "لتر", 14, 0.45, "تغطية Jotun", "finish"],
    ["Jotun ليدي جليز (Glaze) — 0.9 لتر", "لتر", 14, 0.9, "تغطية Jotun", "finish"],
    ["Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 1 لتر", "لتر", 1.95, 1, "تغطية Jotun", "finish"],
    ["Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 4 لتر", "لتر", 1.95, 4, "تغطية Jotun", "finish"],
    ["Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 10 لتر", "لتر", 1.95, 10, "تغطية Jotun", "finish"],
    ["Jotun ليدي ستوكو أنتيكا (Stucco Antica) — 14 لتر", "لتر", 1.95, 14, "تغطية Jotun", "finish"],
    ["Jotun ليدي رومانو (Romano) — 1 لتر", "لتر", 2.1, 1, "تغطية Jotun", "finish"],
    ["Jotun ليدي رومانو (Romano) — 4 لتر", "لتر", 2.1, 4, "تغطية Jotun", "finish"],
    ["ورق صنفرة", "فرخ", 10, 1, "", "sand"]
  ];
  var BRANDS = {GLC: "GLC سوبر بلاتين لاكشري مط 7000 — 9 لتر", Jotun: "Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 3.6 لتر"};
  var brandOf = function(p){ return p[0].indexOf("Jotun ") === 0 ? "Jotun" : p[0].indexOf("GLC ") === 0 ? "GLC" : ""; };
  // [stage, default product name, coats, on ceiling]
  var STAGES = [
    ["سيلر", "GLC المقاوم 0017 — 9 لتر", 1, true],
    ["معجون", "GLC معجون داي-تون 100 — 15 كجم", 2, true],
    ["صنفرة", "ورق صنفرة", 2, true],
    ["بطانة", "GLC سوبر داي-تون 3030 — 3.8 لتر", 1, true],
    ["الوش النهائي", "Jotun فينوماستيك بيتي مطفي غني (My Home Rich Matt) — 3.6 لتر", 2, true]
  ];
  var num = function(v){ v = parseFloat(v); return isFinite(v) && v >= 0 ? v : null; };
  var up = function(x){ return Math.ceil(x - 1e-9); }; // ROUNDUP(x,0) for x >= 0
  var idx = function(name){ for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i][0] === name) return i; return 0; };
  // each stage lists only its own kind of product (PRODUCTS[i][5]): base = 3030 / 7070 / Gltex, finish = Fenomastic-type finishes
  var CATS = [["sealer"], ["putty"], ["sand"], ["base"], ["finish"]];
  var FIN = STAGES.length - 1; // the finish coat gets a GLC / Jotun picker
  var FIN_BRAND = "Jotun";     // the finish coat's brand when the page opens
  var COATS = [0, 1, 2, 3, 4];
  var YES = "نعم", NO = "لا";  // the "on the ceiling too?" choice's values
  // The products a stage offers, as indexes into PRODUCTS (brand: '' for every brand).
  var productsFor = function(brand, cats){ var out = []; PRODUCTS.forEach(function(p, i){ if ((!brand || brandOf(p) === brand) && cats.indexOf(p[5]) >= 0) out.push(i); }); return out; };

  var DEFAULTS = { flat: '80', height: '3', len: '', open: '', ceil: '', waste: '10', labour: '' };

  /*
   * input: { flat, height, len, open, ceil, waste, labour,
   *          stages: [{ p, c, s, v }] }   (p: product index, c: coats, s: YES / NO, v: pack price)
   */
  function compute(input) {
    var flat = num(input.flat) || 0, H = num(input.height) || 0;
    var lenIn = num(input.len), openIn = num(input.open), ceilIn = num(input.ceil);
    var L = lenIn === null ? flat : lenIn;
    var O = openIn === null ? 0.125 * L * H : openIn;
    var walls = Math.max(0, L * H - O);
    var ceil = ceilIn === null ? 0.93 * flat : ceilIn;
    var total = walls + ceil;
    var waste = (num(input.waste) || 0) / 100, labour = num(input.labour);

    var mat = 0, priced = true, S = [];
    STAGES.forEach(function(s, i){
      var st = input.stages[i];
      var p = PRODUCTS[st.p], coats = +st.c, onCeil = st.s === "نعم";
      var price = num(st.v);
      var area = coats === 0 ? 0 : walls + (onCeil ? ceil : 0);
      var qty = area * coats / p[2] * (1 + waste), packs = up(qty / p[3]);
      var cost = price === null ? null : packs * price;
      if (packs > 0 && cost === null) priced = false;
      mat += cost || 0;
      S.push({name: s[0], prod: p[0], unit: p[1], rate: p[2], size: p[3], range: p[4], coats: coats, area: area, qty: qty, packs: packs, cost: cost});
    });
    var lab = labour === null ? 0 : total * labour, grand = mat + lab;
    var anyPrice = mat > 0 || labour !== null;

    return {flat: flat, H: H, L: L, O: O, walls: walls, ceil: ceil, total: total, waste: waste, labour: labour, lab: lab,
            mat: mat, grand: grand, anyPrice: anyPrice, priced: priced, lenEst: lenIn === null, ceilEst: ceilIn === null,
            est: lenIn === null || ceilIn === null, S: S};
  }

  return { PRODUCTS: PRODUCTS, BRANDS: BRANDS, STAGES: STAGES, CATS: CATS, FIN: FIN, FIN_BRAND: FIN_BRAND, COATS: COATS,
           YES: YES, NO: NO, DEFAULTS: DEFAULTS, brandOf: brandOf, idx: idx, productsFor: productsFor,
           num: num, up: up, compute: compute };
});
