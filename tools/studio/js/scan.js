// A scan's colour map -> color.webp (up to 2048 px) and swatch.webp (320 px, the centre at real detail).
import { loadImage, canvasOf } from './lib.js';

export default async function ({ src, size = 2048 }) {
  const img = await loadImage(src);
  const k = Math.min(1, size / img.naturalWidth);
  const c = canvasOf(Math.round(img.naturalWidth * k), Math.round(img.naturalHeight * k));
  const x = c.getContext('2d');
  x.imageSmoothingQuality = 'high';
  x.drawImage(img, 0, 0, c.width, c.height);
  const s = Math.min(img.naturalWidth, img.naturalHeight) * 0.5, sw = canvasOf(320, 320), sx = sw.getContext('2d');
  sx.imageSmoothingQuality = 'high';
  sx.drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, 320, 320);
  return { 'color.webp': c.toDataURL('image/webp', 0.88), 'swatch.webp': sw.toDataURL('image/webp', 0.9) };
}
