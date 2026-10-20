// Slot masks from SAM object masks, colour rules and shapes (the room's "recipe").
// args: { src, samDir, recipe, crops }
// recipe: { classes: {name: rule}, upholstery: expr, stone: expr, wood: expr, zones: {name: expr} }
// Expressions: "m:<sam mask>" | "c:<class>" | "c:!<class>" | ["or", ...] | ["and", ...] | ["minus", a, b]
//   | ["grow", e, r] | ["shrink", e, r] | ["close", e, r] | ["blur", e, r] | ["rect", x0, y0, x1, y1]
//   | ["poly", [[x, y], ...]] | ["ellipse", cx, cy, rx, ry]
// Class rule (colour, CIELAB): saturation ratio C/(L+Loff) between r0..r1, hue below h0..h1 (deg),
//   lightness below l0..l1 (each a soft step); optional "hmin" (hue above), "lmin" (lightness above).
// Slots are exclusive: stone, then wood, then upholstery (a pixel belongs to one material).
// Returns upholstery.png, stone.png, wood.png, zone_<name>.png, overlay.jpg, crop<k>.jpg, areas.
import { pixels, maskArray, lab, smoothstep as ss, box, morph, greyPNG, canvasOf } from './lib.js';

export default async function ({ src, samDir, recipe, crops = [] }) {
  const im = await pixels(src);
  const W = im.width, H = im.height, N = W * H;
  const names = new Set();
  JSON.stringify(recipe).replace(/"m:([A-Za-z0-9_]+)"/g, (_, n) => names.add(n));
  const M = {};
  for (const n of names) M[n] = await maskArray(`${samDir}/${n}.png`);
  const L = new Float32Array(N), C = new Float32Array(N), Hh = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const [l, a, b] = lab(im.data[i * 4], im.data[i * 4 + 1], im.data[i * 4 + 2]);
    L[i] = l; C[i] = Math.hypot(a, b); Hh[i] = (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
  }
  const classFn = k => p => {
    const r = C[p] / (L[p] + (k.Loff ?? 5));
    let v = ss(k.r0 ?? -1, k.r1 ?? 0, r);
    if (k.h0 !== undefined) v *= 1 - ss(k.h0, k.h1, Hh[p]);
    if (k.hmin !== undefined) v *= ss(k.hmin - 5, k.hmin + 5, Hh[p]);
    if (k.l0 !== undefined) v *= 1 - ss(k.l0, k.l1, L[p]);
    if (k.lmin !== undefined) v *= ss(k.lmin - 4, k.lmin + 4, L[p]);
    return v;
  };
  const cache = {};
  const field = name => {
    if (cache[name]) return cache[name];
    const neg = name.startsWith('!'), f = classFn(recipe.classes[name.replace(/^!/, '')]), a = new Float32Array(N);
    for (let i = 0; i < N; i++) a[i] = neg ? 1 - f(i) : f(i);
    return (cache[name] = box(a, W, H, 1));
  };
  const shape = draw => {
    const c = canvasOf(W, H), x = c.getContext('2d');
    x.fillStyle = '#fff'; x.beginPath(); draw(x); x.fill();
    const d = x.getImageData(0, 0, W, H).data, o = new Float32Array(N);
    for (let i = 0; i < N; i++) o[i] = d[i * 4 + 3] / 255;
    return o;
  };
  const ev = e => {
    if (typeof e === 'string') {
      if (e.startsWith('m:')) return M[e.slice(2)];
      if (e.startsWith('c:')) return field(e.slice(2));
      throw new Error('unknown term ' + e);
    }
    const [op, ...a] = e;
    if (op === 'or' || op === 'and') {
      const xs = a.map(ev), o = new Float32Array(N);
      for (let i = 0; i < N; i++) { let v = op === 'or' ? 0 : 1; for (const x of xs) v = op === 'or' ? Math.max(v, x[i]) : v * x[i]; o[i] = v; }
      return o;
    }
    if (op === 'minus') { const x = ev(a[0]), y = ev(a[1]), o = new Float32Array(N); for (let i = 0; i < N; i++) o[i] = x[i] * (1 - y[i]); return o; }
    if (op === 'grow' || op === 'shrink') return morph(ev(a[0]), W, H, a[1], op);
    if (op === 'close') return morph(morph(ev(a[0]), W, H, a[1], 'grow'), W, H, a[1], 'shrink');
    if (op === 'blur') return box(ev(a[0]), W, H, a[1]);
    if (op === 'rect') return shape(x => x.rect(a[0], a[1], a[2] - a[0], a[3] - a[1]));
    if (op === 'poly') return shape(x => a[0].forEach(([px, py], k) => (k ? x.lineTo(px, py) : x.moveTo(px, py))));
    if (op === 'ellipse') return shape(x => x.ellipse(a[0], a[1], a[2], a[3], 0, 0, Math.PI * 2));
    throw new Error('unknown op ' + op);
  };
  const out = {}, slots = {}, taken = new Float32Array(N);
  for (const slot of ['stone', 'wood', 'upholstery']) {
    const m = recipe[slot] ? ev(recipe[slot]).slice() : new Float32Array(N);
    let area = 0;
    for (let i = 0; i < N; i++) { m[i] = Math.min(1, Math.max(0, m[i])) * (1 - taken[i]); taken[i] = Math.min(1, taken[i] + m[i]); area += m[i]; }
    slots[slot] = m;
    out[`${slot}.png`] = greyPNG(m, W, H);
    out[`area_${slot}`] = +(area / N).toFixed(4);
  }
  for (const [name, e] of Object.entries(recipe.zones || {})) out[`zone_${name}.png`] = greyPNG(ev(e), W, H);
  // Overlay for review: upholstery magenta, stone cyan, wood/third slot yellow.
  const col = { upholstery: [255, 0, 170], stone: [0, 220, 255], wood: [255, 210, 0] };
  const ov = canvasOf(W, H), ox = ov.getContext('2d'), od = ox.createImageData(W, H);
  for (let i = 0; i < N; i++) {
    let r = im.data[i * 4], g = im.data[i * 4 + 1], b = im.data[i * 4 + 2];
    for (const k in slots) { const a2 = slots[k][i] * 0.55; r = r * (1 - a2) + col[k][0] * a2; g = g * (1 - a2) + col[k][1] * a2; b = b * (1 - a2) + col[k][2] * a2; }
    od.data[i * 4] = r; od.data[i * 4 + 1] = g; od.data[i * 4 + 2] = b; od.data[i * 4 + 3] = 255;
  }
  ox.putImageData(od, 0, 0);
  out['overlay.jpg'] = ov.toDataURL('image/jpeg', 0.9);
  const photo = canvasOf(W, H); photo.getContext('2d').putImageData(im, 0, 0);
  crops.forEach(([x0, y0, w, h, s = 2], k) => {
    const c = canvasOf(w * s, h * s * 2), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(photo, x0, y0, w, h, 0, 0, w * s, h * s);
    x.drawImage(ov, x0, y0, w, h, 0, h * s, w * s, h * s);
    out[`crop${k}.jpg`] = c.toDataURL('image/jpeg', 0.9);
  });
  return out;
}
