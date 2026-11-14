// El taller de Santa: ventana con nieve, árbol con luces, chimenea, lista de los buenos y los 3 elfos.
import { ElfActor } from './actors.js';
import { gift, pine, treeStar } from './sprites.js';

export const WW = 192, WH = 128;
const TREE = { ox: 0, oy: 0, lights: [], top: { x: 0, y: 0 } };
const rnd = (a, b) => a + Math.random() * (b - a);

function drawStatic() {
  const c = document.createElement('canvas'); c.width = WW; c.height = WH;
  const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  // pared de tablas
  for (let x = 0; x < WW; x += 12) {
    R(x, 0, 12, 110, (x / 12) % 2 ? '#6e3f26' : '#7c4a2d');
    R(x, 0, 1, 110, '#4e2a18');
    for (let y = 8; y < 110; y += 34) { R(x + 5, y + ((x / 12) % 3) * 6, 1, 1, '#3b1f12'); }
    for (let y = 0; y < 110; y += 3) if ((x * 7 + y * 3) % 11 === 0) R(x + 3 + (y % 5), y, 2, 1, '#653822');
  }
  // viga superior
  R(0, 0, WW, 6, '#4e2a18'); R(0, 6, WW, 1, '#2f180d');
  // zócalo
  R(0, 104, WW, 6, '#4e2a18');
  // piso
  for (let y = 110; y < WH; y += 4) {
    R(0, y, WW, 4, (y / 4) % 2 ? '#a0663a' : '#b0744a');
    R(0, y + 3, WW, 1, '#7a4a2a');
    for (let x = ((y / 4) % 3) * 17; x < WW; x += 48) R(x, y, 1, 3, '#7a4a2a');
  }
  // alfombra
  g.fillStyle = '#9e1f2a'; g.beginPath(); g.ellipse(100, 113, 50, 7, 0, 0, 7); g.fill();
  g.fillStyle = '#e03a3a'; g.beginPath(); g.ellipse(100, 113, 45, 5.5, 0, 0, 7); g.fill();
  g.fillStyle = '#2f8a3a'; g.beginPath(); g.ellipse(100, 113, 38, 4, 0, 0, 7); g.fill();
  g.fillStyle = '#ffd23f'; for (let i = 0; i < 12; i++) R(Math.round(100 + Math.cos(i / 12 * 6.28) * 42), Math.round(113 + Math.sin(i / 12 * 6.28) * 5), 1, 1, '#ffd23f');

  // ventana
  R(8, 14, 42, 40, '#3b1f12'); R(10, 16, 38, 36, '#1a1f5a');
  // la nieve y el cielo se dibujan en vivo, aquí el marco
  // repisa de la ventana
  R(6, 52, 46, 4, '#5a3420'); R(6, 52, 46, 1, '#f4f8ff');

  // Lista de los Buenos (pergamino)
  R(76, 12, 40, 3, '#8a4c22'); R(76, 46, 40, 3, '#8a4c22');
  R(78, 15, 36, 31, '#fff0c8'); R(78, 15, 1, 31, '#e6cf98'); R(113, 15, 1, 31, '#e6cf98');
  R(84, 18, 24, 2, '#c0392b');
  for (let i = 0; i < 5; i++) { R(82, 23 + i * 4, 3, 3, '#2f8a3a'); R(83, 24 + i * 4, 1, 1, '#fff'); R(87, 24 + i * 4, 18 + ((i * 7) % 6), 1, '#9a8566'); }
  R(74, 11, 3, 5, '#5a3420'); R(115, 11, 3, 5, '#5a3420'); R(74, 45, 3, 5, '#5a3420'); R(115, 45, 3, 5, '#5a3420');

  // estantes con juguetes (derecha arriba)
  R(146, 26, 42, 3, '#5a3420'); R(146, 29, 42, 1, '#3b1f12');
  // osito
  R(150, 17, 7, 9, '#a8693a'); R(149, 15, 3, 3, '#a8693a'); R(155, 15, 3, 3, '#a8693a'); R(152, 19, 1, 1, '#1d1622'); R(155, 19, 1, 1, '#1d1622'); R(153, 21, 2, 1, '#5a3420');
  // pelota
  g.fillStyle = '#4a8ad8'; g.beginPath(); g.arc(163, 22, 4, 0, 7); g.fill(); R(160, 21, 7, 2, '#ffd23f'); R(161, 19, 1, 1, '#fff');
  // tren
  R(171, 20, 12, 6, '#e03a3a'); R(179, 16, 4, 4, '#e03a3a'); R(172, 26, 3, 2, '#1d1622'); R(179, 26, 3, 2, '#1d1622'); R(173, 21, 3, 2, '#9ad8ff');
  R(146, 44, 42, 3, '#5a3420'); R(146, 47, 42, 1, '#3b1f12');
  // bloques y muñeca
  R(149, 37, 6, 6, '#ffd23f'); R(155, 37, 6, 6, '#43b047'); R(152, 31, 6, 6, '#e03a3a');
  R(151, 39, 2, 2, '#c99a1c'); R(157, 39, 2, 2, '#26802f'); R(154, 33, 2, 2, '#a11f2a');
  R(168, 33, 5, 5, '#f8dcc2'); R(167, 32, 7, 3, '#c97a3c'); R(167, 38, 7, 6, '#9a5cd8'); R(169, 35, 1, 1, '#1d1622'); R(171, 35, 1, 1, '#1d1622');
  // tambor
  R(178, 36, 8, 7, '#e03a3a'); R(178, 36, 8, 1, '#fdf9f0'); R(178, 42, 8, 1, '#fdf9f0'); for (let i = 0; i < 4; i++) R(179 + i * 2, 38 + (i % 2) * 2, 1, 2, '#ffd23f');

  // chimenea (derecha abajo)
  R(146, 58, 46, 6, '#5a3420'); R(144, 56, 50, 3, '#6e3f26');
  for (let y = 64; y < 110; y += 5) for (let x = 146 + ((y / 5) % 2) * 4; x < 192; x += 9) { R(x, y, 8, 4, (x + y) % 3 ? '#8a8496' : '#9c96a8'); R(x, y + 4, 8, 1, '#5e5868'); }
  R(156, 74, 28, 36, '#1d1218'); R(156, 74, 28, 2, '#3a2a30');
  R(158, 104, 24, 4, '#4a2a1a'); R(160, 102, 9, 3, '#6e3f26'); R(170, 103, 9, 3, '#5a3420');
  // botas/medias colgando con nombres S y A
  const stock = (x, col, cuff, letter) => {
    R(x, 64, 7, 3, cuff); R(x + 1, 67, 6, 9, col); R(x - 2, 73, 8, 4, col); R(x - 2, 77, 6, 1, '#00000033');
    // letra
    g.fillStyle = cuff;
    if (letter === 'S') { R(x + 2, 68, 3, 1, cuff); R(x + 2, 69, 1, 1, cuff); R(x + 2, 70, 3, 1, cuff); R(x + 4, 71, 1, 1, cuff); R(x + 2, 72, 3, 1, cuff); }
    else { R(x + 3, 68, 1, 1, cuff); R(x + 2, 69, 1, 4, cuff); R(x + 4, 69, 1, 4, cuff); R(x + 2, 70, 3, 1, cuff); }
  };
  stock(152, '#9a5cd8', '#fdf9f0', 'S');
  stock(165, '#f06aa0', '#fdf9f0', 'A');
  stock(178, '#43b047', '#fdf9f0', '');

  // árbol de Navidad (izquierda abajo)
  const tree = pine(54, { deco: true, snow: false, seed: 11 });
  g.drawImage(tree.cv, 28 - Math.round(tree.cv.width / 2), 106 - tree.cv.height);
  TREE.ox = 28 - Math.round(tree.cv.width / 2); TREE.oy = 106 - tree.cv.height; TREE.lights = tree.lights; TREE.top = tree.top;
  // macetero
  R(20, 100, 16, 7, '#b0303a'); R(20, 100, 16, 1, '#ffd23f'); R(20, 104, 16, 1, '#ffd23f'); R(34, 100, 2, 7, '#7e1622');

  // regalos al pie del árbol
  g.drawImage(gift(0), 36, 92); g.drawImage(gift(2), 4, 96); g.drawImage(gift(3), 50, 98);
  return c;
}

