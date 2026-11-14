// Todos los personajes y objetos, dibujados con código en pixel art.
import { Pix, PAL as C, shade, soft } from './pix.js';

const rad = (d) => (d * Math.PI) / 180;
const cache = new Map();
function cached(key, fn) {
  if (!cache.has(key)) cache.set(key, fn());
  return cache.get(key);
}

function arm(p, sx, sy, ang, side, len, col, hand, handCol, thick = 2) {
  const ex = sx + side * Math.sin(rad(ang)) * len;
  const ey = sy + Math.cos(rad(ang)) * len;
  p.line(sx, sy, ex, ey, col);
  if (thick > 1) p.line(sx + (side > 0 ? 0 : 0), sy + 1, ex, ey + 1, col);
  p.ell(ex - hand / 2 + 0.5, ey - hand / 2 + 0.5, hand, hand, handCol);
}

/* ---------------- ELFO 1: el de la bufanda ---------------- */
function elfScarf(st) {
  const p = new Pix(38, 52);
  const ox = 1;
  const legOff = st.legs || 0;
  // zapatos verdes con pompón amarillo
  p.ell(ox + 4, 45 - legOff, 11, 5, shade(C.g, C.G, C.l));
  p.ell(ox + 20, 45 + legOff, 11, 5, shade(C.g, C.G, C.l));
  p.ell(ox + 3, 44 - legOff, 3, 3, C.y);
  p.ell(ox + 29, 44 + legOff, 3, 3, C.y);
  // piernas largas a cuadros
  const leg = (lx, y0, y1) => p.rect(lx, y0, 3, y1 - y0, (x, y, i, j) => ((j >> 1) + (i >> 0)) % 2 ? C.w : C.r);
  leg(ox + 12, 33, 46 - legOff);
  leg(ox + 20, 33, 46 + legOff);
  // cuerpo rojo redondo
  p.ell(ox + 9, 19, 18, 18, shade(C.r, C.R, C.q));
  // brazos
  arm(p, ox + 11, 23, st.aL ?? 25, -1, 8, C.r, 4, C.s);
  arm(p, ox + 25, 23, st.aR ?? 25, 1, 8, C.r, 4, C.s);
  // bufanda a cuadros
  const plaid = (x, y) => (x % 5 === 0 ? C.G : ((x >> 1) + (y >> 1)) % 2 ? C.w : C.r);
  p.rect(ox + 11, 19, 15, 3, plaid);
  for (let i = 0; i < 11; i++) p.rect(ox + 20 + (i >> 2), 21 + i, 4, 1, (x) => (i % 4 === 3 ? C.G : i % 2 ? C.w : C.r));
  // orejas puntiagudas
  p.tri(ox + 11, 10, ox + 3, 7, ox + 11, 15, C.n);
  p.tri(ox + 25, 10, ox + 33, 7, ox + 25, 15, C.n);
  p.set(ox + 6, 9, C.S); p.set(ox + 30, 9, C.S);
  // cabeza
  p.ell(ox + 10, 6, 16, 15, soft(C.s, C.S));
  // pelo en puntas
  p.rect(ox + 12, 8, 12, 2, C.h);
  for (let x = 12; x < 24; x++) if (x % 4 !== 3) p.set(ox + x, 10, C.h);
  for (let x = 12; x < 24; x++) if (x % 4 === 1) p.set(ox + x, 11, C.h);
  // gorro verde con borde blanco y pompón caído a la derecha
  p.ell(ox + 11, 0, 15, 10, shade(C.g, C.G, C.l));
  p.tri(ox + 20, 1, ox + 29, 6, ox + 24, 8, C.G);
  p.rect(ox + 9, 6, 18, 3, (x, y, i, j) => (j === 2 ? C.W : C.w));
  p.ell(ox + 27, 6, 5, 5, shade(C.w, C.W));
  // cara
  if (st.blink) { p.rect(ox + 14, 14, 2, 1, C.b); p.rect(ox + 20, 14, 2, 1, C.b); }
  else { p.rect(ox + 14, 13, 2, 2, C.b); p.rect(ox + 20, 13, 2, 2, C.b); p.set(ox + 14, 13, C.B); p.set(ox + 20, 13, C.B); }
  p.rect(ox + 17, 15, 2, 2, C.n); p.set(ox + 18, 17, C.S);
  if (st.mouth) p.ell(ox + 16, 17, 4, st.mouth > 1 ? 3 : 2, C.R);
  if (st.cheeks !== false) { p.set(ox + 13, 16, C.P); p.set(ox + 23, 16, C.P); }
  return p;
}

