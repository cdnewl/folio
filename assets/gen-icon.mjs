// Folio icon generator — renders assets/icon-source.png (1024x1024, RGBA).
// Original design: stacked sheets with a neon light strip near the top edge of the
// top sheet (mirrors Folio's in-app top light bar). Windows-style: transparent
// background, free-form silhouette, thin dark outline so light sheets survive light
// themes. Procedural SDF rendering, zero dependencies.
// Usage: node assets/gen-icon.mjs   → then `npx tauri icon assets/icon-source.png`
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

const SIZE = 1024, SS = 2, R = SIZE * SS;
const s = (v) => v * SS;
const AA = 1.2 * SS;

// ---------- helpers ----------
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lerp = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t); };

function sdRoundRect(px, py, cx, cy, hx, hy, rad) {
  const qx = Math.abs(px - cx) - (hx - rad);
  const qy = Math.abs(py - cy) - (hy - rad);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad;
}
const cov = (sd) => 1 - smooth(-AA, AA, sd);
// standard "over" compositing onto [r,g,b,a] state
function over(st, src, srcA) {
  if (srcA <= 0) return;
  const outA = srcA + st[3] * (1 - srcA);
  if (outA <= 0) return;
  const k = (st[3] * (1 - srcA)) / outA;
  st[0] = src[0] * (srcA / outA) + st[0] * k;
  st[1] = src[1] * (srcA / outA) + st[1] * k;
  st[2] = src[2] * (srcA / outA) + st[2] * k;
  st[3] = outA;
}

// ---------- palette ----------
const STRIP_A = hex('#7dcfff'), STRIP_B = hex('#7aa2f7'), STRIP_C = hex('#bb9af7');
const stripH = (t) => (t < 0.5 ? mix3(STRIP_A, STRIP_B, t * 2) : mix3(STRIP_B, STRIP_C, (t - 0.5) * 2));

// ---------- the icon ----------
function paint(px, py) {
  const st = [0, 0, 0, 0];
  const cards = [
    { c: [s(419), s(690)], top: '#454e70', bot: '#333a55' },
    { c: [s(512), s(510)], top: '#7d86a6', bot: '#5d6580' },
    { c: [s(605), s(334)], top: '#eef1fa', bot: '#c6cddd' },
  ];
  const HW = s(344), HH = s(240), RAD = s(77);
  const OUTLINE = hex('#22263a'), OW = s(3.5);
  for (const cd of cards) {
    const d = sdRoundRect(px, py, cd.c[0], cd.c[1], HW, HH, RAD);
    over(st, mix3(hex(cd.top), hex(cd.bot), clamp((py - (cd.c[1] - HH)) / (2 * HH), 0, 1)), cov(d));
    over(st, OUTLINE, cov(d - OW) * (1 - cov(d))); // outward stroke
  }
  // neon strip near the top edge of the top sheet
  const top = cards[2];
  const stripY = top.c[1] - s(154);
  const dStrip = sdRoundRect(px, py, top.c[0], stripY, HW - s(54), s(21), s(21));
  const sc = stripH(clamp((px - (top.c[0] - HW + s(54))) / (2 * (HW - s(54))), 0, 1));
  // glow kept tight so the halo never reaches the canvas edge (clipping reads as a bug)
  const g = Math.exp(-(Math.max(0, dStrip) ** 2) / (2 * s(58) ** 2)) * 0.55;
  over(st, sc, g);
  over(st, sc, cov(dStrip));
  const dCore = sdRoundRect(px, py, top.c[0], stripY, HW - s(54), s(7), s(7));
  over(st, mix3(sc, [255, 255, 255], 0.6), cov(dCore) * 0.9);
  return st;
}

// ---------- render (supersampled, then box-downscaled) ----------
const buf = new Float64Array(R * R * 4);
for (let y = 0; y < R; y++) {
  for (let x = 0; x < R; x++) {
    const st = paint(x + 0.5, y + 0.5);
    const i = (y * R + x) * 4;
    buf[i] = st[0]; buf[i + 1] = st[1]; buf[i + 2] = st[2]; buf[i + 3] = st[3];
  }
}
const out = Buffer.alloc(SIZE * SIZE * 4);
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let dy = 0; dy < SS; dy++) for (let dx = 0; dx < SS; dx++) {
      const i = ((y * SS + dy) * R + x * SS + dx) * 4;
      r += buf[i] * buf[i + 3]; g += buf[i + 1] * buf[i + 3]; b += buf[i + 2] * buf[i + 3]; a += buf[i + 3];
    }
    const n = SS * SS, o = (y * SIZE + x) * 4, ca = a / n;
    out[o] = ca > 0 ? r / a : 0; out[o + 1] = ca > 0 ? g / a : 0;
    out[o + 2] = ca > 0 ? b / a : 0; out[o + 3] = ca * 255;
  }
}

// ---------- PNG encode ----------
function crc32(buf) {
  let t = crc32.t;
  if (!t) {
    t = crc32.t = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0;
  out.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);
writeFileSync(new URL('./icon-source.png', import.meta.url), png);
console.log('wrote assets/icon-source.png', png.length, 'bytes');