export class Workshop {
  constructor(canvas, { onTap } = {}) {
    this.cv = canvas; this.ctx = canvas.getContext('2d');
    this.buf = document.createElement('canvas'); this.buf.width = WW; this.buf.height = WH;
    this.b = this.buf.getContext('2d');
    this.bg = drawStatic();
    this.elves = { scarf: new ElfActor('scarf', 70, 112), stripe: new ElfActor('stripe', 100, 113), green: new ElfActor('green', 130, 112) };
    Object.values(this.elves).forEach((e) => (e.wander = 8));
    this.onTap = onTap;
    this.t = 0; this.last = performance.now(); this.running = false;
    this.winSnow = Array.from({ length: 22 }, () => ({ x: rnd(10, 48), y: rnd(16, 52), v: rnd(4, 9) }));
    this.sparks = [];
    this.treeLights = TREE.lights.map((l, i) => ({ x: TREE.ox + l.x, y: TREE.oy + l.y, c: ['#ff4a4a', '#ffd23f', '#5ad8ff', '#ff8ad8', '#7dff7a'][i % 5], ph: i }));
    canvas.addEventListener('pointerdown', (e) => this.tap(e));
    this.resize();
    addEventListener('resize', () => this.resize());
  }
  resize() {
    const r = this.cv.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    this.cv.width = Math.max(WW, Math.round(r.width * dpr)); this.cv.height = Math.round(this.cv.width * WH / WW);
    this.ctx.imageSmoothingEnabled = false;
  }
  start() { if (this.running) return; this.running = true; this.last = performance.now(); this.resize(); const f = (n) => { if (!this.running) return; this.frame(n); requestAnimationFrame(f); }; requestAnimationFrame(f); }
  stop() { this.running = false; }
  tap(e) {
    const r = this.cv.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * WW, y = ((e.clientY - r.top) / r.height) * WH;
    for (const [id, a] of Object.entries(this.elves)) {
      const b = a.bounds();
      if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { this.onTap && this.onTap(id); return; }
    }
    if (x > 74 && x < 118 && y > 10 && y < 50) { this.onTap && this.onTap('list'); return; }
    if (x > 146 && y > 56 && y < 110) { this.burst(170, 90, '#ffb03a'); this.onTap && this.onTap('fire'); return; }
    if (x < 52 && y > 56) { this.burst(28, 60, '#ffd23f'); this.onTap && this.onTap('tree'); return; }
    if (x < 52 && y < 56) { this.onTap && this.onTap('window'); return; }
  }
  burst(x, y, col) { for (let i = 0; i < 16; i++) this.sparks.push({ x, y, vx: rnd(-25, 25), vy: rnd(-35, -5), life: rnd(0.5, 1.1), col }); }
  frame(now) {
    const dt = Math.min(0.1, (now - this.last) / 1000); this.last = now; this.t += dt;
    const g = this.b, t = this.t;
    g.drawImage(this.bg, 0, 0);
    // cielo por la ventana
    g.fillStyle = '#5ad8a0'; for (let x = 10; x < 48; x++) { const y = Math.round(24 + Math.sin(x * 0.2 + t) * 3); g.globalAlpha = 0.35; g.fillRect(x, y, 1, 4); }
    g.globalAlpha = 1;
    g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(40, 24, 4, 0, 7); g.fill();
    g.fillStyle = '#fff';
    for (const s of this.winSnow) { s.y += s.v * dt; s.x += Math.sin(t + s.y) * 0.05; if (s.y > 51) { s.y = 16; s.x = rnd(10, 48); } g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    g.fillStyle = '#3b1f12'; g.fillRect(28, 16, 2, 36); g.fillRect(10, 33, 38, 2);
    g.fillStyle = '#f4f8ff'; g.fillRect(10, 50, 38, 2);
    // guirnalda con luces
    for (let x = 0; x < WW; x += 1) { const y = 8 + Math.round(Math.abs(Math.sin(x * 0.065)) * 4); g.fillStyle = x % 3 ? '#26802f' : '#43b047'; g.fillRect(x, y, 1, 2); }
    for (let i = 0; i < 16; i++) {
      const x = 6 + i * 12, y = 10 + Math.round(Math.abs(Math.sin(x * 0.065)) * 4);
      const on = Math.floor(t * 2 + i) % 3 !== 0;
      g.fillStyle = on ? ['#ff4a4a', '#ffd23f', '#5ad8ff', '#7dff7a'][i % 4] : '#5a4a50';
      g.fillRect(x, y + 2, 2, 3);
      if (on) { g.fillStyle = 'rgba(255,240,180,0.25)'; g.fillRect(x - 1, y + 1, 4, 5); }
    }
    // luces del árbol (se encienden en ola) y estrella con brillo
    for (const l of this.treeLights) {
      const v = Math.sin(t * 3 - l.y * 0.25 + l.ph * 0.4);
      if (v < -0.3) continue;
      g.fillStyle = l.c; g.fillRect(l.x, Math.round(l.y), 2, 2);
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(l.x, Math.round(l.y), 1, 1);
      if (v > 0.75) { g.globalAlpha = 0.3; g.fillStyle = l.c; g.fillRect(l.x - 1, Math.round(l.y) - 1, 4, 4); g.globalAlpha = 1; }
    }
    const glow = 0.25 + 0.15 * Math.sin(t * 3);
    g.fillStyle = `rgba(255,230,120,${glow})`; g.beginPath(); g.arc(TREE.ox + TREE.top.x, TREE.oy + TREE.top.y, 9 + Math.sin(t * 3) * 1.5, 0, 7); g.fill();
    const st = treeStar(Math.sin(t * 4) > 0.3 ? 1 : 0);
    g.drawImage(st, TREE.ox + TREE.top.x - 6, TREE.oy + TREE.top.y - 8);
    // fuego
    for (let i = 0; i < 22; i++) {
      const x = 160 + ((i * 7) % 20), h = 6 + Math.abs(Math.sin(t * 9 + i * 1.3)) * 14;
      for (let j = 0; j < h; j++) { g.fillStyle = j < h * 0.35 ? '#ffd23f' : j < h * 0.7 ? '#ff8a2a' : '#e03a3a'; g.fillRect(x, 103 - j, 2, 1); }
    }
    g.fillStyle = 'rgba(255,140,40,0.10)'; g.fillRect(140, 60, 52, 52);
    // brillos de la lista
    if (Math.floor(t * 1.5) % 4 === 0) { g.fillStyle = '#fff6b0'; g.fillRect(110, 17, 1, 3); g.fillRect(109, 18, 3, 1); }
    // elfos (de atrás hacia adelante)
    // de atrás hacia adelante según su posición, y avisamos para mover las etiquetas
    for (const a of Object.values(this.elves).sort((p, q) => p.y - q.y)) { a.update(dt); a.draw(g); }
    if (this.onMove) this.onMove();
    // chispas
    this.sparks = this.sparks.filter((s) => { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 40 * dt; g.fillStyle = s.col; g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); return s.life > 0; });
    // al canvas visible
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.drawImage(this.buf, 0, 0, this.cv.width, this.cv.height);
  }
  elfScreenPos(id) {
    const a = this.elves[id];
    return { x: a.x / WW, y: a.y / WH };
  }
}
