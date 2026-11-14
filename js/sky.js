// Cielo del Polo Norte: auroras, estrellas, luna, aldea, nieve y eventos mágicos.
import { reindeer, sleigh, smallStar } from './sprites.js';
import { PAL as C } from './pix.js';

const SKY = ['#070a24', '#0d1338', '#16194a', '#221c5c', '#30226a', '#3e2a74'];
let cv, x, W, H, scale;
let skyLayer, groundLayer;
let stars = [], flakes = [], parts = [], events = [], windows = [];
let t0 = performance.now(), last = 0;
let snowBoost = 0, auroraBoost = 0;
let running = true;

function rnd(a, b) { return a + Math.random() * (b - a); }

function makeLayers() {
  // cielo con bandas y tramado
  skyLayer = document.createElement('canvas'); skyLayer.width = W; skyLayer.height = H;
  const s = skyLayer.getContext('2d');
  const bands = SKY.length;
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const img = s.createImageData(W, H);
  const hex = SKY.map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  for (let y = 0; y < H; y++) {
    const f = (y / (H * 0.85)) * (bands - 1);
    const b = Math.min(bands - 2, Math.floor(f));
    const frac = f - b;
    for (let xx = 0; xx < W; xx++) {
      const c = frac * 16 > bayer[y % 4][xx % 4] ? hex[Math.min(bands - 1, b + 1)] : hex[b];
      const i = (y * W + xx) * 4; img.data[i] = c[0]; img.data[i + 1] = c[1]; img.data[i + 2] = c[2]; img.data[i + 3] = 255;
    }
  }
  s.putImageData(img, 0, 0);

  // suelo: montañas, colinas nevadas, pinos y casitas
  groundLayer = document.createElement('canvas'); groundLayer.width = W; groundLayer.height = H;
  const g = groundLayer.getContext('2d');
  const base = H - Math.max(26, Math.round(H * 0.2));
  // montañas lejanas
  g.fillStyle = '#2b2f6e';
  for (let xx = 0; xx < W; xx++) {
    const y = base - 18 - Math.abs(((xx * 0.9) % 60) - 30) * 0.6 - Math.sin(xx * 0.05) * 4;
    g.fillRect(xx, Math.round(y), 1, H);
  }
  g.fillStyle = '#d9e4ff';
  for (let xx = 0; xx < W; xx++) {
    const y = base - 18 - Math.abs(((xx * 0.9) % 60) - 30) * 0.6 - Math.sin(xx * 0.05) * 4;
    if (Math.abs(((xx * 0.9) % 60) - 30) > 22) g.fillRect(xx, Math.round(y), 1, 2);
  }
  // colina media
  g.fillStyle = '#3c4796';
  for (let xx = 0; xx < W; xx++) g.fillRect(xx, Math.round(base - 6 + Math.sin(xx * 0.03 + 1) * 5), 1, H);
  // pinos lejanos
  for (let i = 0; i < W / 9; i++) {
    const px = Math.round(rnd(0, W)), py = Math.round(base - 4 + Math.sin(px * 0.03 + 1) * 5), hgt = Math.round(rnd(8, 15));
    for (let j = 0; j < hgt; j++) {
      const w = Math.max(1, Math.round((j / hgt) * 6));
      g.fillStyle = j % 4 === 0 ? '#e8f0ff' : '#1d4a4a';
      g.fillRect(px - (w >> 1), py - hgt + j, w, 1);
    }
  }
  // casitas con ventanas
  windows = [];
  const houses = Math.max(3, Math.round(W / 45));
  for (let i = 0; i < houses; i++) {
    const hx = Math.round((i + 0.5) * (W / houses) + rnd(-8, 8)), hy = base + 2;
    const hw = Math.round(rnd(12, 18)), hh = Math.round(rnd(8, 11));
    g.fillStyle = ['#7a3b2e', '#5d3a6e', '#2f5e4e', '#8a5a2e'][i % 4];
    g.fillRect(hx, hy - hh, hw, hh);
    // techo con nieve
    for (let j = 0; j < 6; j++) { g.fillStyle = j < 2 ? '#f4f8ff' : '#c9d6f2'; g.fillRect(hx - 2 + j, hy - hh - 6 + j, hw + 4 - j * 2, 1); }
    g.fillStyle = '#f4f8ff'; g.fillRect(hx - 2, hy - hh - 1, hw + 4, 1);
    // chimenea
    g.fillStyle = '#4a2a22'; g.fillRect(hx + hw - 5, hy - hh - 9, 3, 5);
    windows.push({ x: hx + 3, y: hy - hh + 3, ph: rnd(0, 6) });
    if (hw > 13) windows.push({ x: hx + hw - 6, y: hy - hh + 3, ph: rnd(0, 6) });
    g.fillStyle = '#3a1f14'; g.fillRect(hx + (hw >> 1) - 1, hy - 5, 3, 5);
    parts.push({ kind: 'smokeSrc', x: hx + hw - 4, y: hy - hh - 10, next: rnd(0, 2) });
  }
  // nieve del frente
  g.fillStyle = '#e9efff';
  for (let xx = 0; xx < W; xx++) g.fillRect(xx, Math.round(base + 2 + Math.sin(xx * 0.045) * 3), 1, H);
  g.fillStyle = '#c4d0f0';
  for (let xx = 0; xx < W; xx++) { const y = Math.round(base + 2 + Math.sin(xx * 0.045) * 3); g.fillRect(xx, y + 6 + ((xx >> 3) % 3), 1, 1); }
  // bastón del Polo Norte
  const px = Math.round(W * 0.78), py = Math.round(base + 4 + Math.sin(px * 0.045) * 3);
  for (let j = 0; j < 24; j++) { g.fillStyle = (j >> 1) % 2 ? '#e03a3a' : '#fdf9f0'; g.fillRect(px, py - j, 2, 1); }
  g.fillStyle = '#ffd23f'; g.fillRect(px - 1, py - 26, 4, 2);
  // pinos del frente
  for (let i = 0; i < 4; i++) {
    const tx = Math.round(i % 2 ? rnd(W * 0.02, W * 0.2) : rnd(W * 0.85, W * 0.98)), ty = H - Math.round(rnd(2, 8)), hgt = Math.round(rnd(22, 32));
    for (let j = 0; j < hgt; j++) {
      const w = Math.max(1, Math.round(((j % 8) / 8 + j / hgt) * 7));
      g.fillStyle = j % 8 < 2 ? '#f0f5ff' : j % 8 < 4 ? '#2d7a52' : '#1f5c3f';
      g.fillRect(tx - (w >> 1), ty - hgt + j, w, 1);
    }
    g.fillStyle = '#4a2a22'; g.fillRect(tx - 1, ty, 2, 3);
  }
}

