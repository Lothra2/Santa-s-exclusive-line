// Elfos y Santa con animaciones: respirar, parpadear, hablar, saludar, saltar, bailar, piruetas.
import { elf, santa } from './sprites.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export class ElfActor {
  constructor(id, x, y) {
    this.id = id; this.x = x; this.y = y; this.baseX = x;
    this.t = rnd(0, 10); this.action = null; this.at = 0; this.talking = false;
    this.nextBlink = rnd(1, 4); this.blinkT = 0; this.mouth = 0; this.mouthT = 0;
    this.nextIdle = rnd(3, 7); this.hearts = []; this.flip = 1; this.highlight = false; this.dim = false;
    this.facing = 1; this.look = 0; this.nextLook = rnd(1, 3);
    this.wander = 0; // cuántos pixeles puede caminar a cada lado de su casa (0 = no camina)
    this.walkTo = null; this.sparkles = [];
  }
  do(action) { this.action = action; this.at = 0; if (action !== 'walk') this.walkTo = null; }
  walk(tx) { this.walkTo = Math.round(tx); this.do('walk'); this.walkTo = Math.round(tx); }
  update(dt) {
    this.t += dt; this.at += dt;
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) { this.blinkT = 0.13; this.nextBlink = Math.random() < 0.2 ? 0.25 : rnd(2, 5); }
    this.blinkT = Math.max(0, this.blinkT - dt);
    // mira a los lados de vez en cuando
    this.nextLook -= dt;
    if (this.nextLook <= 0) { this.look = this.talking ? 0 : [0, 0, -1, 1][Math.floor(Math.random() * 4)]; this.nextLook = rnd(1.2, 3.5); }
    if (this.talking) { this.mouthT -= dt; if (this.mouthT <= 0) { this.mouth = [0, 1, 2, 1][Math.floor(Math.random() * 4)]; this.mouthT = rnd(0.07, 0.14); } }
    else this.mouth = 0;
    // caminar
    if (this.action === 'walk' && this.walkTo != null) {
      const d = this.walkTo - this.x;
      this.facing = d < 0 ? -1 : 1;
      const step = Math.sign(d) * Math.min(Math.abs(d), 20 * dt);
      this.x += step;
      if (Math.abs(this.walkTo - this.x) < 0.5) { this.x = this.walkTo; this.walkTo = null; this.action = null; if (Math.random() < 0.5) this.do('wave'); }
    }
    if (!this.action && !this.talking) {
      this.nextIdle -= dt;
      if (this.nextIdle <= 0) {
        const opts = ['wave', 'hop', 'look', 'clap', 'spin'];
        if (this.wander) opts.push('walk', 'walk', 'walk');
        const pick = opts[Math.floor(Math.random() * opts.length)];
        if (pick === 'walk') this.walk(this.baseX + rnd(-this.wander, this.wander)); else this.do(pick);
        this.nextIdle = rnd(3, 8);
      }
    }
    this.hearts = this.hearts.filter((h) => (h.life -= dt) > 0);
    this.sparkles = this.sparkles.filter((s) => (s.life -= dt) > 0);
  }
  heart() { for (let i = 0; i < 3; i++) this.hearts.push({ x: rnd(-8, 8), life: 1.4 + i * 0.25, d: i * 0.25 }); }
  sparkle() { for (let i = 0; i < 10; i++) this.sparkles.push({ x: rnd(-14, 14), y: rnd(-50, -6), life: rnd(0.4, 1) }); }
  // Calcula la pose del cuadro actual
  pose() {
    const st = { blink: this.blinkT > 0, mouth: this.mouth, aL: undefined, aR: undefined, legs: 0, look: this.look };
    // respiración: un pixel de subida suave y brazos que se mecen
    let dx = 0, dy = Math.sin(this.t * 2.2) > 0.55 ? -1 : 0, rot = 0, sx = 1, sy = 1;
    const def = { scarf: 25, stripe: 70, green: 45 }[this.id];
    const sway = Math.round(Math.sin(this.t * 2) * 1.5) * 4;
    st.aL = def + sway; st.aR = def - sway;
    const a = this.action, k = this.at;
    if (a === 'wave') {
      st.aR = Math.floor(k * 7) % 2 ? 150 : 125; st.look = 0;
      if (k > 1.6) this.action = null;
    } else if (a === 'walk') {
      const ph = Math.floor(this.t * 9) % 2;
      st.legs = ph ? 1 : -1; dy = -(ph); st.aL = def + (ph ? 20 : -10); st.aR = def + (ph ? -10 : 20); st.look = 0;
    } else if (a === 'hop' || a === 'flip') {
      const D = a === 'flip' ? 0.8 : 0.55, H = a === 'flip' ? 16 : 9;
      if (k < 0.12) { sy = 0.86; sx = 1.1; }
      else if (k < 0.12 + D) { const q = (k - 0.12) / D; dy -= Math.round(Math.sin(q * Math.PI) * H); st.aL = st.aR = 150; st.legs = 1; if (a === 'flip') rot = q * Math.PI * 2 * this.flip; }
      else if (k < 0.3 + D) { sy = 0.88; sx = 1.08; }
      else this.action = null;
    } else if (a === 'dance') {
      const beat = Math.floor(k / 0.28);
      dx = beat % 2 ? 2 : -2; st.aL = beat % 2 ? 160 : 40; st.aR = beat % 2 ? 40 : 160; st.legs = beat % 2 ? 1 : -1;
      dy -= beat % 4 === 3 ? 3 : 0;
      if (beat % 4 === 2) this.facing = -1; else if (beat % 4 === 0) this.facing = 1;
      if (k > 3.2) { this.action = null; this.facing = 1; }
    } else if (a === 'clap') {
      const c = Math.floor(k * 8) % 2;
      st.aL = st.aR = c ? 100 : 130; dy -= c; st.look = 0;
      if (k > 1.3) this.action = null;
    } else if (a === 'spin') {
      // gira mostrando un lado y el otro, con saltito
      this.facing = Math.floor(k * 10) % 2 ? -1 : 1;
      dy -= Math.round(Math.sin(Math.min(1, k / 0.7) * Math.PI) * 5);
      st.aL = st.aR = 140;
      if (k > 0.7) { this.action = null; this.facing = 1; }
    } else if (a === 'shiver') {
      dx = Math.floor(k * 30) % 2 ? 1 : -1; st.aL = st.aR = 8;
      if (k > 1.4) this.action = null;
    } else if (a === 'cheer') {
      st.aL = st.aR = 160; dy -= Math.round(Math.abs(Math.sin(k * 7)) * 5);
      if (k > 1.5) this.action = null;
    } else if (a === 'look') {
      st.look = k < 0.8 ? -1 : k < 1.6 ? 1 : 0;
      if (k > 2) this.action = null;
    } else if (a === 'walkIn') {
      const q = Math.min(1, k / 1.2);
      dx = Math.round((1 - q) * this.walkFrom); st.legs = Math.floor(k * 8) % 2 ? 1 : -1; dy -= Math.floor(k * 8) % 2;
      if (k > 1.2) this.action = null;
    }
    if (this.talking && !a) { dy -= Math.floor(this.t * 6) % 2; st.look = 0; }
    return { st, dx, dy, rot, sx, sy };
  }
  draw(ctx, scale = 1) {
    const { st, dx, dy, rot, sx, sy } = this.pose();
    const img = elf(this.id, st);
    ctx.save();
    ctx.translate(Math.round(this.x + dx), Math.round(this.y + dy));
    // sombra que se achica al saltar
    if (!this.noShadow) { const sw = Math.max(10, 20 + dy); ctx.fillStyle = 'rgba(20,10,30,0.35)'; ctx.fillRect(-sw / 2 * scale, (-1 - dy) * scale, sw * scale, 2 * scale); }
    if (this.highlight) {
      ctx.fillStyle = 'rgba(255,230,120,0.18)';
      ctx.beginPath(); ctx.ellipse(0, -img.height * scale / 2, img.width * scale * 0.7, img.height * scale * 0.62, 0, 0, 7); ctx.fill();
    }
    if (rot) { ctx.translate(0, -img.height * scale / 2); ctx.rotate(rot); ctx.translate(0, img.height * scale / 2); }
    ctx.scale(sx * scale * this.facing, sy * scale);
    if (this.dim) ctx.globalAlpha = 0.55;
    ctx.drawImage(img, -Math.round(img.width / 2), -img.height + 2);
    ctx.restore();
    // corazones y chispitas
    for (const h of this.hearts) {
      const life = h.life;
      if (life > 1.4) continue;
      const hx = Math.round(this.x + h.x * scale), hy = Math.round(this.y - (56 + (1.4 - life) * 22) * scale);
      drawHeart(ctx, hx, hy, scale);
    }
    for (const s of this.sparkles) {
      ctx.fillStyle = s.life > 0.5 ? '#fff6b0' : '#ffd23f';
      const px = Math.round(this.x + s.x * scale), py = Math.round(this.y + (s.y - (1 - s.life) * 6) * scale);
      ctx.fillRect(px, py, scale, scale); if (s.life > 0.6) { ctx.fillRect(px - scale, py, 3 * scale, scale); ctx.fillRect(px, py - scale, scale, 3 * scale); }
    }
  }
  bounds(scale = 1) { return { x: this.x - 18 * scale, y: this.y - 54 * scale, w: 36 * scale, h: 56 * scale }; }
}

