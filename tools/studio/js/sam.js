// Object masks with the Segment Anything model (SAM ViT-B via transformers.js, run locally in
// the browser; the model and library download once from jsDelivr / Hugging Face, then stay cached).
// args: { src, prompts: [{ name, points: [[x, y], [x, y, 0 (= exclude)], ...], pick }] }
//   pick: 'best' (highest predicted quality, default) | 'largest' | 0..2 | 'all' (writes name_0..2)
// Returns '<name>.png' soft masks (sigmoid of the logits), 'debug.png' and per-prompt scores/areas.
const LIB = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';
const MODEL = 'Xenova/sam-vit-base';

export default async function ({ src, prompts }) {
  const T = await import(LIB);
  const sam = await T.SamModel.from_pretrained(MODEL, { dtype: 'fp32' });
  const proc = await T.AutoProcessor.from_pretrained(MODEL);
  const image = await T.RawImage.read(src);
  const emb = await sam.get_image_embeddings(await proc(image));
  const img = new Image(); img.src = src; await img.decode();
  const W = img.naturalWidth, H = img.naturalHeight, N = W * H;
  const out = {}, info = {};
  const dbg = document.createElement('canvas'); dbg.width = W; dbg.height = H;
  const dx = dbg.getContext('2d'); dx.drawImage(img, 0, 0);
  const dd = dx.getImageData(0, 0, W, H);
  const hues = [[255, 0, 160], [0, 220, 255], [255, 200, 0], [0, 255, 90], [140, 90, 255], [255, 90, 0]];
  const toPNG = (data, off) => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), d = x.createImageData(W, H);
    for (let i = 0; i < N; i++) { const v = Math.round(255 / (1 + Math.exp(-data[off + i] * 2))); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255; }
    x.putImageData(d, 0, 0);
    return c.toDataURL('image/png');
  };
  let k = 0;
  for (const p of prompts) {
    const pts = p.points.map(q => [q[0], q[1]]), lab = p.points.map(q => (q.length > 2 ? q[2] : 1));
    const inputs = await proc(image, { input_points: [pts], input_labels: [lab] });
    const o = await sam({ ...emb, input_points: inputs.input_points, input_labels: inputs.input_labels });
    const m = (await proc.post_process_masks(o.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes, { binarize: false }))[0];
    const scores = Array.from(o.iou_scores.data).map(s => +s.toFixed(3));
    const areas = [0, 1, 2].map(i => { let n = 0; for (let j = i * N; j < (i + 1) * N; j++) if (m.data[j] > 0) n++; return n; });
    const pick = p.pick === undefined ? 'best' : p.pick;
    if (pick === 'all') {
      for (let j = 0; j < 3; j++) out[`${p.name}_${j}.png`] = toPNG(m.data, j * N);
      info[p.name] = { scores, areas };
      continue;
    }
    const idx = pick === 'best' ? scores.indexOf(Math.max(...scores)) : pick === 'largest' ? areas.indexOf(Math.max(...areas)) : pick;
    info[p.name] = { scores, areas, idx };
    out[`${p.name}.png`] = toPNG(m.data, idx * N);
    const col = hues[k++ % hues.length];
    for (let i = 0; i < N; i++) if (m.data[idx * N + i] > 0) for (let ch = 0; ch < 3; ch++) dd.data[i * 4 + ch] = dd.data[i * 4 + ch] * 0.45 + col[ch] * 0.55;
  }
  dx.putImageData(dd, 0, 0);
  dx.font = 'bold 13px sans-serif';
  for (const p of prompts) for (const q of p.points) {
    dx.fillStyle = q.length > 2 && q[2] === 0 ? '#f00' : '#0f0'; dx.fillRect(q[0] - 4, q[1] - 4, 8, 8);
    dx.fillStyle = '#fff'; dx.fillText(p.name, q[0] + 6, q[1] - 4);
  }
  out['debug.jpg'] = dbg.toDataURL('image/jpeg', 0.85);
  out.info = info;
  return out;
}