function setup() {
  const dpr = 1;
  scale = Math.max(2, Math.round(Math.min(innerWidth, innerHeight) / 130));
  W = Math.ceil(innerWidth / scale); H = Math.ceil(innerHeight / scale);
  cv.width = W * dpr; cv.height = H * dpr;
  x.imageSmoothingEnabled = false;
  parts = parts.filter((p) => p.kind !== 'smokeSrc');
  stars = Array.from({ length: Math.round((W * H) / 70) }, () => ({ x: Math.floor(rnd(0, W)), y: Math.floor(rnd(0, H * 0.65)), ph: rnd(0, 6.28), sp: rnd(1, 3), big: Math.random() < 0.08 }));
  flakes = Array.from({ length: Math.round(W * H / 220) }, () => newFlake(true));
  makeLayers();
}

function newFlake(any) {
  return { x: rnd(-10, W + 10), y: any ? rnd(-H, H) : rnd(-20, -2), vy: rnd(6, 16), vx: rnd(-3, 3), ph: rnd(0, 6), big: Math.random() < 0.25 };
}

export function initSky(canvas) {
  cv = canvas; x = cv.getContext('2d');
  setup();
  addEventListener('resize', () => setup());
  document.addEventListener('visibilitychange', () => { running = !document.hidden; if (running) requestAnimationFrame(loop); });
  scheduleSleigh(8000);
  requestAnimationFrame(loop);
}

function scheduleSleigh(ms) { setTimeout(() => { trigger('sleigh'); scheduleSleigh(rnd(35000, 60000)); }, ms); }

export function trigger(name) {
  const t = (performance.now() - t0) / 1000;
  if (name === 'sleigh' || name === 'reindeer') events.push({ kind: 'sleigh', start: t, dur: 9, y: rnd(H * 0.12, H * 0.32), dir: Math.random() < 0.5 ? 1 : -1, only: name === 'reindeer' });
  if (name === 'snow') snowBoost = 6;
  if (name === 'aurora') auroraBoost = 8;
  if (name === 'stars') for (let i = 0; i < 6; i++) events.push({ kind: 'shoot', start: t + i * 0.5, dur: 1.2, x: rnd(W * 0.1, W * 0.9), y: rnd(0, H * 0.3) });
  if (name === 'fireworks' || name === 'birthday') for (let i = 0; i < 10; i++) events.push({ kind: 'firework', start: t + i * 0.45, x: rnd(W * 0.15, W * 0.85), y: rnd(H * 0.1, H * 0.4), done: false, col: [C.r, C.y, C.l, C.c, C.p, C.v][i % 6] });
  if (name === 'hearts') for (let i = 0; i < 14; i++) parts.push({ kind: 'heart', x: rnd(0, W), y: H + rnd(0, 30), vy: rnd(-14, -8), life: 6 });
  if (name === 'sparkle' || name === 'dance' || name === 'song') for (let i = 0; i < 40; i++) parts.push({ kind: 'spark', x: rnd(0, W), y: rnd(0, H * 0.7), life: rnd(0.6, 2), col: [C.y, C.w, C.c][i % 3] });
  if (name === 'birthday') for (let i = 0; i < 12; i++) parts.push({ kind: 'balloon', x: rnd(0, W), y: H + rnd(0, 40), vy: rnd(-12, -7), life: 9, col: [C.r, C.y, C.u, C.p, C.l, C.v][i % 6] });
}

