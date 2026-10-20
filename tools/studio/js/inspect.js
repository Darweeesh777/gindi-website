// Inspection images for choosing prompt points and checking masks.
// mode 'grid':  a crop of the image with a pixel-coordinate grid ({crop: [x, y, w, h], scale, step})
// mode 'masks': the given masks tinted red over the image, side by side ({masks: [url], crop, scale})
import { loadImage, pixels, canvasOf } from './lib.js';

export default async function ({ mode, src, crop, scale = 1, step = 50, masks = [] }) {
  const img = await loadImage(src);
  const [x0, y0, w, h] = crop || [0, 0, img.naturalWidth, img.naturalHeight];
  if (mode === 'grid') {
    const c = canvasOf(Math.round(w * scale), Math.round(h * scale)), x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    x.drawImage(img, x0, y0, w, h, 0, 0, c.width, c.height);
    x.font = '11px sans-serif';
    for (let gx = Math.ceil(x0 / step) * step; gx < x0 + w; gx += step) {
      const big = gx % (step * 2) === 0;
      x.strokeStyle = big ? 'rgba(255,0,255,0.8)' : 'rgba(0,255,255,0.4)';
      x.beginPath(); x.moveTo((gx - x0) * scale + 0.5, 0); x.lineTo((gx - x0) * scale + 0.5, c.height); x.stroke();
      if (big) { x.fillStyle = '#ff0'; x.fillText(gx, (gx - x0) * scale + 2, 11); }
    }
    for (let gy = Math.ceil(y0 / step) * step; gy < y0 + h; gy += step) {
      const big = gy % (step * 2) === 0;
      x.strokeStyle = big ? 'rgba(255,0,255,0.8)' : 'rgba(0,255,255,0.4)';
      x.beginPath(); x.moveTo(0, (gy - y0) * scale + 0.5); x.lineTo(c.width, (gy - y0) * scale + 0.5); x.stroke();
      if (big) { x.fillStyle = '#ff0'; x.fillText(gy, 2, (gy - y0) * scale - 2); }
    }
    return { 'grid.jpg': c.toDataURL('image/jpeg', 0.9) };
  }
  if (mode === 'masks') {
    const cw = Math.round(w * scale), ch = Math.round(h * scale);
    const c = canvasOf(cw * masks.length, ch), x = c.getContext('2d', { willReadFrequently: true });
    for (let k = 0; k < masks.length; k++) {
      const md = await pixels(masks[k]);
      const mc = canvasOf(md.width, md.height); mc.getContext('2d').putImageData(md, 0, 0);
      const t = canvasOf(cw, ch), tx = t.getContext('2d', { willReadFrequently: true });
      tx.drawImage(mc, x0, y0, w, h, 0, 0, cw, ch);
      const m = tx.getImageData(0, 0, cw, ch).data;
      x.drawImage(img, x0, y0, w, h, k * cw, 0, cw, ch);
      const d = x.getImageData(k * cw, 0, cw, ch);
      for (let i = 0; i < cw * ch; i++) { const a = m[i * 4] / 255 * 0.6; d.data[i * 4] = d.data[i * 4] * (1 - a) + 255 * a; d.data[i * 4 + 1] *= 1 - a; d.data[i * 4 + 2] *= 1 - a * 0.3; }
      x.putImageData(d, k * cw, 0);
      x.fillStyle = '#ff0'; x.font = 'bold 13px sans-serif'; x.fillText(masks[k].split('/').pop(), k * cw + 4, 15);
    }
    return { 'masks.jpg': c.toDataURL('image/jpeg', 0.88) };
  }
  throw new Error('unknown mode ' + mode);
}
