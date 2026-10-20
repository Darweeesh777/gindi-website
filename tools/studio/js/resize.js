// Responsive WebP copies of one image: { src, widths: [w, ...], q } -> '<w>.webp' for each width
// (the full width included when listed). Proportions are kept; nothing is cropped.
import { loadImage, canvasOf } from './lib.js';

export default async function ({ src, widths, q = 0.82 }) {
  const img = await loadImage(src);
  const out = { size: [img.naturalWidth, img.naturalHeight] };
  for (const w of widths) {
    const h = Math.round(img.naturalHeight * w / img.naturalWidth);
    // Halve in steps for a clean downscale, then draw at the final size.
    let source = img, sw = img.naturalWidth, sh = img.naturalHeight;
    while (sw / 2 >= w * 1.2) {
      const step = canvasOf(Math.round(sw / 2), Math.round(sh / 2)), sx = step.getContext('2d');
      sx.imageSmoothingQuality = 'high';
      sx.drawImage(source, 0, 0, step.width, step.height);
      source = step; sw = step.width; sh = step.height;
    }
    const c = canvasOf(w, h), x = c.getContext('2d');
    x.imageSmoothingQuality = 'high';
    x.drawImage(source, 0, 0, w, h);
    out[`${w}.webp`] = c.toDataURL('image/webp', q);
  }
  return out;
}