export function drawHeart(ctx, x, y, s = 1) {
  ctx.fillStyle = '#ff5c7a';
  const r = (a, b, w, h) => ctx.fillRect(x + a * s, y + b * s, w * s, h * s);
  r(-2, 0, 2, 1); r(1, 0, 2, 1); r(-3, 1, 7, 2); r(-2, 3, 5, 1); r(-1, 4, 3, 1); r(0, 5, 1, 1);
}

export class SantaActor {
  constructor(x, y) {
    this.x = x; this.y = y; this.t = 0; this.talking = false; this.mouth = 0; this.mouthT = 0;
    this.blinkT = 0; this.nextBlink = 2; this.action = null; this.at = 0; this.arms = 'belly';
    this.twinkleT = 0;
  }
  do(a) { this.action = a; this.at = 0; }
  update(dt) {
    this.t += dt; this.at += dt;
    this.nextBlink -= dt; if (this.nextBlink <= 0) { this.blinkT = 0.15; this.nextBlink = rnd(2.5, 5); }
    this.blinkT = Math.max(0, this.blinkT - dt);
    this.twinkleT = Math.max(0, this.twinkleT - dt);
    if (this.talking) { this.mouthT -= dt; if (this.mouthT <= 0) { this.mouth = [0, 1, 2, 1, 1][Math.floor(Math.random() * 5)]; this.mouthT = rnd(0.08, 0.16); } }
    else this.mouth = 0;
  }
  draw(ctx, scale = 1) {
    const a = this.action, k = this.at;
    const st = { blink: this.blinkT > 0, mouth: this.mouth, arms: this.arms, twinkle: this.twinkleT > 0, pom: Math.round(Math.sin(this.t * 1.6) * 1) };
    let dy = Math.round(Math.sin(this.t * 1.8) * 0.7);
    if (a === 'laugh') {
      st.laugh = true; st.arms = 'up'; st.bounce = Math.floor(k * 8) % 2; dy -= st.bounce;
      if (k > 1.8) this.action = null;
    } else if (a === 'wave') {
      st.wave = Math.floor(k * 5) % 2 ? 1 : 2; st.arms = 'belly';
      if (k > 2) this.action = null;
    } else if (a === 'wink') {
      this.twinkleT = 0.6; this.action = null;
    }
    if (this.talking) st.bounce = st.bounce || (Math.floor(this.t * 4) % 2);
    const img = santa(st);
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y + dy * scale));
    ctx.scale(scale, scale);
    ctx.drawImage(img, -Math.round(img.width / 2), -img.height);
    ctx.restore();
  }
}