/* ---------------- ELFO 2: el sonriente del gorro a rayas ---------------- */
function elfStripe(st) {
  const p = new Pix(40, 52);
  const ox = 2;
  const legOff = st.legs || 0;
  // zapatos rojos
  p.ell(ox + 3, 45 - legOff, 12, 5, shade(C.r, C.R, C.q));
  p.ell(ox + 19, 45 + legOff, 12, 5, shade(C.r, C.R, C.q));
  // piernas a rayas negro, blanco, rosado
  const stripes = [C.b, C.b, C.w, C.P, C.w];
  p.rect(ox + 12, 34, 3, 12 - legOff, (x, y) => stripes[y % 5]);
  p.rect(ox + 19, 34, 3, 12 + legOff, (x, y) => stripes[y % 5]);
  // brazos abiertos
  arm(p, ox + 10, 26, st.aL ?? 70, -1, 10, C.r, 4, C.s);
  arm(p, ox + 24, 26, st.aR ?? 70, 1, 10, C.r, 4, C.s);
  // chaqueta roja acampanada con botones
  for (let j = 0; j < 12; j++) {
    const w = 12 + Math.round(j * 0.6);
    p.rect(ox + 17 - (w >> 1), 24 + j, w, 1, (x) => (x > ox + 17 + (w >> 1) - 3 ? C.R : C.r));
  }
  p.rect(ox + 16, 27, 2, 2, C.w); p.rect(ox + 16, 31, 2, 2, C.w);
  // orejas redondas
  p.ell(ox + 4, 14, 5, 6, shade(C.n, C.S));
  p.ell(ox + 26, 14, 5, 6, shade(C.n, C.S));
  // cara redonda
  p.ell(ox + 7, 9, 21, 17, soft(C.s, C.S));
  // gorro largo a rayas que se dobla a la derecha
  for (let j = 0; j < 12; j++) {
    const y = 10 - j;
    const w = Math.max(2, 19 - j * 1.6);
    const cx = ox + 17 + j * 0.7;
    p.rect(Math.round(cx - w / 2), y, Math.round(w), 1, ((y >> 1) % 2) ? C.w : C.r);
  }
  for (let i = 0; i < 9; i++) p.rect(ox + 24 + i, -1 + Math.round(i * 0.5) + 2, 2, 2, (i >> 1) % 2 ? C.w : C.r);
  p.ell(ox + 32, 5, 5, 5, shade(C.r, C.R, C.q));
  // cara
  if (st.blink) { p.rect(ox + 13, 16, 2, 1, C.b); p.rect(ox + 20, 16, 2, 1, C.b); }
  else { p.rect(ox + 13, 15, 2, 2, C.b); p.rect(ox + 20, 15, 2, 2, C.b); }
  // nariz en espiral
  p.set(ox + 17, 17, C.b); p.set(ox + 18, 17, C.b); p.set(ox + 19, 18, C.b); p.set(ox + 18, 19, C.b); p.set(ox + 17, 19, C.b);
  // sonrisa
  if (st.mouth) {
    p.ell(ox + 13, 20, 9, st.mouth > 1 ? 5 : 4, C.R);
    p.rect(ox + 15, 20, 5, 1, C.w);
  } else {
    p.set(ox + 12, 20, C.b); p.set(ox + 13, 21, C.b); p.rect(ox + 14, 22, 7, 1, C.b); p.set(ox + 21, 21, C.b); p.set(ox + 22, 20, C.b);
  }
  return p;
}

/* ---------------- ELFO 3: el verde de la hebilla ---------------- */
function elfGreen(st) {
  const p = new Pix(38, 52);
  const ox = 1;
  const legOff = st.legs || 0;
  // zapatos negros
  p.ell(ox + 8, 44 - legOff, 9, 6, shade(C.b, C.b, C.B));
  p.ell(ox + 19, 44 + legOff, 9, 6, shade(C.b, C.b, C.B));
  // piernas rojo y blanco
  p.rect(ox + 12, 36, 3, 9 - legOff, (x, y) => ((y >> 1) % 2 ? C.w : C.r));
  p.rect(ox + 21, 36, 3, 9 + legOff, (x, y) => ((y >> 1) % 2 ? C.w : C.r));
  // brazos verdes con mitones rojos
  arm(p, ox + 9, 26, st.aL ?? 45, -1, 8, C.g, 5, C.r);
  arm(p, ox + 27, 26, st.aR ?? 45, 1, 8, C.g, 5, C.r);
  // cuerpo verde acampanado
  for (let j = 0; j < 15; j++) {
    const w = 14 + Math.round(j * 0.55);
    p.rect(ox + 18 - (w >> 1), 22 + j, w, 1, (x) => (x > ox + 18 + (w >> 1) - 4 ? C.G : C.g));
  }
  p.rect(ox + 10, 33, 17, 4, (x, y, i, j) => (j === 0 ? C.G : C.g));
  // cinturón y hebilla
  p.rect(ox + 10, 31, 17, 2, C.b);
  p.rect(ox + 16, 30, 5, 4, C.y); p.rect(ox + 17, 31, 3, 2, C.b);
  // cuello rojo en zigzag
  p.rect(ox + 11, 21, 15, 2, C.r);
  for (let x = 11; x < 26; x++) if (x % 3 === 0) p.set(ox + x, 23, C.r);
  // orejas
  p.tri(ox + 10, 11, ox + 4, 9, ox + 10, 16, C.n);
  p.tri(ox + 27, 11, ox + 33, 9, ox + 27, 16, C.n);
  // cabeza
  p.ell(ox + 9, 7, 19, 15, soft(C.s, C.S));
  // pelo de lado
  p.rect(ox + 12, 9, 8, 2, C.h); p.rect(ox + 12, 11, 4, 1, C.h); p.set(ox + 12, 12, C.h);
  // gorro verde con banda roja en zigzag y pompón rojo
  p.ell(ox + 10, 0, 17, 10, shade(C.g, C.G, C.l));
  p.tri(ox + 22, 1, ox + 31, 3, ox + 25, 7, C.G);
  p.ell(ox + 29, 0, 6, 6, shade(C.r, C.R, C.q));
  p.rect(ox + 9, 6, 19, 3, C.r);
  for (let x = 9; x < 28; x++) if (x % 3 === 1) p.set(ox + x, 5, C.r);
  // cara
  if (st.blink) { p.rect(ox + 13, 14, 3, 1, C.b); p.rect(ox + 21, 14, 3, 1, C.b); }
  else {
    p.rect(ox + 13, 13, 3, 3, C.b); p.rect(ox + 21, 13, 3, 3, C.b);
    p.set(ox + 13, 13, C.w); p.set(ox + 21, 13, C.w);
  }
  p.rect(ox + 11, 16, 2, 1, C.p); p.rect(ox + 25, 16, 2, 1, C.p);
  p.ell(ox + 17, 15, 3, 3, C.n); p.set(ox + 19, 17, C.S);
  if (st.mouth) p.ell(ox + 16, 18, 5, st.mouth > 1 ? 3 : 2, C.R);
  else { p.rect(ox + 16, 19, 5, 1, C.b); p.set(ox + 15, 18, C.b); p.set(ox + 21, 18, C.b); }
  return p;
}

