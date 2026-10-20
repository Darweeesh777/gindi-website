// A contact sheet of images (e.g. a room's swatches): args { files: [url], size }
import { loadImage, canvasOf } from './lib.js';
export default async function ({ files, size = 150 }) {
  const cols = 6, c = canvasOf(cols * size, Math.ceil(files.length / cols) * (size + 16)), x = c.getContext('2d');
  x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.font = '11px sans-serif';
  for (let i = 0; i < files.length; i++) {
    const img = await loadImage(files[i]), gx = (i % cols) * size, gy = Math.floor(i / cols) * (size + 16);
    x.drawImage(img, gx, gy + 16, size, size); x.fillStyle = '#000'; x.fillText(files[i].split('/').pop(), gx + 2, gy + 12);
  }
  return { 'contact.jpg': c.toDataURL('image/jpeg', 0.88) };
}
