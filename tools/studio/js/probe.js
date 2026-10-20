// Colour figures at given points (mean over a 5 x 5 patch): CIELAB L, chroma C, hue h and the
// saturation ratio C / (L + 5) used by compose.js colour rules. args: { src, points: {name: [x, y]} }
import { pixels, lab } from './lib.js';

export default async function ({ src, points }) {
  const im = await pixels(src), out = {};
  for (const [name, [x, y]] of Object.entries(points)) {
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const i = ((y + dy) * im.width + x + dx) * 4;
      r += im.data[i]; g += im.data[i + 1]; b += im.data[i + 2]; n++;
    }
    const [L, A, B] = lab(r / n, g / n, b / n), C = Math.hypot(A, B);
    out[name] = { rgb: [r / n, g / n, b / n].map(Math.round), L: +L.toFixed(1), C: +C.toFixed(1),
                  h: +((Math.atan2(B, A) * 180 / Math.PI + 360) % 360).toFixed(0), ratio: +(C / (L + 5)).toFixed(3) };
  }
  return { points: out };
}