const ELF_DRAW = { scarf: elfScarf, stripe: elfStripe, green: elfGreen };
export const ELF_IDS = ['scarf', 'stripe', 'green'];

export function elf(id, st = {}) {
  const key = `${id}|${st.blink ? 1 : 0}|${st.mouth || 0}|${st.aL ?? 'd'}|${st.aR ?? 'd'}|${st.legs || 0}`;
  return cached(key, () => ELF_DRAW[id](st).pad(2, 0, 1, 0).toCanvas());
}

/* ---------------- SANTA ---------------- */
// st: { blink, mouth(0-2), laugh, wave(0,1,2), arms:'belly'|'letter'|'up', bounce, twinkle }
function drawSanta(st) {
  const W = 92, H = 100;
  const p = new Pix(W, H);
  const by = st.bounce ? 1 : 0; // la barriga rebota
  const red = shade('#e2343a', '#a8202c', '#ff6b5e');
  const fur = (x, y, nx, ny) => {
    const k = (x * 7 + y * 13) % 11;
    if (ny > 0.45 || nx > 0.7) return k < 4 ? '#c9c2d6' : '#e4dfe9';
    return k === 0 ? '#e4dfe9' : '#fffdf8';
  };
  // ---- cuerpo ----
  p.ell(8, 54 + by, 76, 48, red);
  // pliegues del abrigo
  for (let j = 0; j < 14; j++) { p.set(26 - (j >> 2), 74 + by + j, '#a8202c'); p.set(66 + (j >> 2), 74 + by + j, '#a8202c'); }
  // franja de piel al centro
  p.rect(42, 60 + by, 9, 40, (x, y) => ((x + y * 3) % 7 === 0 ? '#e4dfe9' : x > 48 ? '#e4dfe9' : '#fffdf8'));
  // cinturón y hebilla
  p.rect(12, 84 + by, 69, 6, (x, y, i, j) => (j === 0 ? '#3a3346' : '#1d1622'));
  p.rect(38, 82 + by, 17, 10, (x, y, i, j) => (i < 2 || i > 14 || j < 2 || j > 7 ? (i + j < 6 ? '#fff3a0' : '#f2b81c') : '#1d1622'));
  p.rect(44, 85 + by, 5, 3, '#f2b81c');
  // ---- brazos ----
  const sleeve = (x0, y0, x1, y1) => { for (let k = -3; k <= 3; k++) p.line(x0 + k, y0, x1 + k, y1, k > 1 ? '#a8202c' : k < -1 ? '#ff6b5e' : '#e2343a'); };
  const glove = (cx, cy) => { p.ell(cx - 5, cy - 4, 10, 9, shade('#2e2a36', '#1d1622', '#4c4558')); p.set(cx - 2, cy - 2, '#6a6278'); };
  const cuff = (cx, cy) => p.ell(cx - 6, cy - 3, 12, 6, fur);
  if (st.arms === 'up') {
    sleeve(16, 66 + by, 8, 44); cuff(8, 44); glove(8, 37);
    sleeve(76, 66 + by, 84, 44); cuff(84, 44); glove(84, 37);
  } else if (st.arms === 'letter') {
    sleeve(18, 66 + by, 26, 82 + by); sleeve(74, 66 + by, 66, 82 + by);
  } else {
    // izquierda sobre la barriga
    sleeve(16, 64 + by, 22, 82 + by); cuff(24, 84 + by); glove(28, 88 + by);
    if (st.wave) {
      const hx = st.wave === 1 ? 84 : 88, hy = st.wave === 1 ? 40 : 44;
      sleeve(74, 64 + by, hx - 2, hy + 8); cuff(hx - 2, hy + 6);
      // mano abierta saludando
      p.ell(hx - 6, hy - 6, 11, 10, shade('#2e2a36', '#1d1622', '#4c4558'));
      for (let f = 0; f < 4; f++) p.rect(hx - 5 + f * 3, hy - 9 - (f === 1 || f === 2 ? 1 : 0), 2, 4, '#2e2a36');
      p.rect(hx + 4, hy - 3, 3, 2, '#2e2a36');
    } else { sleeve(76, 64 + by, 70, 82 + by); cuff(68, 84 + by); glove(64, 88 + by); }
  }
  // ---- barba esponjosa con mechones ondulados ----
  const beard = (x, y, nx, ny) => {
    const wave = Math.sin(x * 0.75 + Math.sin(y * 0.45) * 2.2) + Math.sin(y * 0.9 + x * 0.2);
    const edge = nx * 0.8 + ny * 0.6;
    if (edge > 0.78) return wave > 0.9 ? '#d8d2e2' : '#c4bcd2';
    if (wave > 1.35) return '#ddd7e6';
    if (edge < -0.6) return '#ffffff';
    return '#f6f3f9';
  };
  const cloud = [[46, 58, 22], [30, 52, 12], [62, 52, 12], [26, 64, 11], [66, 64, 11], [32, 74, 10], [60, 74, 10], [46, 79, 11], [39, 79, 8], [53, 79, 8]];
  for (const [cx, cy, r] of cloud) p.ell(cx - r, cy - r + by, r * 2, r * 2, (x, y) => {
    const nx = (x - 46) / 26, ny = (y - 60 - by) / 24; return beard(x, y, nx, ny);
  });
  // ---- cara ----
  p.ell(27, 22, 38, 30, soft('#f8d6bc', '#e9b394'));
  // orejas
  p.ell(23, 32, 7, 10, soft('#f8d6bc', '#e9b394')); p.ell(62, 32, 7, 10, soft('#f8d6bc', '#e9b394'));
  // cachetes
  p.ell(29, 37, 10, 7, (x, y, nx, ny) => (nx < -0.2 && ny < -0.2 ? '#ffc4cf' : '#f590a4'));
  p.ell(53, 37, 10, 7, (x, y, nx, ny) => (nx < -0.2 && ny < -0.2 ? '#ffc4cf' : '#f590a4'));
  // cejas pobladas
  const browY = st.laugh ? 26 : 28;
  p.ell(30, browY, 13, 5, fur); p.ell(49, browY, 13, 5, fur);
  // ojos
  const eye = (cx) => {
    if (st.laugh) { p.set(cx - 2, 34, '#1d1622'); p.set(cx - 1, 33, '#1d1622'); p.set(cx, 33, '#1d1622'); p.set(cx + 1, 33, '#1d1622'); p.set(cx + 2, 34, '#1d1622'); return; }
    if (st.blink) { p.rect(cx - 2, 34, 5, 1, '#1d1622'); return; }
    p.rect(cx - 1, 32, 3, 4, '#1d1622'); p.set(cx - 1, 32, '#ffffff');
    if (st.twinkle) { p.set(cx + 1, 33, '#9ad8ff'); }
  };
  eye(37); eye(55);
  // lentes dorados
  const ring = (cx) => { for (let a = 0; a < 32; a++) { const r = (a / 32) * Math.PI * 2; p.set(cx + Math.cos(r) * 5, 34 + Math.sin(r) * 4, a < 10 ? '#fff3a0' : '#e2a51c'); } };
  ring(37); ring(55); p.rect(42, 33, 8, 1, '#e2a51c');
  // nariz
  p.ell(42, 35, 9, 8, (x, y, nx, ny) => (nx < -0.2 && ny < -0.3 ? '#ffb3a8' : nx > 0.4 || ny > 0.5 ? '#d9606a' : '#f07f80'));
  // boca
  const my = 49 + by;
  if (st.laugh || st.mouth === 2) { p.ell(39, my - 1, 15, 9, '#7a1622'); p.ell(42, my + 3, 9, 4, '#f07f8c'); p.rect(41, my - 1, 11, 1, '#ffffff'); }
  else if (st.mouth === 1) { p.ell(41, my, 11, 6, '#7a1622'); p.ell(43, my + 2, 7, 3, '#f07f8c'); }
  else { p.rect(42, my + 1, 9, 2, '#a8323c'); p.set(41, my, '#a8323c'); p.set(51, my, '#a8323c'); }
  // bigote en dos rulos que suben en las puntas
  const moust = (side) => (x, y, nx, ny) => (ny > 0.4 ? '#c9c1d6' : ny < -0.3 && nx * side < 0.3 ? '#ffffff' : '#efebf3');
  p.ell(26, 40 + by, 21, 9, moust(-1)); p.ell(45, 40 + by, 21, 9, moust(1));
  p.ell(19, 38 + by, 9, 7, moust(-1)); p.ell(64, 38 + by, 9, 7, moust(1));
  p.set(18, 39 + by, '#efebf3'); p.set(73, 39 + by, '#efebf3');
  for (let i = 0; i < 16; i++) { p.set(28 + i, 48 + by - (i > 12 ? 1 : 0), '#b9b0c8'); p.set(48 + i, 48 + by - (i < 3 ? 1 : 0), '#b9b0c8'); }
  p.set(46, 41 + by, '#c9c1d6'); p.set(46, 42 + by, '#c9c1d6');
  // ---- gorro ----
  const hat = shade('#e2343a', '#a8202c', '#ff6b5e');
  p.ell(24, 2, 46, 26, hat);
  p.tri(30, 8, 56, 4, 10, 26, '#e2343a');
  p.tri(30, 14, 14, 26, 46, 10, '#a8202c');
  p.line(36, 8, 22, 22, '#ff6b5e');
  const pom = st.pom || 0;
  p.ell(3 + pom, 22, 13, 13, fur);
  // borde de piel
  for (let i = 0; i < 10; i++) p.ell(20 + i * 5.2, 19 + (i % 2), 9, 9, fur);
  p.rect(22, 21, 50, 4, fur);
  if (st.arms === 'letter') {
    // carta en las manos
    p.rect(22, 70 + by, 48, 26, (x, y, i, j) => (j === 0 || j === 25 ? '#d9b97a' : (j % 5 === 3 && i > 5 && i < 42) ? '#b9a37a' : '#fff0c8'));
    p.rect(64, 72 + by, 4, 4, '#e2343a');
    cuff(22, 82 + by); glove(20, 88 + by); cuff(70, 82 + by); glove(72, 88 + by);
  }
  return p;
}
export function santa(st = {}) {
  const key = `santa|${st.blink ? 1 : 0}|${st.mouth || 0}|${st.laugh ? 1 : 0}|${st.wave || 0}|${st.arms || 'belly'}|${st.bounce ? 1 : 0}|${st.twinkle ? 1 : 0}|${st.pom || 0}`;
  return cached(key, () => drawSanta(st).pad(1, 1, 1, 1).toCanvas('#2a1424'));
}

