// Mini motor de pixel art: dibuja en una grilla de colores y la convierte en canvas con contorno.
export const PAL = {
  k: '#2a1424', // contorno
  g: '#43b047', G: '#26802f', l: '#8fdc63',
  w: '#fdf9f0', W: '#d4ccc0',
  s: '#f8dcc2', S: '#e8b892', n: '#f3cdb0',
  h: '#5d3520', H: '#3a2012',
  r: '#e03a3a', R: '#a11f2a', q: '#ff7a6e',
  y: '#ffd23f', Y: '#d39a1a',
  b: '#1d1622', B: '#3a3346',
  p: '#f59ab4', P: '#fbcbd8',
  u: '#4a8ad8', U: '#2c5aa0', c: '#9ad8ff',
  o: '#c97a3c', O: '#8a4c22', t: '#e7a35c',
  v: '#9a5cd8', m: '#6e3aa8',
};

const rgbCache = {};
function rgb(hex) {
  if (rgbCache[hex]) return rgbCache[hex];
  const n = parseInt(hex.slice(1), 16);
  return (rgbCache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]);
}

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Array(w * h).fill(null); }
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = c;
  }
  get(x, y) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null; return this.d[y * this.w + x]; }
  rect(x, y, w, h, c) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, typeof c === 'function' ? c(x + i, y + j, i, j) : c);
  }
  // Elipse rellena dentro de la caja (x,y,w,h). c puede ser función (px,py,nx,ny) con nx,ny en -1..1
  ell(x, y, w, h, c) {
    const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2;
    for (let py = Math.floor(y); py < y + h; py++) for (let px = Math.floor(x); px < x + w; px++) {
      const nx = (px + 0.5 - cx) / rx, ny = (py + 0.5 - cy) / ry;
      if (nx * nx + ny * ny <= 1.02) this.set(px, py, typeof c === 'function' ? c(px, py, nx, ny) : c);
    }
  }
  line(x0, y0, x1, y1, c, t = 1) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let e = dx + dy, i = 0;
    for (;;) {
      const col = typeof c === 'function' ? c(x0, y0, i++) : c;
      this.set(x0, y0, col);
      if (t > 1) { this.set(x0 + 1, y0, col); this.set(x0, y0 + 1, col); this.set(x0 + 1, y0 + 1, col); }
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * e;
      if (e2 >= dy) { e += dy; x0 += sx; }
      if (e2 <= dx) { e += dx; y0 += sy; }
    }
  }
  tri(ax, ay, bx, by, cx, cy, c) {
    const minx = Math.floor(Math.min(ax, bx, cx)), maxx = Math.ceil(Math.max(ax, bx, cx));
    const miny = Math.floor(Math.min(ay, by, cy)), maxy = Math.ceil(Math.max(ay, by, cy));
    const area = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
    for (let py = miny; py <= maxy; py++) for (let px = minx; px <= maxx; px++) {
      const x = px + 0.5, y = py + 0.5;
      const w0 = ((bx - x) * (cy - y) - (cx - x) * (by - y)) / area;
      const w1 = ((cx - x) * (ay - y) - (ax - x) * (cy - y)) / area;
      const w2 = 1 - w0 - w1;
      if (w0 >= -0.02 && w1 >= -0.02 && w2 >= -0.02) this.set(px, py, typeof c === 'function' ? c(px, py) : c);
    }
  }
  // Pinta un mapa de texto. Cada carácter es una clave de PAL; '.' o ' ' es transparente.
  map(x, y, rows, pal = PAL) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.' && ch !== ' ') this.set(x + i, y + j, pal[ch] || ch); } });
  }
  // Devuelve una copia con margen (para que el contorno no se corte)
  pad(t = 2, l = 0, b = 1, r = 0) {
    const q = new Pix(this.w + l + r, this.h + t + b);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) q.d[(y + t) * q.w + x + l] = this.d[y * this.w + x];
    return q;
  }
  toCanvas(outline = PAL.k) {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    const out = this.d.slice();
    if (outline) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
        if (this.d[y * this.w + x]) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) out[y * this.w + x] = outline;
      }
    }
    for (let i = 0; i < out.length; i++) {
      if (!out[i]) continue;
      const [r, g, b] = rgb(out[i]);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// Sombreado simple: luz desde arriba a la izquierda.
export const shade = (base, dark, light) => (px, py, nx, ny) => {
  if (nx + ny * 0.6 > 0.55) return dark;
  if (light && nx + ny < -0.9) return light;
  return base;
};

// Sombra suave para caras
export const soft = (base, dark) => (px, py, nx, ny) => (nx > 0.62 && ny > -0.6 ? dark : base);

// Convierte un canvas chico en dataURL escalado (para usar en <img> o CSS)
export function toURL(cv, scale = 1) {
  if (scale === 1) return cv.toDataURL();
  const c = document.createElement('canvas');
  c.width = cv.width * scale; c.height = cv.height * scale;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.drawImage(cv, 0, 0, c.width, c.height);
  return c.toDataURL();
}
