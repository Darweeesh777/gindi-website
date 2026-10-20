/*
 * GINDI Design Studio — the material compositor (ES module, WebGL2).
 *
 * Each style is one fixed concept image (AI-generated, supplied by the studio).
 * Its editable surfaces have prepared maps (static/studio/rooms/<style>/; made
 * with tools/studio/, see its README):
 *   mask.png   R = upholstery slot, G = stone slot, B = third slot (wood, gilded
 *              finish or accent-chair fabric); soft edges, one slot per pixel
 *   light.webp R/G/B = sqrt of each surface's local luminance, blurred within
 *              that surface (and within each stone part)
 *   zone.png   R = on upholstery: second zone (255, e.g. the chairs);
 *                  on stone: the part (0 top, 128 first curved side, 255 base)
 *              G = the stone's rim band, B = sqrt of the stone's fine luminance
 * The canvas has the image's own size; CSS scales it.
 *
 * Per material (the room's `render` settings come from apps/core/studio.py):
 *   stone  a real scan (CC0) replaces the stone. A flat top is mapped through a
 *          homography (image -> table plane in metres); a curved side or base
 *          is mapped around its curve (angle -> arc length, height below its
 *          top edge -> metres), continuing from the top. Lit by the image's own
 *          light on each part; broad reflections above it are kept.
 *   fabric the photographed fabric keeps its weave, folds, seams and pattern; a
 *          zone can be two-tone (ground and motif): each pixel's position between
 *          the two original colours picks its position between the two new ones,
 *          so a damask keeps its tonal pattern. Highlights are kept as they are.
 *   wood   the photographed grain, joints and carving keep their shading; the
 *          tone changes; highlights stay white.
 *   A room's `light` (an RGB multiplier) is the colour of its light on fabric and wood, so
 *   option colours can be the materials' own colours; without it they are given as they
 *   appear in that room.
 *   metal  gilded finishes: a per-channel change of the metal's colour, so the
 *          highlights take the new metal's colour too.
 * An option marked `original` returns the image's own pixels (the default view).
 */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uPhoto, uMask, uLight, uZone, uStone;
