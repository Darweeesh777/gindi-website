// Shared helpers for the studio tools (run in headless Chrome by tools/studio/studio_tool.py).

export async function loadImage(src) {
  const img = new Image();
  img.src = src;
  await img.decode();
  return img;
}

export async function pixels(src) {
  const img = await loadImage(src);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0);
  return x.getImageData(0, 0, c.width, c.height);
}

// A grey mask image (red channel) as a Float32Array of 0..1.
export async function maskArray(src) {
  const d = (await pixels(src)).data, a = new Float32Array(d.length / 4);
  for (let i = 0; i < a.length; i++) a[i] = d[i * 4] / 255;
  return a;
}

export const toLin = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };

export function lab(r, g, b) {
  const R = toLin(r), G = toLin(g), B = toLin(b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047, Y = 0.2126 * R + 0.7152 * G + 0.0722 * B, Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  const t = v => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116);
  return [116 * t(Y) - 16, 500 * (t(X) - t(Y)), 200 * (t(Y) - t(Z))];
}

export const smoothstep = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// Separable box blur (r = radius in px), normalised.
export function box(src, W, H, r) {
  const N = W * H, tmp = new Float32Array(N), out = new Float32Array(N), k = 2 * r + 1;
  for (let y = 0; y < H; y++) {
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[y * W + Math.min(W - 1, Math.max(0, x))];
    for (let x = 0; x < W; x++) { tmp[y * W + x] = s / k; s += src[y * W + Math.min(W - 1, x + r + 1)] - src[y * W + Math.max(0, x - r)]; }
  }
  for (let x = 0; x < W; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x];
    for (let y = 0; y < H; y++) { out[y * W + x] = s / k; s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; }
  }
  return out;
}

// Grow (max) or shrink (min) with a square window of radius r.
export function morph(a, W, H, r, op) {
  const N = W * H, tmp = new Float32Array(N), out = new Float32Array(N), fn = op === 'grow' ? Math.max : Math.min;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = a[y * W + x];
    for (let d = -r; d <= r; d++) { const xx = x + d; if (xx >= 0 && xx < W) v = fn(v, a[y * W + xx]); }
    tmp[y * W + x] = v;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let v = tmp[y * W + x];
    for (let d = -r; d <= r; d++) { const yy = y + d; if (yy >= 0 && yy < H) v = fn(v, tmp[yy * W + x]); }
    out[y * W + x] = v;
  }
  return out;
}

export function canvasOf(W, H) {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  return c;
}

// Write a 0..1 array as an 8-bit grey PNG data URL.
export function greyPNG(a, W, H) {
  const c = canvasOf(W, H), x = c.getContext('2d'), d = x.createImageData(W, H);
  for (let i = 0; i < W * H; i++) {
    const v = Math.round(Math.min(1, Math.max(0, a[i])) * 255);
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  return c.toDataURL('image/png');
}

// An RGB PNG from a fill(i, data) callback.
export function rgbPNG(W, H, fill) {
  const c = canvasOf(W, H), x = c.getContext('2d'), d = x.createImageData(W, H);
  for (let i = 0; i < W * H; i++) { fill(i, d.data); d.data[i * 4 + 3] = 255; }
  x.putImageData(d, 0, 0);
  return c.toDataURL('image/png');
}
