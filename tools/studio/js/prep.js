// The compositor's maps for one room, from the image and the composed slot masks.
//   mask.png  R = upholstery, G = stone, B = third slot (soft, exclusive)
//   light.png R/G/B = sqrt of each surface's local luminance, blurred within the surface only
//             (stone: within each stone part), radii rU / rS / rW px
//   zone.png  R = upholstery second zone (255) | stone part (0 top, 128 side, 255 base)
//             G = stone rim band (outer `edge` px of the top), B = sqrt of stone luminance blurred rE px
// args: { src, maskDir, rU, rS, rW, edge, rE }   (maskDir holds compose.js output)
// Also returns calibration figures: mean linear colour per surface/zone, a two-colour split of each
// upholstery zone and of the third slot (ground / motif), and the bounding box of each stone part.
import { pixels, maskArray, toLin, box, morph, rgbPNG } from './lib.js';

async function optional(src) {
  try { return await maskArray(src); } catch { return null; }
}

export default async function ({ src, maskDir, rU = 5, rS = 9, rW = 4, edge = 6, rE = 2 }) {
  const im = await pixels(src);
  const W = im.width, H = im.height, N = W * H;
  const ms = {};
  for (const s of ['upholstery', 'stone', 'wood']) ms[s] = await maskArray(`${maskDir}/${s}.png`);
  const zU = await optional(`${maskDir}/zone_upholstery2.png`);
  const zSide = await optional(`${maskDir}/zone_stone_side.png`);
  const zBase = await optional(`${maskDir}/zone_stone_base.png`);
  const lin = new Float32Array(N * 3), Y = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    for (let k = 0; k < 3; k++) lin[i * 3 + k] = toLin(im.data[i * 4 + k]);
    Y[i] = 0.2126 * lin[i * 3] + 0.7152 * lin[i * 3 + 1] + 0.0722 * lin[i * 3 + 2];
  }
  const gauss = (a, r) => box(box(box(a, W, H, r), W, H, r), W, H, r);
  const localLum = (m, r) => {
    const ym = new Float32Array(N), mm = new Float32Array(N);
    for (let i = 0; i < N; i++) { const w = m[i] > 0.02 ? 1 : 0; ym[i] = Y[i] * w; mm[i] = w; }
    const a = gauss(ym, r), b = gauss(mm, r), o = new Float32Array(N);
    for (let i = 0; i < N; i++) o[i] = b[i] > 1e-6 && m[i] > 0.002 ? a[i] / b[i] : 0;
    return o;
  };
  // Stone part per pixel: 0 top, 1 side, 2 base.
  const part = new Uint8Array(N);
  for (let i = 0; i < N; i++) part[i] = zBase && zBase[i] > 0.5 ? 2 : zSide && zSide[i] > 0.5 ? 1 : 0;
  const LS = new Float32Array(N);
  for (let p = 0; p < 3; p++) {
    const m = new Float32Array(N); let any = false;
    for (let i = 0; i < N; i++) if (part[i] === p && ms.stone[i] > 0) { m[i] = ms.stone[i]; any = true; }
    if (!any) continue;
    const l = localLum(m, rS);
    for (let i = 0; i < N; i++) if (part[i] === p) LS[i] = l[i];
  }
  const LU = localLum(ms.upholstery, rU), LW = localLum(ms.wood, rW);
  // Rim band: the outer `edge` px of the stone top (lit with a small blur, keeping the moulding).
  const top = new Float32Array(N);
  for (let i = 0; i < N; i++) top[i] = ms.stone[i] > 0.5 && part[i] === 0 ? 1 : 0;
  const inner = box(morph(top, W, H, edge, 'shrink'), W, H, 1);
  const LE = localLum(ms.stone, rE);
  const enc = v => Math.round(Math.sqrt(Math.min(1, Math.max(0, v))) * 255);
  const out = {};
  out['mask.png'] = rgbPNG(W, H, (i, d) => { d[i * 4] = Math.round(ms.upholstery[i] * 255); d[i * 4 + 1] = Math.round(ms.stone[i] * 255); d[i * 4 + 2] = Math.round(ms.wood[i] * 255); });
  out['light.png'] = rgbPNG(W, H, (i, d) => { d[i * 4] = enc(LU[i]); d[i * 4 + 1] = enc(LS[i]); d[i * 4 + 2] = enc(LW[i]); });
  out['zone.png'] = rgbPNG(W, H, (i, d) => {
    const r = ms.stone[i] > 0 ? [0, 128, 255][part[i]] : zU && ms.upholstery[i] > 0 ? Math.round(zU[i] * 255) : 0;
    d[i * 4] = r;
    d[i * 4 + 1] = part[i] === 0 && ms.stone[i] > 0 ? Math.round(Math.max(0, Math.min(1, 1 - inner[i])) * 255) : 0;
    d[i * 4 + 2] = enc(LE[i]);
  });
  // Calibration figures.
  const mean = w => { let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < N; i++) { const k = w(i); if (k <= 0) continue; r += lin[i * 3] * k; g += lin[i * 3 + 1] * k; b += lin[i * 3 + 2] * k; n += k; } return n ? [r / n, g / n, b / n].map(v => +v.toFixed(4)) : null; };
  // Two-colour split by chromaticity (k-means, k = 2): the ground (larger) and the motif.
  const split = w => {
    const idx = []; for (let i = 0; i < N; i += 2) if (w(i) > 0.5 && Y[i] > 0.01) idx.push(i);
    if (idx.length < 50) return null;
    const ch = i => [lin[i * 3] / Y[i], lin[i * 3 + 1] / Y[i], lin[i * 3 + 2] / Y[i]];
    let c0 = ch(idx[0]), c1 = ch(idx[idx.length >> 1]);
    let a0 = [], a1 = [];
    for (let it = 0; it < 12; it++) {
      a0 = []; a1 = [];
      for (const i of idx) { const c = ch(i); const d0 = (c[0] - c0[0]) ** 2 + (c[1] - c0[1]) ** 2 + (c[2] - c0[2]) ** 2, d1 = (c[0] - c1[0]) ** 2 + (c[1] - c1[1]) ** 2 + (c[2] - c1[2]) ** 2; (d0 <= d1 ? a0 : a1).push(i); }
      const avg = a => { const s = [0, 0, 0]; for (const i of a) { const c = ch(i); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; } return s.map(v => v / Math.max(1, a.length)); };
      c0 = avg(a0); c1 = avg(a1);
    }
    const m = a => { const s = [0, 0, 0]; for (const i of a) { s[0] += lin[i * 3]; s[1] += lin[i * 3 + 1]; s[2] += lin[i * 3 + 2]; } return s.map(v => +(v / Math.max(1, a.length)).toFixed(4)); };
    const [g, mo] = a0.length >= a1.length ? [a0, a1] : [a1, a0];
    return { ground: m(g), motif: m(mo), motifShare: +(mo.length / idx.length).toFixed(3), chromaDistance: +Math.hypot(c0[0] - c1[0], c0[1] - c1[1], c0[2] - c1[2]).toFixed(3) };
  };
  out.upholstery_zone1 = { mean: mean(i => ms.upholstery[i] * (zU ? 1 - zU[i] : 1)), split: split(i => ms.upholstery[i] * (zU ? 1 - zU[i] : 1)) };
  if (zU) out.upholstery_zone2 = { mean: mean(i => ms.upholstery[i] * zU[i]), split: split(i => ms.upholstery[i] * zU[i]) };
  out.wood = { mean: mean(i => ms.wood[i]), split: split(i => ms.wood[i]) };
  out.stone = { mean: mean(i => ms.stone[i]), meanY: +(() => { let s = 0, n = 0; for (let i = 0; i < N; i++) { s += Y[i] * ms.stone[i]; n += ms.stone[i]; } return s / Math.max(1, n); })().toFixed(4) };
  out.stone_parts = [0, 1, 2].map(p => {
    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let i = 0; i < N; i++) if (part[i] === p && ms.stone[i] > 0.5) { const x = i % W, y = (i / W) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return x1 < 0 ? null : { x0, x1, y0, y1 };
  });
  return out;
}