uniform vec2 uSize;
uniform int uU, uS, uW;
// Upholstery: two zones, each with ground (A) and motif (B) colours (equal when plain).
uniform vec3 uURefA[2], uURefB[2], uUNewA[2], uUNewB[2];
uniform float uUSpec;
uniform vec3 uRoomLight;  // the room's light colour on fabric and wood (1, 1, 1: options given as they appear)
// Third slot: mode 0 = fabric/wood tone, 1 = metal.
uniform int uWMode;
uniform vec3 uWRefA, uWRefB, uWNewA, uWNewB;
uniform float uWSpec;
// Stone: up to three parts; type 0 = plane (homography), 1 = curved (cx, cy, a, b | R, px per metre).
uniform int uSType[3];
uniform mat3 uSH[3];
uniform vec4 uSCyl[3];
uniform vec2 uSCylB[3];
uniform vec2 uSScale, uSOffset;
uniform float uSRef, uSSpec, uSSpecGain;
uniform vec3 uSTint;
out vec4 frag;
vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
vec3 toSrgb(vec3 c) { c = clamp(c, 0.0, 1.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

// A new colour on the photographed surface. Two-tone: the pixel's place between the
// original ground and motif colours (by chromaticity) sets its place between the new
// ones. Shading is the pixel's brightness relative to that original colour; a part of
// the local hue variation is kept; highlights (spec) are added back unchanged.
vec3 recolor(vec3 c, float Y, float spec, vec3 refA, vec3 refB, vec3 newA, vec3 newB) {
  vec3 cn = c / max(Y, 1e-4);
  vec3 an = refA / max(lum(refA), 1e-4), bn = refB / max(lum(refB), 1e-4);
  vec3 d = bn - an;
  float dd = dot(d, d);
  float t = dd > 1e-4 ? clamp(dot(cn - an, d) / dd, 0.0, 1.0) : 0.0;
  vec3 ref = mix(refA, refB, t), nw = mix(newA, newB, t);
  float shade = max(Y - spec, 0.0) / max(lum(ref), 1e-4);
  vec3 hue = cn / (ref / max(lum(ref), 1e-4));
  hue = clamp(mix(vec3(1.0), hue, dd > 1e-4 ? 0.25 : 0.5), 0.6, 1.6);
  return nw * shade * hue + vec3(spec);
}

vec2 stoneUV(int part, vec2 px) {
  int type = part == 0 ? uSType[0] : (part == 1 ? uSType[1] : uSType[2]);
  if (type == 0) {
    mat3 H = part == 0 ? uSH[0] : (part == 1 ? uSH[1] : uSH[2]);
    vec3 q = H * vec3(px, 1.0);
    return q.xy / q.z;
  }
  vec4 k = part == 0 ? uSCyl[0] : (part == 1 ? uSCyl[1] : uSCyl[2]);
  vec2 kb = part == 0 ? uSCylB[0] : (part == 1 ? uSCylB[1] : uSCylB[2]);
  float dx = clamp((px.x - k.x) / k.z, -0.999, 0.999);
  float edge = k.y + k.w * sqrt(1.0 - dx * dx);    // the front arc of the part's top edge
  // Around the curve from the top's front edge (so the veins continue over it);
  // a base sits lower and starts its own stretch of the scan.
  return vec2(kb.x * asin(dx), kb.x + (px.y - edge) / kb.y + float(part - 1) * 1.7);
}

void main() {
  vec2 px = vec2(gl_FragCoord.x, uSize.y - gl_FragCoord.y);
  vec2 uv = px / uSize;
  vec4 raw = texture(uPhoto, uv);
  vec3 m = texture(uMask, uv).rgb;
  vec3 zone = texture(uZone, uv).rgb;
  // The stone sample is taken before any branch: its level of detail comes from neighbouring
  // pixels, so it must not depend on which pixels change (other slots stay pixel-identical).
  int part = zone.r < 0.25 ? 0 : (zone.r < 0.75 ? 1 : 2);
  vec3 A = toLin(texture(uStone, stoneUV(part, px) / uSScale + uSOffset).rgb);
  bool u = uU == 1 && m.r > 0.0, s = uS == 1 && m.g > 0.0, w = uW == 1 && m.b > 0.0;
  if (!u && !s && !w) { frag = raw; return; }
  vec3 c = toLin(raw.rgb);
  float Y = lum(c);
  vec3 L = texture(uLight, uv).rgb;
  L *= L;
  vec3 res = raw.rgb;
  if (u) {
    int zi = zone.r > 0.5 ? 1 : 0;
    float spec = max(0.0, Y - uUSpec * L.r);
    vec3 o = zi == 0 ? recolor(c, Y, spec, uURefA[0], uURefB[0], uUNewA[0] * uRoomLight, uUNewB[0] * uRoomLight)
                     : recolor(c, Y, spec, uURefA[1], uURefB[1], uUNewA[1] * uRoomLight, uUNewB[1] * uRoomLight);
    res = mix(res, toSrgb(o), m.r);
  }
  if (s) {
    float Yf = zone.b * zone.b;                   // finely blurred luminance of the surface
    float Ls = mix(L.g, Yf, zone.g);              // the rim band keeps its moulding
    float spec = max(0.0, Yf - uSSpec * Ls) * uSSpecGain;
    res = mix(res, toSrgb(A * uSTint * (Ls / uSRef) + vec3(spec)), m.g);
  }
  if (w) {
    vec3 o;
    if (uWMode == 1) {
      o = c * (uWNewA / max(uWRefA, vec3(1e-4)));
    } else {
      float spec = max(0.0, Y - uWSpec * L.b);
      o = recolor(c, Y, spec, uWRefA, uWRefB, uWNewA * uRoomLight, uWNewB * uRoomLight);
    }
    res = mix(res, toSrgb(o), m.b);
  }
  frag = vec4(res, 1.0);
}`;

const lin = h => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
};
// A zone colour: '#hex' (plain) or ['#ground', '#motif'] -> [ground, motif] in linear light.
const pair = c => (Array.isArray(c) ? [lin(c[0]), lin(c[1])] : [lin(c), lin(c)]);

// 3x3 homography (row-major) taking four source points to four destination points.
export function homography(src, dst) {
  const A = [], b = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 8; k++) A[r][k] -= f * A[c][k];
      b[r] -= f * b[c];
    }
  }
  const h = b.map((v, i) => v / A[i][i]);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

const loadImage = src => new Promise((resolve, reject) => {
  const img = new Image();
  img.decoding = 'async';
  img.onload = () => resolve(img);
  img.onerror = () => reject(new Error(`image ${src}`));
  img.src = src;
});

export function createCompositor(canvas) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, premultipliedAlpha: false });
  if (!gl) return null;
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
  const U = name => gl.getUniformLocation(prog, name);
  const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  ['uPhoto', 'uMask', 'uLight', 'uZone', 'uStone'].forEach((n, i) => gl.uniform1i(U(n), i));

  function texture(img, unit, { repeat = false, mip = false } = {}) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, img);
    const wrap = repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE; // the scans tile seamlessly
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
    if (mip) {
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    } else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    }
    return t;
  }

  let room = null;
  let roomTextures = [];
  let roomToken = 0;
  const stoneCache = new Map();
  const current = {};
  let state = { u: null, s: null, w: null, stoneTex: null };

  function draw() {
    if (!room) return;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U('uSize'), canvas.width, canvas.height);
    const R = room.render;
    gl.uniform3fv(U('uRoomLight'), R.light || [1, 1, 1]);
    const u = state.u;
    gl.uniform1i(U('uU'), u ? 1 : 0);
    if (u) {
      const zones = R.upholstery.zones;
      const refs = [0, 1].map(i => zones[Math.min(i, zones.length - 1)]);
      const news = [0, 1].map(i => pair(u.colors[Math.min(i, u.colors.length - 1)]));
      gl.uniform3fv(U('uURefA'), [...refs[0].ref, ...refs[1].ref]);
      gl.uniform3fv(U('uURefB'), [...(refs[0].refB || refs[0].ref), ...(refs[1].refB || refs[1].ref)]);
      gl.uniform3fv(U('uUNewA'), [...news[0][0], ...news[1][0]]);
      gl.uniform3fv(U('uUNewB'), [...news[0][1], ...news[1][1]]);
      gl.uniform1f(U('uUSpec'), R.upholstery.spec);
    }
    const s = state.s;
    gl.uniform1i(U('uS'), s && state.stoneTex ? 1 : 0);
    if (s && state.stoneTex) {
      gl.activeTexture(gl.TEXTURE4);
      gl.bindTexture(gl.TEXTURE_2D, state.stoneTex);
      const st = R.stone;
      const parts = [0, 1, 2].map(i => st.parts[Math.min(i, st.parts.length - 1)]);
      gl.uniform1iv(U('uSType'), parts.map(p => (p.type === 'plane' ? 0 : 1)));
      const H = parts.flatMap(p => (p.type === 'plane' ? homography(p.img, p.world) : [1, 0, 0, 0, 1, 0, 0, 0, 1]));
      gl.uniformMatrix3fv(U('uSH'), true, H);
      gl.uniform4fv(U('uSCyl'), parts.flatMap(p => (p.type === 'plane' ? [0, 0, 1, 1] : [p.cx, p.cy, p.a, p.b])));
      gl.uniform2fv(U('uSCylB'), parts.flatMap(p => (p.type === 'plane' ? [1, 1] : [p.R, p.pxPerM])));
      gl.uniform2f(U('uSScale'), s.scale, s.scale);
      gl.uniform2f(U('uSOffset'), ...(s.offset || [0.37, 0.21]));
      gl.uniform1f(U('uSRef'), st.ref);
      gl.uniform3fv(U('uSTint'), st.tint);
      gl.uniform1f(U('uSSpec'), st.spec);
      gl.uniform1f(U('uSSpecGain'), st.specGain);
    }
    const w = state.w;
    gl.uniform1i(U('uW'), w ? 1 : 0);
    if (w) {
      const T = R.wood;
      const mode = (w.finish || T.kind) === 'metal' ? 1 : 0;
      const [na, nb] = pair(w.colors[0]);
      gl.uniform1i(U('uWMode'), mode);
      gl.uniform3fv(U('uWRefA'), T.ref);
      gl.uniform3fv(U('uWRefB'), T.refB || T.ref);
      gl.uniform3fv(U('uWNewA'), na);
      gl.uniform3fv(U('uWNewB'), nb);
      gl.uniform1f(U('uWSpec'), T.spec);
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  let frame = 0;
  const render = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); }); };
  const renderNow = () => { if (frame) { cancelAnimationFrame(frame); frame = 0; } draw(); };

  function stoneTexture(url) {
    if (!stoneCache.has(url)) {
      const p = loadImage(url).then(img => texture(img, 4, { repeat: true, mip: true }));
      p.catch(() => stoneCache.delete(url));
      stoneCache.set(url, p);
    }
    return stoneCache.get(url);
  }

  // A new room: its image and maps; every slot shows the image until set().
  async function setRoom(data) {
    const token = ++roomToken;
    const imgs = await Promise.all([data.photo, data.maps.mask, data.maps.light, data.maps.zone].map(loadImage));
    if (token !== roomToken) return false;
    roomTextures.forEach(t => gl.deleteTexture(t));
    roomTextures = imgs.map((img, i) => texture(img, i));
    canvas.width = data.width;
    canvas.height = data.height;
    room = data;
    state = { u: null, s: null, w: null, stoneTex: null };
    for (const k of Object.keys(current)) delete current[k];
    renderNow();
    return true;
  }

  // Select an option for a slot (an option with `original` shows the image's own material).
  let pending = Promise.resolve();
  function set(slot, option) {
    const token = roomToken;
    const id = option ? option.id : null;
    current[slot] = id;
    const original = !option || option.original;
    let p;
    if (slot === 'stone') {
      if (original) { state.s = null; state.stoneTex = null; p = Promise.resolve(); }
      else {
        p = stoneTexture(option.map).then(tex => {
          if (token !== roomToken || current.stone !== id) return;
          state.s = option; state.stoneTex = tex;
        });
      }
    } else {
      state[slot === 'upholstery' ? 'u' : 'w'] = original ? null : option;
      p = Promise.resolve();
    }
    p = p.then(() => { if (token === roomToken) render(); });
    pending = Promise.all([pending, p.catch(() => {})]).then(() => {});
    return p;
  }

  return {
    setRoom,
    set,
    prefetch: url => { stoneTexture(url).catch(() => {}); },
    current,
    get pending() { return pending; },
    get room() { return room; },
    render,
    renderNow,
    snapshot(type = 'image/png', q) { renderNow(); return canvas.toDataURL(type, q); },
    canvas,
  };
}