/* ---------------- RENO Y TRINEO ---------------- */
export function reindeer(frame = 0, rudolph = false) {
  return cached(`deer|${frame}|${rudolph}`, () => {
    const p = new Pix(24, 18);
    const br = C.o, dk = C.O;
    p.ell(4, 6, 14, 7, shade(br, dk, C.t)); // cuerpo
    p.rect(16, 3, 3, 5, br); // cuello
    p.ell(17, 1, 6, 4, br); // cabeza
    p.set(22, 3, rudolph ? C.r : C.b); if (rudolph) p.set(23, 3, C.r);
    p.set(19, 2, C.b);
    // cuernos
    p.line(18, 1, 16, -2, C.O); p.line(17, 0, 15, 0, C.O);
    p.set(16, 0, C.O); p.set(18, 0, C.O); p.set(17, 0, C.O);
    // patas
    const f = frame % 2;
    p.line(6, 12, f ? 3 : 5, 16, dk); p.line(8, 12, f ? 9 : 7, 16, dk);
    p.line(14, 12, f ? 16 : 14, 16, dk); p.line(16, 12, f ? 13 : 17, 16, dk);
    p.set(3, 6, C.w); p.set(4, 5, C.w);
    return p.toCanvas();
  });
}

export function sleigh() {
  return cached('sleigh', () => {
    const p = new Pix(34, 22);
    p.ell(2, 2, 18, 12, shade(C.r, C.R, C.q)); // saco de regalos
    p.rect(8, 1, 2, 3, C.y);
    p.rect(4, 9, 26, 7, (x, y, i, j) => (j === 0 ? C.y : C.r));
    p.ell(24, 6, 8, 10, shade(C.r, C.R));
    p.rect(4, 12, 26, 1, C.y);
    p.line(2, 19, 32, 19, C.Y); p.line(31, 19, 33, 16, C.Y); p.line(8, 16, 8, 19, C.Y); p.line(24, 16, 24, 19, C.Y);
    // Santa
    p.ell(18, 2, 7, 8, C.r); p.ell(19, 4, 5, 4, C.s); p.ell(18, 6, 6, 4, C.w); p.rect(18, 1, 6, 2, C.w);
    return p.toCanvas();
  });
}