export function confettiBurst() {
  for (let i = 0; i < 60; i++) parts.push({ kind: 'conf', x: W / 2 + rnd(-10, 10), y: H * 0.45, vx: rnd(-40, 40), vy: rnd(-60, -20), life: rnd(1.5, 3), col: [C.r, C.y, C.l, C.c, C.p, C.w][i % 6] });
}

function loop(now) {
  if (!running) return;
  requestAnimationFrame(loop);
  if (now - last < 33) return; // ~30 fps
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  const t = (now - t0) / 1000;
  x.drawImage(skyLayer, 0, 0);

  // estrellas
  for (const s of stars) {
    const b = Math.sin(t * s.sp + s.ph);
    if (b > -0.3) {
      x.fillStyle = b > 0.7 ? '#ffffff' : b > 0.2 ? '#c9d2ff' : '#6f78b8';
      x.fillRect(s.x, s.y, 1, 1);
      if (s.big && b > 0.75) { x.fillStyle = '#9aa5e8'; x.fillRect(s.x - 1, s.y, 1, 1); x.fillRect(s.x + 1, s.y, 1, 1); x.fillRect(s.x, s.y - 1, 1, 1); x.fillRect(s.x, s.y + 1, 1, 1); }
    }
  }

  // auroras
  auroraBoost = Math.max(0, auroraBoost - dt);
  const aStrength = 0.55 + Math.min(1, auroraBoost / 4) * 0.45;
  for (let xx = 0; xx < W; xx++) {
    const yc = H * 0.2 + Math.sin(xx * 0.04 + t * 0.35) * 8 + Math.sin(xx * 0.11 - t * 0.6) * 3;
    const len = 14 + Math.sin(xx * 0.07 + t * 0.5) * 8 + auroraBoost * 1.5;
    const k = (Math.sin(xx * 0.025 - t * 0.25) + 1) / 2;
    for (let j = 0; j < len; j++) {
      const a = (1 - j / len) * aStrength;
      if (a < 0.08) continue;
      const streak = (Math.sin(xx * 0.9 + t * 0.8) + Math.sin(xx * 0.37)) * 0.5;
      const q = (a > 0.55 ? 0.42 : a > 0.3 ? 0.24 : 0.11) * (0.55 + streak * 0.45);
      if (q < 0.05) continue;
      x.fillStyle = k > 0.82 ? `rgba(230,120,230,${q})` : k > 0.3 ? `rgba(90,240,170,${q})` : `rgba(80,210,240,${q})`;
      x.fillRect(xx, Math.round(yc + j - 2), 1, 1);
    }
  }

  // luna
  const mx = Math.round(W * 0.8), my = Math.round(H * 0.12);
  x.fillStyle = 'rgba(255,250,220,0.08)'; x.beginPath(); x.arc(mx, my, 13, 0, 7); x.fill();
  x.fillStyle = '#fff6d6'; x.beginPath(); x.arc(mx, my, 8, 0, 7); x.fill();
  x.fillStyle = '#e8dcae'; x.fillRect(mx - 3, my - 2, 2, 2); x.fillRect(mx + 2, my + 2, 3, 2); x.fillRect(mx + 1, my - 4, 1, 1);

  // eventos del cielo
  events = events.filter((e) => {
    const k = (t - e.start) / (e.dur || 3);
    if (k < 0) return true;
    if (e.kind === 'sleigh') {
      if (k > 1) return false;
      const px = e.dir > 0 ? -60 + k * (W + 120) : W + 60 - k * (W + 120);
      const py = e.y + Math.sin(k * 6) * 4;
      x.save();
      if (e.dir < 0) { x.translate(Math.round(px), 0); x.scale(-1, 1); x.translate(-Math.round(px), 0); }
      const fr = Math.floor(t * 6) % 2;
      if (!e.only) x.drawImage(sleigh(), Math.round(px) - 36, Math.round(py) - 8);
      for (let i = 0; i < 4; i++) x.drawImage(reindeer((fr + i) % 2, i === 3), Math.round(px) + i * 18, Math.round(py) - 4 + (i % 2));
      x.restore();
      if (Math.random() < 0.7) parts.push({ kind: 'spark', x: px - e.dir * 30, y: py + 6, life: rnd(0.5, 1.3), col: [C.y, C.w][Math.floor(Math.random() * 2)] });
      return true;
    }
    if (e.kind === 'shoot') {
      if (k > 1) return false;
      for (let i = 0; i < 8; i++) { x.fillStyle = i === 0 ? '#fff' : `rgba(255,240,200,${0.8 - i * 0.1})`; x.fillRect(Math.round(e.x + k * 50 - i * 2), Math.round(e.y + k * 25 - i), 1, 1); }
      return true;
    }
    if (e.kind === 'firework') {
      if (!e.done) {
        e.done = true;
        for (let i = 0; i < 28; i++) { const a = (i / 28) * 6.28; parts.push({ kind: 'fw', x: e.x, y: e.y, vx: Math.cos(a) * rnd(18, 30), vy: Math.sin(a) * rnd(18, 30), life: rnd(1, 1.6), col: e.col }); }
      }
      return false;
    }
    return false;
  });

  x.drawImage(groundLayer, 0, 0);
  // ventanas que titilan
  for (const w of windows) {
    const b = Math.sin(t * 2 + w.ph) > -0.6;
    x.fillStyle = b ? '#ffd86b' : '#e8a640'; x.fillRect(w.x, w.y, 3, 3);
    x.fillStyle = '#5a3420'; x.fillRect(w.x + 1, w.y, 1, 3); x.fillRect(w.x, w.y + 1, 3, 1);
  }

  // partículas
  parts = parts.filter((p) => {
    if (p.kind === 'smokeSrc') {
      p.next -= dt; if (p.next <= 0) { p.next = rnd(0.6, 1.4); parts.push({ kind: 'smoke', x: p.x, y: p.y, life: 3, vy: -4 }); }
      return true;
    }
    p.life -= dt; if (p.life <= 0) return false;
    if (p.kind === 'smoke') { p.y += p.vy * dt; p.x += Math.sin(p.life * 2) * 0.1; x.fillStyle = `rgba(200,205,230,${p.life / 6})`; x.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
    if (p.kind === 'spark') { x.fillStyle = p.col; const s = p.life > 0.4 ? 1 : 0; x.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); if (s && Math.sin(p.life * 20) > 0) { x.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); x.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); } }
    if (p.kind === 'fw' || p.kind === 'conf') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 30 * dt; p.vx *= 0.98; x.fillStyle = p.col; x.fillRect(Math.round(p.x), Math.round(p.y), p.kind === 'conf' ? 2 : 1, 1); }
    if (p.kind === 'heart') { p.y += p.vy * dt; p.x += Math.sin(p.life * 3) * 0.3; drawHeart(Math.round(p.x), Math.round(p.y)); }
    if (p.kind === 'balloon') { p.y += p.vy * dt; p.x += Math.sin(p.life * 2) * 0.2; x.fillStyle = p.col; x.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 3, 5, 6); x.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 4, 3, 8); x.fillStyle = '#fff'; x.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 2, 1, 1); x.fillStyle = '#ccc'; x.fillRect(Math.round(p.x), Math.round(p.y) + 4, 1, 6); }
    return true;
  });

  // nieve
  snowBoost = Math.max(0, snowBoost - dt);
  const extra = snowBoost > 0 ? 2.5 : 1;
  for (const f of flakes) {
    f.y += f.vy * dt * extra; f.x += (f.vx + Math.sin(t + f.ph) * 4) * dt * extra;
    if (f.y > H + 2 || f.x < -12 || f.x > W + 12) Object.assign(f, newFlake(false));
    x.fillStyle = f.big ? '#ffffff' : '#c6d2ff';
    x.fillRect(Math.round(f.x), Math.round(f.y), f.big ? 2 : 1, f.big ? 2 : 1);
  }
  if (snowBoost > 0 && Math.random() < 0.8) for (let i = 0; i < 3; i++) flakes.push(newFlake(false));
  if (flakes.length > (W * H) / 120 && snowBoost <= 0) flakes.splice(0, 2);
}

function drawHeart(px, py) {
  x.fillStyle = '#ff5c7a';
  x.fillRect(px - 2, py, 2, 1); x.fillRect(px + 1, py, 2, 1);
  x.fillRect(px - 3, py + 1, 7, 2); x.fillRect(px - 2, py + 3, 5, 1); x.fillRect(px - 1, py + 4, 3, 1); x.fillRect(px, py + 5, 1, 1);
}
