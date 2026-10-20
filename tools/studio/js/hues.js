// Ground / motif colours of a masked fabric by relative coolness: the coolest `share` of pixels
// (highest blue/red ratio) against the warmest half. Returns linear means and pixel counts.
import { pixels, maskArray, toLin } from './lib.js';
export default async function ({ src, mask, channel = 0, zone = null, zoneOn = true, share = 0.25 }) {
  const im = await pixels(src), m = await pixels(mask), z = zone ? await maskArray(zone) : null;
  const px = [];
  for (let i = 0; i < im.width * im.height; i++) {
    if (m.data[i * 4 + channel] < 200) continue;
    if (z && ((z[i] > 0.5) !== zoneOn)) continue;
    const r = toLin(im.data[i * 4]), g = toLin(im.data[i * 4 + 1]), b = toLin(im.data[i * 4 + 2]);
    if (r < 0.01) continue;
    px.push([b / r, r, g, b]);
  }
  px.sort((a, b) => a[0] - b[0]);
  const mean = a => { const s = [0, 0, 0]; for (const p of a) { s[0] += p[1]; s[1] += p[2]; s[2] += p[3]; } return s.map(v => +(v / a.length).toFixed(4)); };
  const n = px.length;
  return { n, warmHalf: mean(px.slice(0, n >> 1)), coolest: mean(px.slice(Math.floor(n * (1 - share)))), all: mean(px),
           ratio: [px[Math.floor(n * 0.1)][0], px[n >> 1][0], px[Math.floor(n * 0.9)][0]].map(v => +v.toFixed(3)) };
}