/* ---------------- REGALO DEL CALENDARIO ---------------- */
const GIFT_COLORS = [
  [C.r, C.R, C.y], [C.g, C.G, C.r], [C.u, C.U, C.w], [C.v, C.m, C.y], [C.y, C.Y, C.r], [C.p, '#d16a8e', C.g], [C.w, C.W, C.r],
];
export function gift(idx, part = 'all', locked = false) {
  return cached(`gift|${idx}|${part}|${locked}`, () => {
    const [a, b, rib] = locked ? ['#7d86a8', '#555c7c', '#a8b0cf'] : GIFT_COLORS[idx % GIFT_COLORS.length];
    const p = new Pix(26, 28);
    if (part !== 'lid') {
      p.rect(3, 12, 20, 14, (x, y, i) => (i > 15 ? b : a));
      p.rect(12, 12, 3, 14, rib);
    }
    if (part !== 'box') {
      p.rect(2, 8, 22, 5, (x, y, i, j) => (j === 4 ? b : i > 17 ? b : a));
      p.rect(12, 8, 3, 5, rib);
      p.ell(5, 2, 8, 7, rib); p.ell(14, 2, 8, 7, rib);
      p.set(8, 5, b); p.set(17, 5, b); p.ell(11, 5, 5, 4, rib);
    }
    return p.toCanvas();
  });
}

