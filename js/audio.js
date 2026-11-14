// Música chiptune, efectos y voces. Todo sintetizado en el navegador.
let ctx = null, master = null, musicBus = null, sfxBus = null;
let muted = false;
let current = null; // canción sonando

const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, Bb: 10, B: 11 };
function freq(n) {
  if (!n || n === 'R') return 0;
  const m = n.match(/^([A-G][#b]?)(\d)$/);
  const midi = (+m[2] + 1) * 12 + NOTE[m[1]];
  return 440 * Math.pow(2, (midi - 69) / 12);
}
const midiOf = (n) => { const m = n.match(/^([A-G][#b]?)(\d)$/); return (+m[2] + 1) * 12 + NOTE[m[1]]; };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

export function unlock() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 1; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 0.9; sfxBus.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  // iOS: hablar algo vacío desbloquea la voz
  try { if (window.speechSynthesis && !unlock.spoke) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); unlock.spoke = true; } } catch (e) {}
}

export function setMuted(m) {
  muted = m;
  if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.05);
  if (m) stopVoice();
}
export const isMuted = () => muted;

/* ---------- Instrumentos ---------- */
function tone(f, t, dur, { type = 'square', vol = 0.1, bus = musicBus, attack = 0.005, release = 0.06, slide = 0, vib = 0 } = {}) {
  if (!ctx || !f) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  if (vib) {
    const l = ctx.createOscillator(), lg = ctx.createGain();
    l.frequency.value = 6; lg.gain.value = f * 0.012 * vib; l.connect(lg); lg.connect(o.frequency);
    l.start(t + 0.08); l.stop(t + dur + release);
  }
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.setValueAtTime(vol, t + Math.max(attack, dur - 0.02));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
  o.connect(g); g.connect(bus);
  o.start(t); o.stop(t + dur + release + 0.02);
}

let noiseBuf = null;
function noise(t, dur, { vol = 0.1, bus = sfxBus, hp = 6000, bp = 0, q = 1 } = {}) {
  if (!ctx) return;
  if (!noiseBuf) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ctx.createBiquadFilter();
  if (bp) { f.type = 'bandpass'; f.frequency.value = bp; f.Q.value = q; } else { f.type = 'highpass'; f.frequency.value = hp; }
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(bus);
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

// Campanita de trineo
function sleighBell(t, vol = 0.05, bus = musicBus) {
  noise(t, 0.12, { vol: vol * 0.8, bus, bp: 9000, q: 3 });
  tone(4200 + Math.random() * 300, t, 0.05, { type: 'sine', vol: vol * 0.5, bus, release: 0.12 });
  tone(6100, t + 0.01, 0.04, { type: 'sine', vol: vol * 0.3, bus, release: 0.1 });
}
// Campana tipo cajita de música
function bell(f, t, dur, vol = 0.08, bus = musicBus) {
  tone(f, t, 0.02, { type: 'sine', vol, bus, release: dur });
  tone(f * 2.01, t, 0.02, { type: 'sine', vol: vol * 0.35, bus, release: dur * 0.6 });
  tone(f * 3.98, t, 0.02, { type: 'sine', vol: vol * 0.12, bus, release: dur * 0.3 });
}

/* ---------- Canciones de dominio público ---------- */
// [nota, tiempos]. Un tiempo = negra.
const q = 1, e = 0.5, h = 2, w = 4, dq = 1.5, dh = 3, s16 = 0.25, de = 0.75;
const DUR = { q, e, h, w, dq, dh, s16, de };
const N = (str) => str.trim().split(/\s+/).map((tok) => { const [n, d] = tok.split(':'); return [n, DUR[d]]; });

export const SONGS = {
  jingle: {
    bpm: 168, beats: 4, transpose: 12, bells: true, lead: 'square', chords: 'C C C C F C D G C C C C F C G C',
    notes: N(`E4:q E4:q E4:h E4:q E4:q E4:h E4:q G4:q C4:dq D4:e E4:w
      F4:q F4:q F4:dq F4:e F4:q E4:q E4:q E4:e E4:e E4:q D4:q D4:q E4:q D4:h G4:h
      E4:q E4:q E4:h E4:q E4:q E4:h E4:q G4:q C4:dq D4:e E4:w
      F4:q F4:q F4:q F4:q F4:q E4:q E4:q E4:e E4:e G4:q G4:q F4:q D4:q C4:w`),
  },
  deck: {
    bpm: 132, beats: 4, transpose: 12, bells: true, lead: 'square', chords: 'C C G C C C G C G C G G C C F C',
    notes: N(`G4:dq F4:e E4:q D4:q C4:q D4:q E4:q C4:q D4:e E4:e F4:e D4:e E4:dq D4:e C4:q B3:q C4:h
      G4:dq F4:e E4:q D4:q C4:q D4:q E4:q C4:q D4:e E4:e F4:e D4:e E4:dq D4:e C4:q B3:q C4:h
      D4:dq E4:e F4:q D4:q E4:dq F4:e G4:q D4:q E4:e F#4:e G4:q A4:e B4:e C5:q B4:q A4:q G4:h
      G4:dq F4:e E4:q D4:q C4:q D4:q E4:q C4:q A4:e A4:e A4:e A4:e G4:dq F4:e E4:q D4:q C4:h`),
  },
  wish: {
    bpm: 150, beats: 3, transpose: 12, bells: true, lead: 'square', chords: 'C C F D G E F G C',
    notes: N(`R:h G3:q C4:q C4:e D4:e C4:e B3:e A3:q A3:q A3:q D4:q D4:e E4:e D4:e C4:e B3:q G3:q G3:q
      E4:q E4:e F4:e E4:e D4:e C4:q A3:q G3:e G3:e A3:q D4:q B3:q C4:h R:q`),
  },
  birthday: {
    bpm: 120, beats: 3, transpose: 0, bells: false, lead: 'square', chords: 'C C G G C C F G C',
    notes: N(`R:h G4:de G4:s16 A4:q G4:q C5:q B4:h G4:de G4:s16 A4:q G4:q D5:q C5:h G4:de G4:s16
      G5:q E5:q C5:q B4:q A4:q F5:de F5:s16 E5:q C5:q D5:q C5:h R:q`),
  },
  silent: {
    bpm: 84, beats: 3, transpose: 12, bells: false, box: true, chords: 'C C C C G G C C F F C C F F C C G G C C C G C C',
    notes: N(`G4:dq A4:e G4:q E4:dh G4:dq A4:e G4:q E4:dh D5:h D5:q B4:dh C5:h C5:q G4:dh
      A4:h A4:q C5:dq B4:e A4:q G4:dq A4:e G4:q E4:dh A4:h A4:q C5:dq B4:e A4:q G4:dq A4:e G4:q E4:dh
      D5:h D5:q F5:dq D5:e B4:q C5:dh E5:dh C5:dq G4:e E4:q G4:dq F4:e D4:q C4:dh R:dh`),
  },
};

const CHORD = { C: [0, 4, 7], F: [5, 9, 12], G: [7, 11, 14], D: [2, 6, 9], E: [4, 8, 11], A: [9, 12, 16] };

function scheduleSong(song, t0, bus) {
  const spb = 60 / song.bpm;
  let t = t0, beat = 0;
  const tr = song.transpose || 0;
  for (const [n, d] of song.notes) {
    const dur = d * spb;
    if (n !== 'R') {
      const f = mtof(midiOf(n) + tr);
      if (song.box) bell(f, t, Math.min(1.6, dur * 1.4), 0.07, bus);
      else {
        tone(f, t, dur * 0.85, { type: song.lead || 'square', vol: 0.045, bus, vib: d >= 2 ? 1 : 0 });
        tone(f * 2, t, dur * 0.5, { type: 'triangle', vol: 0.015, bus });
      }
    }
    t += dur; beat += d;
  }
  const total = beat;
  // bajo y armonía por compás
  const chords = song.chords.split(' ');
  const bars = Math.ceil(total / song.beats);
  for (let b = 0; b < bars; b++) {
    const ch = CHORD[chords[b % chords.length]] || CHORD.C;
    const root = 48;
    for (let k = 0; k < song.beats; k++) {
      const bt = t0 + (b * song.beats + k) * spb;
      if (b * song.beats + k >= total) break;
      if (song.box) {
        if (k === 0) bell(mtof(root + ch[0]), bt, 2, 0.04, bus);
        if (k === 1 || k === 2) bell(mtof(root + 12 + ch[k]), bt, 0.8, 0.02, bus);
      } else {
        const bn = k % 2 === 0 ? ch[0] : ch[2];
        tone(mtof(root + bn), bt, spb * 0.45, { type: 'triangle', vol: 0.12, bus });
        if (k % 2 === 1 || song.beats === 3) tone(mtof(root + 12 + ch[1]), bt, spb * 0.25, { type: 'square', vol: 0.014, bus });
        if (song.bells) { sleighBell(bt, 0.035, bus); sleighBell(bt + spb / 2, 0.02, bus); }
      }
    }
  }
  return total * spb;
}

export function playSong(name, { loop = true, vol = 1 } = {}) {
  if (!ctx) return;
  if (current && current.name === name) return;
  stopSong();
  const song = SONGS[name];
  const bus = ctx.createGain(); bus.gain.value = vol; bus.connect(musicBus);
  const me = { name, bus, timer: null, stopped: false };
  current = me;
  const run = (t0) => {
    if (me.stopped) return;
    const len = scheduleSong(song, t0, bus);
    if (loop) me.timer = setTimeout(() => run(t0 + len + 0.6), (t0 + len - ctx.currentTime - 1.5) * 1000);
  };
  run(ctx.currentTime + 0.1);
}

export function stopSong(fade = 0.4) {
  if (!current) return;
  const c = current; current = null; c.stopped = true; clearTimeout(c.timer);
  c.bus.gain.setTargetAtTime(0, ctx.currentTime, fade / 3);
  setTimeout(() => c.bus.disconnect(), fade * 1000 + 300);
}
export const currentSong = () => current && current.name;

// Bajar la música mientras alguien habla
export function duck(on) {
  if (!musicBus) return;
  musicBus.gain.setTargetAtTime(on ? 0.15 : 0.55, ctx.currentTime, 0.15);
}

/* ---------- Efectos ---------- */
export const sfx = {
  tap() { if (!ctx) return; const t = ctx.currentTime; tone(880, t, 0.04, { vol: 0.06, bus: sfxBus }); tone(1320, t + 0.04, 0.05, { vol: 0.05, bus: sfxBus }); },
  pop() { if (!ctx) return; const t = ctx.currentTime; tone(300, t, 0.08, { type: 'square', vol: 0.08, bus: sfxBus, slide: 3 }); },
  blip(pitch = 1) { if (!ctx) return; const t = ctx.currentTime; tone(520 * pitch * (0.9 + Math.random() * 0.25), t, 0.035, { type: 'square', vol: 0.035, bus: sfxBus }); },
  sparkle() {
    if (!ctx) return; const t = ctx.currentTime;
    [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => bell(mtof(84 + n), t + i * 0.05, 0.4, 0.04, sfxBus));
  },
  fanfare() {
    if (!ctx) return; const t = ctx.currentTime;
    [[60, 0, 0.12], [64, 0.12, 0.12], [67, 0.24, 0.12], [72, 0.36, 0.5]].forEach(([m, d, l]) => {
      tone(mtof(m + 12), t + d, l, { vol: 0.07, bus: sfxBus, vib: l > 0.3 ? 1 : 0 });
      tone(mtof(m), t + d, l, { type: 'triangle', vol: 0.1, bus: sfxBus });
    });
    for (let i = 0; i < 6; i++) sleighBell(t + 0.36 + i * 0.08, 0.05, sfxBus);
  },
  unwrap() {
    if (!ctx) return; const t = ctx.currentTime;
    for (let i = 0; i < 5; i++) noise(t + i * 0.07, 0.08, { vol: 0.12, bp: 2500 + i * 600, q: 0.8 });
    tone(200, t + 0.35, 0.3, { type: 'square', vol: 0.06, bus: sfxBus, slide: 4 });
    setTimeout(() => sfx.sparkle(), 450);
  },
  jingle() { if (!ctx) return; const t = ctx.currentTime; for (let i = 0; i < 10; i++) sleighBell(t + i * 0.06 + Math.random() * 0.03, 0.07, sfxBus); },
  whoosh() { if (!ctx) return; const t = ctx.currentTime; noise(t, 0.5, { vol: 0.08, bp: 800, q: 0.5 }); },
  locked() { if (!ctx) return; const t = ctx.currentTime; tone(220, t, 0.1, { type: 'square', vol: 0.05, bus: sfxBus }); tone(196, t + 0.12, 0.15, { type: 'square', vol: 0.05, bus: sfxBus }); },
  hop() { if (!ctx) return; const t = ctx.currentTime; tone(400, t, 0.12, { type: 'square', vol: 0.05, bus: sfxBus, slide: 2.2 }); },
  key(i) {
    // tonos DTMF
    if (!ctx) return; const t = ctx.currentTime;
    const rows = [697, 770, 852, 941], cols = [1209, 1336, 1477];
    const d = [[3, 1], [0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]][i % 10];
    tone(rows[d[0]], t, 0.12, { type: 'sine', vol: 0.06, bus: sfxBus }); tone(cols[d[1]], t, 0.12, { type: 'sine', vol: 0.06, bus: sfxBus });
  },
  ring() {
    if (!ctx) return; const t = ctx.currentTime;
    for (let i = 0; i < 2; i++) { tone(440, t + i * 0.5, 0.4, { type: 'sine', vol: 0.05, bus: sfxBus }); tone(480, t + i * 0.5, 0.4, { type: 'sine', vol: 0.05, bus: sfxBus }); }
  },
  bellRing() {
    // timbre del teléfono antiguo
    if (!ctx) return; const t = ctx.currentTime;
    for (let i = 0; i < 16; i++) { tone(1250, t + i * 0.05, 0.03, { type: 'square', vol: 0.03, bus: sfxBus }); tone(1700, t + i * 0.05 + 0.025, 0.03, { type: 'square', vol: 0.02, bus: sfxBus }); }
  },
  static(dur = 1.2) {
    if (!ctx) return; const t = ctx.currentTime;
    noise(t, dur, { vol: 0.06, hp: 1500 });
    for (let i = 0; i < 8; i++) tone(200 + Math.random() * 1800, t + Math.random() * dur, 0.05, { type: 'sawtooth', vol: 0.015, bus: sfxBus });
  },
  connect() {
    if (!ctx) return; const t = ctx.currentTime;
    [72, 76, 79, 84, 88].forEach((m, i) => bell(mtof(m), t + i * 0.09, 0.8, 0.06, sfxBus));
    for (let i = 0; i < 8; i++) sleighBell(t + 0.45 + i * 0.07, 0.05, sfxBus);
  },
  hoho() {
    if (!ctx) return; const t = ctx.currentTime;
    [0, 0.35, 0.7].forEach((d) => tone(110, t + d, 0.25, { type: 'sawtooth', vol: 0.05, bus: sfxBus, slide: 0.8 }));
  },
};

/* ---------- Voces ---------- */
let voices = [];
function loadVoices() { try { voices = speechSynthesis.getVoices() || []; } catch (e) { voices = []; } }
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function pickVoice(lang, prefer) {
  if (!voices.length) loadVoices();
  const pre = lang === 'es' ? 'es' : 'en';
  const list = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(pre));
  if (!list.length) return null;
  const score = (v) => {
    let s = 0; const n = v.name.toLowerCase();
    if (/premium|enhanced|natural|neural/.test(n)) s += 5;
    if (pre === 'es' && /(es-mx|es-us|es-419|es-ve|es-co)/i.test(v.lang)) s += 3;
    if (pre === 'en' && /en-us/i.test(v.lang)) s += 2;
    if (prefer === 'male' && /(jorge|diego|juan|carlos|daniel|alex|fred|david|male|thomas|aaron|rocko|grandpa|reed)/.test(n)) s += 4;
    if (prefer === 'female' && /(paulina|monica|mónica|samantha|karen|victoria|female|soledad|angelica|helena|ava|allison|sandy|flo)/.test(n)) s += 4;
    if (/google/.test(n)) s += 1;
    return s;
  };
  return list.sort((a, b) => score(b) - score(a))[0];
}

let speaking = null;
let audioEl = null;
export function stopVoice() {
  try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {}
  if (audioEl) { audioEl.pause(); audioEl = null; }
  if (speaking) { const s = speaking; speaking = null; s.done && s.done(); }
  duck(false);
}

// profiles: elfos con voz aguda, Santa con voz grave
export const VOICE = {
  scarf: { pitch: 1.55, rate: 1.05, prefer: 'male', blip: 1.3 },
  stripe: { pitch: 1.85, rate: 1.12, prefer: 'female', blip: 1.6 },
  green: { pitch: 1.4, rate: 1.0, prefer: 'female', blip: 1.15 },
  santa: { pitch: 0.55, rate: 0.86, prefer: 'male', blip: 0.5 },
  narrator: { pitch: 1.2, rate: 1.0, prefer: 'female', blip: 1 },
};

/**
 * Habla un texto. Si hay un archivo de audio pregrabado lo usa. Si no, la voz del navegador.
 * onBoundary se llama mientras habla (para mover la boca). Devuelve una promesa al terminar.
 */
export function speak(text, { who = 'narrator', lang = 'es', file = null, onStart, onTick } = {}) {
  stopVoice();
  return new Promise((resolve) => {
    const clean = String(text).replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/\*/g, '').trim();
    const me = { done: resolve };
    speaking = me;
    let tick = null;
    const finish = () => { clearInterval(tick); if (speaking === me) speaking = null; duck(false); resolve(); };
    me.done = () => { clearInterval(tick); resolve(); };
    if (muted || !clean) {
      // sin sonido: igual animamos un rato proporcional al texto
      onStart && onStart();
      tick = setInterval(() => onTick && onTick(), 120);
      setTimeout(finish, Math.min(6000, 400 + clean.length * 45));
      return;
    }
    duck(true);
    if (file) {
      audioEl = new Audio(file);
      audioEl.onplay = () => { onStart && onStart(); tick = setInterval(() => onTick && onTick(), 110); };
      audioEl.onended = finish; audioEl.onerror = () => { audioEl = null; viaSynth(); };
      audioEl.play().catch(() => { audioEl = null; viaSynth(); });
      return;
    }
    viaSynth();
    function viaSynth() {
      if (!window.speechSynthesis) { onStart && onStart(); setTimeout(finish, 1500); return; }
      const v = VOICE[who] || VOICE.narrator;
      const u = new SpeechSynthesisUtterance(clean);
      const voice = pickVoice(lang, v.prefer);
      if (voice) u.voice = voice;
      u.lang = voice ? voice.lang : lang === 'es' ? 'es-ES' : 'en-US';
      u.pitch = v.pitch; u.rate = v.rate; u.volume = 1;
      u.onstart = () => { onStart && onStart(); tick = setInterval(() => onTick && onTick(), 110); };
      u.onend = finish; u.onerror = finish;
      // Seguro por si el navegador nunca avisa el final
      setTimeout(() => { if (speaking === me) finish(); }, 4000 + clean.length * 120);
      speechSynthesis.speak(u);
    }
  });
}
export const isSpeaking = () => !!speaking;
