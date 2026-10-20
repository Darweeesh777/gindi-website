// Render a room with the site's own compositor (static/studio/compositor.js).
// args: { mode, room, slots, ... }
//   room  = { width, height, photo, maps: {mask, light, zone}, render }   (as the page receives it)
//   slots = { upholstery: [option], stone: [option], wood: [option] }       (option 0 = the image itself)
// mode 'sheet': every option of each slot (others as in the image) + `combos`, full frame and `crops`
//   -> full.jpg, crop<k>.jpg
// mode 'combos': `combos` = {name: {slot: index}} -> <name>.jpg at full size
// mode 'build': photo.webp, card.webp, light.webp, swatches/<slot>-<id>.webp (crops of the rendered
//   room at `swatch[slot]` = [x, y, size] or two [x, y, size] halves), quiz-<name>.webp (`quiz` crops)
import { loadImage, canvasOf } from './lib.js';

const SLOTS = ['upholstery', 'stone', 'wood'];

export default async function (args) {
  const { createCompositor } = await import('/static/studio/compositor.js?t=' + Date.now());
  const { room, slots } = args;
  const canvas = canvasOf(room.width, room.height);
  document.body.append(canvas);
  const comp = createCompositor(canvas);
  await comp.setRoom(room);
  const apply = async sel => {
    for (const s of SLOTS) await comp.set(s, slots[s] && slots[s].length ? slots[s][sel[s] || 0] : null);
    await comp.pending;
    comp.renderNow();
  };
  const out = {};
  if (args.mode === 'combos') {
    for (const [name, sel] of Object.entries(args.combos)) {
      await apply(sel);
      out[`${name}.jpg`] = canvas.toDataURL('image/jpeg', 0.92);
    }
    return out;
  }
  if (args.mode === 'sheet') {
    const items = [];
    for (const s of SLOTS) (slots[s] || []).forEach((o, i) => items.push({ label: `${s}: ${o.id}`, sel: { [s]: i } }));
    for (const [name, sel] of Object.entries(args.combos || {})) items.push({ label: name, sel });
    const frames = [[0, 0, room.width, room.height, args.scale || 0.3], ...(args.crops || [])];
    for (let f = 0; f < frames.length; f++) {
      const [x0, y0, w, h, s = 1] = frames[f];
      const cw = Math.round(w * s), ch = Math.round(h * s), cols = 4;
      const sheet = canvasOf(cols * cw, Math.ceil(items.length / cols) * (ch + 16));
      const sx = sheet.getContext('2d');
      sx.fillStyle = '#fff'; sx.fillRect(0, 0, sheet.width, sheet.height); sx.font = '12px sans-serif';
      for (let i = 0; i < items.length; i++) {
        await apply(items[i].sel);
        const gx = (i % cols) * cw, gy = Math.floor(i / cols) * (ch + 16);
        sx.drawImage(canvas, x0, y0, w, h, gx, gy + 16, cw, ch);
        sx.fillStyle = '#000'; sx.fillText(items[i].label, gx + 3, gy + 12);
      }
      out[f === 0 ? 'full.jpg' : `crop${f - 1}.jpg`] = sheet.toDataURL('image/jpeg', 0.88);
    }
    return out;
  }
  if (args.mode === 'build') {
    const photo = await loadImage(room.photo);
    const enc = (src, w, h, sx, sy, sw, sh, q) => {
      const c = canvasOf(w, h), x = c.getContext('2d');
      x.imageSmoothingQuality = 'high';
      x.drawImage(src, sx, sy, sw, sh, 0, 0, w, h);
      return c.toDataURL('image/webp', q);
    };
    const W = room.width, H = room.height;
    out['photo.webp'] = enc(photo, W, H, 0, 0, W, H, 0.95);
    out['card.webp'] = enc(photo, 1002, Math.round(1002 * H / W), 0, 0, W, H, 0.86);
    const light = await loadImage(args.lightPNG);
    out['light.webp'] = enc(light, W, H, 0, 0, W, H, 0.92);
    for (const [name, [x, y, w, h]] of Object.entries(args.quiz || {})) out[`quiz-${name}.webp`] = enc(photo, 720, 480, x, y, w, h, 0.85);
    const S = 240;
    for (const s of SLOTS) {
      const reg = args.swatch[s];
      if (!reg) continue;
      for (let i = 0; i < (slots[s] || []).length; i++) {
        const o = slots[s][i];
        if (o.scan) continue; // stone scans use their own sample
        await apply({ [s]: i });
        const c = canvasOf(S, S), x = c.getContext('2d');
        x.imageSmoothingQuality = 'high';
        if (Array.isArray(reg[0])) { // two zones side by side
          const [[x1, y1, s1], [x2, y2, s2]] = reg;
          x.drawImage(canvas, x1 + s1 / 4, y1, s1 / 2, s1, 0, 0, S / 2, S);
          x.drawImage(canvas, x2 + s2 / 4, y2, s2 / 2, s2, S / 2, 0, S / 2, S);
          x.fillStyle = 'rgba(244,241,236,0.9)'; x.fillRect(S / 2 - 1, 0, 2, S);
        } else {
          const [x0, y0, s0] = reg;
          x.drawImage(canvas, x0, y0, s0, s0, 0, 0, S, S);
        }
        out[`swatches/${s}-${o.id}.webp`] = c.toDataURL('image/webp', 0.9);
      }
    }
    return out;
  }
  throw new Error('unknown mode ' + args.mode);
}