/* ---------------- TELÉFONO ROJO ---------------- */
// Teléfono antiguo navideño: auricular clásico, disco crema con borde dorado, acebo y cordón de bastón de caramelo
export function phone(lifted = 0) {
  return cached(`phone|${lifted}`, () => {
    const p = new Pix(100, 90);
    const RED = '#e23b3b', RED_D = '#a8222e', RED_L = '#ff7b6b', RED_DD = '#7e1622';
    const GOLD = '#ffd23f', GOLD_D = '#c99a1c', GOLD_L = '#fff3a0';
    const CREAM = '#fff6e0', CREAM_D = '#e6d3a8';
    // ---- base ----
    for (let j = 0; j <= 38; j++) {
      const y = 46 + j;
      let w = Math.round(58 + j * 0.62);
      if (j === 0) w -= 6; else if (j === 1) w -= 3; else if (j === 2) w -= 1;
      const x0 = 50 - (w >> 1);
      p.rect(x0, y, w, 1, (x) => {
        const k = (x - x0) / w;
        if (j >= 33) return RED_DD;
        if (k < 0.07 || j < 2) return RED_L;
        if (k > 0.86) return RED_D;
        return RED;
      });
    }
    p.rect(14, 78, 72, 1, GOLD); p.rect(14, 79, 72, 1, GOLD_D);
    p.ell(14, 83, 12, 5, '#3a1a20'); p.ell(74, 83, 12, 5, '#3a1a20');
    // brillo en la carcasa
    p.rect(26, 50, 2, 10, RED_L); p.rect(29, 49, 6, 1, RED_L);
    // ---- disco ----
    const cx = 50, cy = 63;
    p.ell(cx - 18, cy - 18, 36, 36, (x, y, nx, ny) => (nx + ny < -0.6 ? GOLD_L : nx + ny > 0.7 ? GOLD_D : GOLD));
    p.ell(cx - 16, cy - 16, 32, 32, (x, y, nx, ny) => (nx + ny > 0.9 ? CREAM_D : CREAM));
    for (let i = 0; i < 10; i++) {
      const a = ((-120 + i * 27) * Math.PI) / 180;
      const hx = cx + Math.cos(a) * 11, hy = cy + Math.sin(a) * 11;
      p.ell(hx - 3, hy - 3, 6, 6, '#b8956a');
      p.ell(hx - 2, hy - 2, 4, 4, (x, y, nx, ny) => (nx + ny < -0.2 ? '#d9bf94' : '#f7ecd2'));
    }
    // tope del disco
    p.rect(cx + 12, cy + 9, 4, 2, GOLD_D);
    // centro: copo de nieve sobre rojo
    p.ell(cx - 5, cy - 5, 10, 10, (x, y, nx, ny) => (nx + ny > 0.5 ? RED_D : RED));
    [[0, -3], [0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [-3, 0], [-2, 0], [-1, 0], [1, 0], [2, 0], [-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([dx, dy]) => p.set(cx + dx, cy + dy, '#ffffff'));
    // ---- horquillas ----
    p.rect(22, 38, 8, 9, (x, y, i) => (i === 0 ? RED_L : i > 5 ? RED_D : RED));
    p.rect(70, 38, 8, 9, (x, y, i) => (i === 0 ? RED_L : i > 5 ? RED_D : RED));
    p.rect(21, 37, 10, 2, GOLD); p.rect(69, 37, 10, 2, GOLD);
    // ---- auricular ----
    const dy = lifted ? -14 : 0;
    const tilt = lifted ? 3 : 0;
    const hy = 24 + dy;
    // barra arqueada
    for (let x = 18; x <= 82; x++) {
      const arch = Math.round(Math.sin(((x - 18) / 64) * Math.PI) * -2);
      const ty = Math.round(tilt * ((x - 50) / 32));
      for (let k = 0; k < 7; k++) p.set(x, hy + arch + k + ty, k === 0 ? RED_L : k === 1 ? '#ff9a8a' : k > 4 ? RED_D : RED);
    }
    // copas de los extremos
    const cup = (x0, y0) => {
      p.ell(x0, y0, 24, 16, (x, y, nx, ny) => (ny < -0.55 ? RED_L : nx + ny > 0.55 ? RED_D : RED));
      p.ell(x0 + 3, y0 + 10, 18, 7, RED_DD);
      p.ell(x0 + 5, y0 + 11, 14, 4, '#5a1018');
      // nieve encima
      p.ell(x0 + 4, y0 - 2, 16, 5, (x, y, nx, ny) => (ny > 0.3 ? '#d6e2ff' : '#ffffff'));
    };
    cup(6, hy + 2 - tilt);
    cup(70, hy + 2 + tilt);
    // acebo en el centro
    const lx = 50, ly = hy - 2;
    const leaf = (x0, dir) => {
      for (let i = 0; i < 12; i++) {
        const w = Math.round(Math.sin((i / 11) * Math.PI) * 3.5) + 1;
        const x = x0 + dir * i;
        p.rect(x, ly - w + 1 + (i % 4 === 1 ? -1 : 0), 1, w * 2, (px, py, ii, j) => (j === w * 2 - 1 || j === 0 ? '#26802f' : j === w ? '#1d5e28' : '#4cc04f'));
      }
    };
    leaf(lx - 3, -1); leaf(lx + 3, 1);
    const berry = (x, y) => { p.ell(x, y, 6, 6, (px, py, nx, ny) => (nx + ny > 0.5 ? '#b81c24' : '#ff3434')); p.set(x + 1, y + 1, '#ffffff'); p.set(x + 2, y + 1, '#ffd0d0'); };
    berry(lx - 6, ly - 7); berry(lx, ly - 8); berry(lx - 3, ly - 3);
    // ---- cordón de bastón de caramelo ----
    const sx = 88, sy = hy + 16 + tilt;
    const ex = 90, ey = 66;
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = sx + (ex - sx) * t + Math.sin(t * Math.PI * 5) * 3 + Math.sin(t * Math.PI) * 4;
      const y = sy + (ey - sy) * t;
      p.rect(Math.round(x), Math.round(y), 3, 2, i % 2 ? '#ffffff' : RED);
    }
    return p.pad(2, 1, 1, 2).toCanvas('#2a1424');
  });
}

/* ---------------- ÍCONOS 16x16 ---------------- */
const ICONS = {
  chat: [
    '................',
    '..wwwwwwwwwwww..',
    '.wwwwwwwwwwwwww.',
    '.wwWWwwwwwwwwww.',
    '.wwwwwwwwwwwwww.',
    '.ww.rr..rr..rr..',
    '.ww.rr..rr..rr..',
    '.wwwwwwwwwwwwww.',
    '.wwwwwwwwwwwwWw.',
    '..wwwwwwwwwwWW..',
    '....www.........',
    '....ww..........',
    '....w...........',
    '................',
  ],
  star: [
    '.......yy.......',
    '.......yy.......',
    '......yyyy......',
    '......yyyy......',
    'yyyyyyyyyyyyyyyy',
    '.yyyyyywyyyyyyY.',
    '..yyyyywyyyyyY..',
    '...yyyyyyyyyY...',
    '....yyyyyyyY....',
    '....yyyyyyyY....',
    '...yyyyYYyyyY...',
    '...yyyY..YyyY...',
    '..yyyY....YyYY..',
    '..yyY......YYY..',
    '..yY........YY..',
  ],
  lock: [
    '.....WWWWWW.....',
    '....WW....WW....',
    '...WW......WW...',
    '...WW......WW...',
    '...WW......WW...',
    '..yyyyyyyyyyyy..',
    '..yyyyyyyyyyyY..',
    '..yyyyybbyyyyY..',
    '..yyyyybbyyyyY..',
    '..yyyyyybyyyyY..',
    '..yyyyyybyyyyY..',
    '..yyyyyyyyyyyY..',
    '..YYYYYYYYYYYY..',
  ],
  mic: [
    '......bbbb......',
    '.....bwwwwb.....',
    '.....bwwwWb.....',
    '.....bwwwWb.....',
    '.....bwwwWb.....',
    '...b.bwwwWb.b...',
    '...b.bwwwWb.b...',
    '...b..bbbb..b...',
    '....b......b....',
    '.....bbbbbb.....',
    '.......bb.......',
    '.......bb.......',
    '....bbbbbbbb....',
  ],
  sound: [
    '................',
    '......b.........',
    '.....bb.....w...',
    '....bwb...w..w..',
    'bbbbwwb....w..w.',
    'bwwwwwb..w.w..w.',
    'bwwwwwb..w.w..w.',
    'bbbbwwb....w..w.',
    '....bwb...w..w..',
    '.....bb.....w...',
    '......b.........',
  ],
  mute: [
    '................',
    '......b.........',
    '.....bb.........',
    '....bwb.........',
    'bbbbwwb..r...r..',
    'bwwwwwb...r.r...',
    'bwwwwwb....r....',
    'bbbbwwb...r.r...',
    '....bwb..r...r..',
    '.....bb.........',
    '......b.........',
  ],
  back: [
    '......ww........',
    '.....www........',
    '....wwww........',
    '...wwwwwwwwwwww.',
    '..wwwwwwwwwwwww.',
    '...wwwwwwwwwwww.',
    '....wwww........',
    '.....www........',
    '......ww........',
  ],
  send: [
    'w...............',
    'www.............',
    'wwwww...........',
    'wwwwwww.........',
    'wwwwwwwww.......',
    'wwwwwwwwwww.....',
    'wwwwwwwwwwwww...',
    'wwwwwwwwwww.....',
    'wwwwwwwww.......',
    'wwwwwww.........',
    'wwwww...........',
    'www.............',
    'w...............',
  ],
  snow: [
    '.......c........',
    '.....c.c.c......',
    '......ccc.......',
    '..c....c....c...',
    '...c...c...c....',
    '.cccccccccccccc.',
    '...c...c...c....',
    '..c....c....c...',
    '......ccc.......',
    '.....c.c.c......',
    '.......c........',
  ],
  heart: [
    '..rrr...rrr.....',
    '.rqqrr.rrrrr....',
    'rqqrrrrrrrrrr...',
    'rqrrrrrrrrrRr...',
    'rrrrrrrrrrrRr...',
    '.rrrrrrrrrRr....',
    '..rrrrrrrRr.....',
    '...rrrrrRr......',
    '....rrrRr.......',
    '.....rRr........',
    '......r.........',
  ],
  gear: [
    '......WW........',
    '...W..WW..W.....',
    '..WWWWWWWWWW....',
    '...WWW..WWW.....',
    '.WWWW....WWWW...',
    '.WWWW....WWWW...',
    '...WWW..WWW.....',
    '..WWWWWWWWWW....',
    '...W..WW..W.....',
    '......WW........',
  ],
};
export function icon(name) {
  return cached(`icon|${name}`, () => {
    const rows = ICONS[name];
    const p = new Pix(18, rows.length + 2);
    p.map(1, 1, rows);
    return p.toCanvas();
  });
}

// Íconos grandes para los botones del menú
export function bigIcon(name) {
  return cached(`big|${name}`, () => {
    if (name === 'chat') {
      const p = new Pix(34, 30);
      p.ell(2, 2, 30, 20, shade(C.w, C.W));
      p.tri(8, 18, 6, 27, 16, 19, C.w);
      p.ell(8, 10, 4, 4, C.r); p.ell(15, 10, 4, 4, C.g); p.ell(22, 10, 4, 4, C.r);
      return p.toCanvas();
    }
    if (name === 'calendar') {
      const p = new Pix(32, 32);
      p.rect(3, 13, 26, 17, (x, y, i) => (i > 20 ? C.G : C.g));
      p.rect(14, 13, 4, 17, C.y);
      p.rect(2, 8, 28, 6, (x, y, i, j) => (j === 5 ? C.G : C.g));
      p.rect(14, 8, 4, 6, C.y);
      p.ell(6, 1, 10, 8, C.y); p.ell(16, 1, 10, 8, C.y); p.ell(13, 4, 6, 5, C.Y);
      return p.toCanvas();
    }
    if (name === 'santa') {
      const p = new Pix(34, 32);
      p.ell(5, 12, 24, 19, (x, y, nx, ny) => ((x + y) % 4 === 0 && ny > 0.2 ? C.W : C.w));
      p.ell(9, 8, 16, 13, shade(C.s, C.S));
      p.ell(8, 1, 18, 9, shade(C.r, C.R, C.q)); p.tri(10, 3, 24, 2, 3, 9, C.r);
      p.ell(1, 7, 6, 6, C.w);
      p.rect(7, 7, 20, 3, C.w);
      p.rect(12, 12, 2, 2, C.b); p.rect(20, 12, 2, 2, C.b);
      p.ell(15, 14, 4, 3, C.q);
      p.ell(10, 16, 7, 3, C.w); p.ell(17, 16, 7, 3, C.w);
      p.rect(15, 19, 4, 1, C.R);
      return p.toCanvas();
    }
    if (name === 'star') {
      const p = new Pix(32, 32);
      const pts = [];
      for (let i = 0; i < 10; i++) { const a = rad(-90 + i * 36), r = i % 2 ? 6.5 : 15; pts.push([16 + Math.cos(a) * r, 17 + Math.sin(a) * r]); }
      for (let i = 0; i < 10; i++) p.tri(16, 17, ...pts[i], ...pts[(i + 1) % 10], i >= 3 && i <= 6 ? C.Y : C.y);
      p.set(12, 13, C.w); p.set(13, 13, C.w); p.set(12, 14, C.w);
      p.rect(12, 17, 2, 2, C.b); p.rect(18, 17, 2, 2, C.b);
      return p.toCanvas();
    }
    if (name === 'phone') {
      return phone(0);
    }
  });
}

/* ---------------- ESTRELLA SUELTA (para frascos y confeti) ---------------- */
export function smallStar(col = C.y) {
  return cached(`sstar|${col}`, () => {
    const p = new Pix(9, 9);
    p.map(0, 0, [
      '....y....',
      '....y....',
      '...yyy...',
      'yyyyyyyyy',
      '.yyyyyyy.',
      '..yyyyy..',
      '..yy.yy..',
      '.yy...yy.',
    ], { y: col });
    return p.toCanvas(null);
  });
}
