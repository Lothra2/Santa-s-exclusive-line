import { load, S, update, save, KIDS, today, daysLeft, christmas, calendarDays, starsOf, uid, parseDay, addDays, exportData, importData, resetAll, applySetup } from './store.js';
import { t, lang, elfName, ELF_INFO } from './i18n.js';
import * as A from './audio.js';
import { initSky, trigger as skyFx, confettiBurst } from './sky.js';
import { Workshop } from './workshop.js';
import { ElfActor, SantaActor } from './actors.js';
import { elf, phone, icon, bigIcon, gift, smallStar, ELF_IDS } from './sprites.js';
import { toURL } from './pix.js';
import { dayContent, TAP_LINES } from './content.js';
import { elfReply, elfGreeting, santaMessage, hasKimi, testKimi, extractMemories, serverStatus } from './brain.js';

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = (s) => String(s).replace(/^./, (c) => c.toUpperCase());
const kidNames = (k) => (k === 'both' ? (lang() === 'es' ? 'Sophie y Alana' : 'Sophie and Alana') : KIDS[k].name);
const kidLabel = (k) => (k === 'both' ? t('both') : KIDS[k].name);

load(); S().lang = 'es'; save();
A.setMuted(S().muted);
document.documentElement.lang = lang();

/* ================== utilidades de interfaz ================== */
function paintIcons(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => { el.style.backgroundImage = `url(${toURL(icon(el.dataset.icon), 2)})`; });
  root.querySelectorAll('canvas[data-big]').forEach((cv) => {
    const src = bigIcon(cv.dataset.big); cv.width = src.width; cv.height = src.height;
    const c = cv.getContext('2d'); c.clearRect(0, 0, cv.width, cv.height); c.drawImage(src, 0, 0);
  });
}
function applyTexts() {
  $$('[data-t]').forEach((el) => { el.textContent = t(el.dataset.t); });
  // logo con letras que saltan
  const lt = $('.logo-top');
  lt.innerHTML = t('title').split(' ').map((w, wi) => `<span style="animation-delay:${wi * 0.15}s">${esc(w)}</span>`).join(' ');
  $('#btn-lang').textContent = lang() === 'es' ? 'EN' : 'ES';
  $('#btn-sound .ico').dataset.icon = S().muted ? 'mute' : 'sound';
  paintIcons($('#topbar'));
  $('#chat-text').placeholder = t('chatPlaceholder');
  $('#naming-input').placeholder = t('namePlaceholder');
  $('#btn-who').textContent = `☎ ${kidLabel(S().kid)}`;
  document.documentElement.lang = lang();
}

// Transición con pixeles
const fx = $('#fx');
async function pixelWipe(mid) {
  const c = fx.getContext('2d');
  const s = 24; const W = Math.ceil(innerWidth / s), H = Math.ceil(innerHeight / s);
  fx.width = W; fx.height = H;
  const cells = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cells.push([x, y]);
  cells.sort(() => Math.random() - 0.5);
  const steps = 7; const per = Math.ceil(cells.length / steps);
  c.fillStyle = '#070a24';
  for (let i = 0; i < steps; i++) { cells.slice(i * per, (i + 1) * per).forEach(([x, y]) => c.fillRect(x, y, 1, 1)); await sleep(22); }
  await mid();
  for (let i = 0; i < steps; i++) { cells.slice(i * per, (i + 1) * per).forEach(([x, y]) => c.clearRect(x, y, 1, 1)); await sleep(22); }
  c.clearRect(0, 0, W, H);
}

let current = 'phone';
const leaveHooks = {};
async function go(name, opts = {}) {
  if (leaveHooks[current]) leaveHooks[current]();
  A.stopVoice();
  const doSwitch = async () => {
    $$('.screen').forEach((s) => s.classList.remove('active'));
    $(`#scr-${name}`).classList.add('active');
    $('#topbar').classList.toggle('hidden', name === 'phone' || name === 'gate');
    $('#btn-back').style.visibility = ['hub', 'who', 'naming'].includes(name) ? 'hidden' : 'visible';
    current = name;
  };
  if (opts.instant) await doSwitch(); else await pixelWipe(doSwitch);
  const enter = ENTER[name]; if (enter) enter(opts);
}

function toast(msg, ms = 2600) {
  const el = $('#toast'); el.textContent = msg; el.classList.remove('hidden');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.add('hidden'), ms);
}

let modalClose = null;
function openModal(html, onClose) {
  $('#modal-box').innerHTML = html; $('#modal').classList.remove('hidden');
  modalClose = onClose; paintIcons($('#modal-box'));
  return $('#modal-box');
}
function closeModal() { $('#modal').classList.add('hidden'); A.stopVoice(); const f = modalClose; modalClose = null; f && f(); }
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

// Escribe el texto letra por letra con sonidito y lo lee en voz alta
async function sayIn(el, text, { who = 'narrator', actor = null, voice = true, spoken = null } = {}) {
  let skip = false; const onSkip = () => (skip = true); el.addEventListener('click', onSkip, { once: true });
  el.textContent = '';
  const speakP = voice && S().voice ? A.speak(spoken || text, { who, lang: lang(), onStart: () => actor && (actor.talking = true) }) : null;
  if (actor && !speakP) actor.talking = true;
  const pitch = (A.VOICE[who] || A.VOICE.narrator).blip;
  for (let i = 0; i < text.length; i++) {
    if (skip) { el.textContent = text; break; }
    el.textContent = text.slice(0, i + 1);
    if (!speakP && i % 2 === 0 && /\S/.test(text[i])) A.sfx.blip(pitch);
    await sleep(/[.!?¡¿,]/.test(text[i]) ? 90 : 26);
  }
  if (speakP) await speakP; else await sleep(300);
  if (actor) actor.talking = false;
}

/* ================== Cuenta regresiva ================== */
function countdownParts() {
  const now = new Date(); const x = christmas(now);
  let ms = Math.max(0, x - now);
  const d = Math.floor(ms / 86400000); ms -= d * 86400000;
  const h = Math.floor(ms / 3600000); ms -= h * 3600000;
  const m = Math.floor(ms / 60000); ms -= m * 60000;
  const s = Math.floor(ms / 1000);
  return { d, h, m, s, days: daysLeft(now) };
}
function tickCountdown() {
  const p = countdownParts();
  const z = (n) => String(n).padStart(2, '0');
  const isXmas = new Date().getMonth() === 11 && new Date().getDate() === 25;
  if (current === 'hub') {
    $('#cd-days').innerHTML = isXmas ? `<b>${t('daysLeft', 0)}</b>` : t('daysLeft', p.days).replace(String(p.days), `<b>${p.days}</b>`);
    const [hh, mm, ss] = t('hms');
    $('#cd-clock').innerHTML = isXmas ? '🎄🎁🎄' : `<span>${z(p.h)}<small>${hh}</small></span><span>${z(p.m)}<small>${mm}</small></span><span>${z(p.s)}<small>${ss}</small></span>`;
  }
  $('#tb-count').textContent = isXmas ? '🎄 ' + t('daysLeft', 0) : `🎄 ${p.days} · ${z(p.h)}:${z(p.m)}:${z(p.s)}`;
}
setInterval(tickCountdown, 1000);

/* ================== 1. Teléfono ================== */
const phoneCv = $('#phone-cv');
let phoneLifted = 0, phoneT = 0, phoneBusy = false, phoneRAF = null;
function drawPhone(now) {
  const c = phoneCv.getContext('2d'); c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, phoneCv.width, phoneCv.height);
  phoneT = now / 1000;
  const img = phone(phoneLifted);
  const ringing = !phoneBusy && Math.floor(phoneT * 1.0) % 3 === 0;
  const wob = ringing ? (Math.floor(phoneT * 24) % 2 ? 3 : -3) : 0;
  const sc = 2;
  c.save(); c.translate(Math.round(phoneCv.width / 2 + wob), phoneCv.height - 2); c.scale(sc, sc);
  c.drawImage(img, -Math.round(img.width / 2), -img.height); c.restore();
  if (ringing) {
    // ondas de timbre a los lados del auricular
    c.fillStyle = '#ffd23f';
    for (let i = 0; i < 3; i++) { c.fillRect(2 + i * 5, 34 - i * 7, 3, 8); c.fillRect(phoneCv.width - 5 - i * 5, 34 - i * 7, 3, 8); }
  }
  phoneRAF = requestAnimationFrame(drawPhone);
}
async function callNorthPole() {
  if (phoneBusy) return; phoneBusy = true;
  A.unlock();
  A.sfx.pop();
  phoneLifted = 1;
  const disp = $('#phone-display'); disp.classList.remove('hidden'); disp.textContent = '';
  $('#phone-msg').textContent = t('dialing');
  await sleep(400);
  const number = '1225';
  for (let i = 0; i < number.length; i++) { A.sfx.key(+number[i]); disp.textContent = number.slice(0, i + 1).replace(/(\d{2})(\d+)/, '$1-$2'); await sleep(260); }
  disp.textContent = '12-25 ★';
  await sleep(300);
  $('#phone-msg').textContent = t('ringing');
  for (let i = 0; i < 2; i++) { A.sfx.ring(); await sleep(1200); }
  $('#phone-msg').textContent = t('connecting');
  A.sfx.static(1.3); skyFx('aurora');
  await sleep(1400);
  A.sfx.connect(); skyFx('sparkle');
  $('#phone-msg').textContent = '✨ ' + t('connected') + ' ✨';
  await sleep(700);
  await A.speak(t('phoneHello'), { who: 'stripe', lang: lang() });
  await sleep(200);
  cancelAnimationFrame(phoneRAF);
  go('who');
}
phoneCv.addEventListener('click', callNorthPole);
$('#phone-msg').addEventListener('click', callNorthPole);
function ENTER_PHONE() {
  phoneBusy = false; phoneLifted = 0;
  $('#phone-display').classList.add('hidden');
  $('#phone-msg').textContent = t('tapPhone');
  cancelAnimationFrame(phoneRAF); phoneRAF = requestAnimationFrame(drawPhone);
}

/* ================== 2. ¿Quién llama? ================== */
function ornament(col) {
  const c = document.createElement('canvas'); c.width = 20; c.height = 22;
  const g = c.getContext('2d');
  g.fillStyle = '#c99a1c'; g.fillRect(8, 0, 4, 3);
  g.fillStyle = '#2a1424'; g.beginPath(); g.arc(10, 12, 9, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(10, 12, 8, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(5, 7, 3, 3); g.fillRect(6, 6, 1, 1);
  g.fillStyle = '#ffd23f'; g.fillRect(2, 11, 16, 2);
  return toURL(c, 3);
}
$$('.who-card').forEach((b) => {
  const k = b.dataset.kid; const col = k === 'sophie' ? '#c39af0' : k === 'alana' ? '#ffb0cf' : '#ffd23f';
  b.querySelector('.who-orn').style.backgroundImage = `url(${ornament(col)})`;
  b.addEventListener('click', async () => {
    A.sfx.jingle();
    update((s) => (s.kid = k));
    applyTexts();
    A.speak(lang() === 'es' ? `¡Hola, ${kidNames(k)}!` : `Hi, ${kidNames(k)}!`, { who: 'stripe', lang: lang() });
    await sleep(500);
    go(S().named ? 'hub' : 'naming');
  });
});

/* ================== 3. Bautizo ================== */
function makeStage(cv, w, h) {
  const dpr = Math.min(3, devicePixelRatio || 1);
  const r = cv.getBoundingClientRect();
  cv.width = Math.round((r.width || 360) * dpr); cv.height = Math.round(cv.width * h / w);
  const buf = document.createElement('canvas'); buf.width = w; buf.height = h;
  return { buf, b: buf.getContext('2d'), c: cv.getContext('2d') };
}
let namingRun = null;
const ENTER = {};
ENTER.naming = async () => {
  A.playSong('wish', { vol: 0.6 });
  const cv = $('#naming-cv');
  const W = 192, H = 96;
  const st = makeStage(cv, W, H);
  const actors = ELF_IDS.map((id, i) => { const a = new ElfActor(id, 48 + i * 48, 90); a.walkFrom = (i - 1) * 70 + (i === 1 ? -120 : 0); a.do('walkIn'); return a; });
  let last = performance.now(), alive = true;
  const snow = Array.from({ length: 30 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 8 }));
  const frame = (now) => {
    if (!alive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const g = st.b;
    // fondo: cortina de escenario y piso nevado
    g.fillStyle = '#1a1f5a'; g.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 8) { g.fillStyle = (x / 8) % 2 ? '#8a1f2a' : '#a8283a'; g.fillRect(x, 0, 8, 14); }
    g.fillStyle = '#ffd23f'; g.fillRect(0, 14, W, 2);
    g.fillStyle = '#e9efff'; g.fillRect(0, 84, W, 12); g.fillStyle = '#c4d0f0'; for (let x = 0; x < W; x += 6) g.fillRect(x, 86 + (x % 4), 3, 1);
    // focos
    actors.forEach((a) => { if (a.highlight) { g.fillStyle = 'rgba(255,240,170,0.18)'; g.beginPath(); g.moveTo(a.x - 6, 16); g.lineTo(a.x + 6, 16); g.lineTo(a.x + 26, 92); g.lineTo(a.x - 26, 92); g.fill(); } });
    g.fillStyle = '#fff'; snow.forEach((s) => { s.y += s.v * dt; if (s.y > H) { s.y = 16; s.x = Math.random() * W; } g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); });
    actors.forEach((a) => { a.update(dt); a.draw(g); });
    // nombres
    g.font = '7px "Pixelify Sans"'; g.textAlign = 'center';
    actors.forEach((a) => { const n = S().elves[a.id]; if (n) { const w = g.measureText(n).width + 6; g.fillStyle = '#fff6e0'; g.fillRect(Math.round(a.x - w / 2), 88, Math.round(w), 8); g.fillStyle = '#2a1424'; g.fillText(n, a.x, 94.5); } });
    st.c.imageSmoothingEnabled = false; st.c.drawImage(st.buf, 0, 0, cv.width, cv.height);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  leaveHooks.naming = () => { alive = false; };
  const txt = $('#naming-text');
  $('#naming-form').classList.add('hidden'); $('#naming-go').classList.add('hidden');
  await sleep(1300);
  actors.forEach((a) => a.do('hop'));
  await sayIn(txt, t('nameIntro'), { who: 'stripe', actor: actors[1] });
  for (const a of actors) {
    if (!alive) return;
    actors.forEach((o) => { o.highlight = o === a; o.dim = o !== a; });
    a.do('hop'); A.sfx.hop();
    await sayIn(txt, t('nameAsk'), { who: a.id, actor: a });
    const name = await askName(a);
    if (!alive) return;
    update((s) => (s.elves[a.id] = name));
    a.do('cheer'); a.heart(); A.sfx.fanfare(); skyFx('sparkle');
    await sayIn(txt, t('nameLove', name), { who: a.id, actor: a, spoken: t('nameLoveVoice') });
  }
  actors.forEach((o) => { o.highlight = false; o.dim = false; o.do('dance'); });
  update((s) => (s.named = true));
  A.sfx.jingle(); confettiBurst();
  await sayIn(txt, t('nameDone'), { who: 'green', actor: actors[2] });
  const goBtn = $('#naming-go'); goBtn.textContent = lang() === 'es' ? '¡Vamos al taller! 🎄' : "Let's go to the workshop! 🎄"; goBtn.classList.remove('hidden');
  goBtn.onclick = () => { A.sfx.tap(); go('hub'); };
};
function askName(actor) {
  return new Promise((resolve) => {
    const form = $('#naming-form'); form.classList.remove('hidden');
    const inp = $('#naming-input'); inp.value = '';
    const ideas = t('nameSuggest').filter((n) => !Object.values(S().elves).includes(n)).sort(() => Math.random() - 0.5).slice(0, 4);
    $('#naming-ideas').innerHTML = ideas.map((n) => `<button class="chip">${esc(n)}</button>`).join('');
    $$('#naming-ideas .chip').forEach((b) => b.onclick = () => { A.sfx.tap(); inp.value = b.textContent; });
    const done = () => {
      const v = inp.value.trim().replace(/^./, (c) => c.toUpperCase());
      if (!v) { inp.focus(); A.sfx.locked(); return; }
      form.classList.add('hidden'); inp.blur(); resolve(v.slice(0, 16));
    };
    $('#naming-ok').onclick = done;
    inp.onkeydown = (e) => { if (e.key === 'Enter') done(); };
    $('#naming-mic').onclick = () => listen($('#naming-mic'), (text) => { inp.value = text.replace(/[.!?]/g, '').split(' ').slice(0, 2).join(' '); });
  });
}

/* ================== Reconocimiento de voz ================== */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let rec = null;
function listen(btn, onText) {
  if (!SR) { toast(lang() === 'es' ? 'Este dispositivo no tiene micrófono mágico. ¡Escribe!' : 'No magic microphone here. Please type!'); return; }
  if (rec) { rec.stop(); return; }
  A.stopVoice(); A.duck(true);
  rec = new SR(); rec.lang = lang() === 'es' ? 'es-ES' : 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
  btn.classList.add('on'); A.sfx.pop();
  rec.onresult = (e) => { const text = e.results[0][0].transcript; if (text) onText(text); };
  rec.onerror = () => {};
  rec.onend = () => { btn.classList.remove('on'); rec = null; A.duck(false); };
  try { rec.start(); } catch (e) { btn.classList.remove('on'); rec = null; }
}

/* ================== 4. Taller ================== */
let workshop = null;
ENTER.hub = async () => {
  applyTexts(); tickCountdown();
  paintIcons($('#scr-hub'));
  if (!A.currentSong() || A.currentSong() === 'silent') A.playSong(Math.random() < 0.5 ? 'jingle' : 'deck', { vol: 0.7 });
  if (!workshop) workshop = new Workshop($('#workshop-cv'), { onTap: hubTap });
  workshop.start();
  requestAnimationFrame(() => { workshop.resize(); placeTags(); });
  leaveHooks.hub = () => workshop.stop();
  // insignia del calendario
  const tday = S().days[today()];
  $('#cal-badge').classList.toggle('hidden', !!(tday && tday.opened));
  await sleep(700);
  if (current !== 'hub') return;
  if (!(await showReports())) {
    if (!(tday && tday.opened) && !ENTER.hub.told) { ENTER.hub.told = true; hubSay('green', lang() === 'es' ? '¡Hay un regalo nuevo en el calendario mágico!' : "There's a new gift in the magic calendar!"); }
    else if (!ENTER.hub.greeted) { ENTER.hub.greeted = true; const id = ELF_IDS[Math.floor(Math.random() * 3)]; hubSay(id, lang() === 'es' ? `¡Hola, ${kidNames(S().kid)}! Toca a un elfo.` : `Hi, ${kidNames(S().kid)}! Tap an elf.`); }
  }
};
function placeTags() {
  const box = $('#elf-tags');
  box.innerHTML = ELF_IDS.map((id) => { const p = workshop.elfScreenPos(id); return `<div class="elf-tag" style="left:${p.x * 100}%;top:${p.y * 100}%">${esc(elfName(id))}</div>`; }).join('');
}
async function hubSay(id, text) {
  if (!workshop) return;
  const a = workshop.elves[id];
  const bub = $('#hub-bubble'); bub.classList.remove('hidden'); bub.innerHTML = `<b>${esc(elfName(id))}:</b> ${esc(text)}`;
  a.talking = true;
  await A.speak(text, { who: id, lang: lang() });
  a.talking = false;
  setTimeout(() => bub.classList.add('hidden'), 1200);
}
function hubTap(what) {
  A.unlock();
  if (ELF_IDS.includes(what)) {
    const a = workshop.elves[what];
    const fav = { scarf: ['shiver', 'wave', 'dance'], stripe: ['flip', 'dance', 'hop'], green: ['cheer', 'wave', 'hop'] }[what];
    const act = fav[Math.floor(Math.random() * fav.length)];
    a.do(act); a.heart();
    act === 'flip' || act === 'hop' ? A.sfx.hop() : act === 'shiver' ? A.sfx.whoosh() : A.sfx.jingle();
    if (act === 'shiver') workshop.burst(a.x, a.y - 50, '#9ad8ff');
    const line = TAP_LINES[lang()][Math.floor(Math.random() * TAP_LINES[lang()].length)].replace('{days}', daysLeft()).replace('{kid}', kidLabel(S().kid));
    const shiverLine = lang() === 'es' ? '¡Brrr! ¡Qué friiito! ¿Me prestas tu bufanda?' : 'Brrr! So chilly! Can I borrow your scarf?';
    hubSay(what, act === 'shiver' ? shiverLine : line);
  } else if (what === 'list') { A.sfx.sparkle(); go('stars'); }
  else if (what === 'fire') { A.sfx.whoosh(); }
  else if (what === 'tree') { A.sfx.sparkle(); skyFx('stars'); }
  else if (what === 'window') { A.sfx.jingle(); skyFx('sleigh'); }
}
$$('.menu-btn').forEach((b) => b.addEventListener('click', () => { A.unlock(); A.sfx.tap(); go(b.dataset.go); }));
$('#btn-who').addEventListener('click', () => { A.sfx.tap(); go('who'); });

// Reporte de estrellas nuevas que dieron los papás
async function showReports() {
  const kid = S().kid;
  const seen = S().seen[kid] || 0;
  const fresh = S().stars.filter((s) => s.ts > seen && (kid === 'both' || s.kid === kid || s.kid === 'both'));
  if (!fresh.length) return false;
  update((s) => (s.seen[kid] = Date.now()));
  for (const s of fresh) {
    if (current !== 'hub') return true;
    A.sfx.fanfare(); skyFx('stars');
    const who = s.kid === 'both' ? t('both') : KIDS[s.kid].name;
    const line = lang() === 'es' ? `¡${who} ganó una estrella! ${cap(s.reason)}.${s.reward ? ` Premio: ${s.reward}.` : ''}` : `${who} earned a star! ${cap(s.reason)}.${s.reward ? ` Reward: ${s.reward}.` : ''}`;
    const box = openModal(`<h2>${t('newReport')}</h2><canvas class="gift-big" id="rep-star"></canvas><p id="rep-text"></p><button class="pix-btn green" id="rep-ok">⭐ ${t('calClose')}</button>`);
    const cv = box.querySelector('#rep-star'); const src = bigIcon('star'); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0);
    cv.style.animation = 'bob 1s ease-in-out infinite';
    const closed = new Promise((r) => { box.querySelector('#rep-ok').onclick = () => { A.sfx.tap(); closeModal(); r(); }; modalClose = r; });
    if (workshop) workshop.elves.green.do('cheer');
    sayIn(box.querySelector('#rep-text'), line, { who: 'green', actor: workshop && workshop.elves.green });
    await closed;
  }
  return true;
}

/* ================== 5. Chat ================== */
let chatElf = 'scarf', chatActor = null, chatBusy = false, chatAlive = false;
const greeted = new Set();
ENTER.chat = async () => {
  if (A.currentSong() !== 'deck') A.playSong('deck', { vol: 0.35 });
  renderTabs();
  $('#chat-quick').innerHTML = t('quick').map((q) => `<button class="chip">${esc(q)}</button>`).join('');
  $$('#chat-quick .chip').forEach((b) => (b.onclick = () => { A.sfx.tap(); sendChat(b.textContent.replace(/^[^\p{L}¡¿]+/u, '')); }));
  startChatStage();
  renderLog();
  greetIfNeeded();
};
function renderTabs() {
  $('#chat-tabs').innerHTML = ELF_IDS.map((id) => `<button class="chat-tab ${id === chatElf ? 'on' : ''}" data-id="${id}"><canvas></canvas><span>${esc(elfName(id))}</span></button>`).join('');
  $$('#chat-tabs .chat-tab').forEach((b) => {
    const cv = b.querySelector('canvas'); const src = elf(b.dataset.id, {}); cv.width = src.width; cv.height = 30; cv.getContext('2d').drawImage(src, 0, 0);
    b.onclick = () => { if (chatBusy) return; A.sfx.tap(); A.stopVoice(); chatElf = b.dataset.id; renderTabs(); chatActor = makeChatActor(); renderLog(); greetIfNeeded(); };
  });
}
function makeChatActor() { const a = new ElfActor(chatElf, 96, 62); a.do('hop'); a.noShadow = false; return a; }
function startChatStage() {
  const cv = $('#chat-cv'); const W = 192, H = 64;
  const st = makeStage(cv, W, H);
  chatActor = makeChatActor();
  chatAlive = true; let last = performance.now();
  const bg = document.createElement('canvas'); bg.width = W; bg.height = H; const g0 = bg.getContext('2d');
  for (let x = 0; x < W; x += 12) { g0.fillStyle = (x / 12) % 2 ? '#6e3f26' : '#7c4a2d'; g0.fillRect(x, 0, 12, H); g0.fillStyle = '#4e2a18'; g0.fillRect(x, 0, 1, H); }
  g0.fillStyle = '#a0663a'; g0.fillRect(0, 56, W, 8); g0.fillStyle = '#7a4a2a'; g0.fillRect(0, 56, W, 1);
  // ventanita y árbol
  g0.fillStyle = '#3b1f12'; g0.fillRect(14, 10, 30, 26); g0.fillStyle = '#1a1f5a'; g0.fillRect(16, 12, 26, 22); g0.fillStyle = '#fff6d6'; g0.fillRect(34, 15, 4, 4);
  for (let j = 0; j < 34; j++) { const w = 4 + (j % 11) * 1.4 + j * 0.3; g0.fillStyle = j % 11 < 2 ? '#3fa84a' : '#2a8a40'; g0.fillRect(Math.round(166 - w / 2), 20 + j, Math.round(w), 1); }
  g0.fillStyle = '#ffd23f'; g0.fillRect(164, 16, 5, 5);
  const frame = (now) => {
    if (!chatAlive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const g = st.b; g.drawImage(bg, 0, 0);
    const tt = now / 1000;
    for (let i = 0; i < 8; i++) { g.fillStyle = Math.sin(tt * 3 + i) > 0 ? ['#ff4a4a', '#ffd23f', '#5ad8ff', '#7dff7a'][i % 4] : '#26502e'; g.fillRect(160 + ((i * 5) % 12), 26 + i * 3.5, 2, 2); }
    g.fillStyle = '#fff'; for (let i = 0; i < 6; i++) g.fillRect(17 + ((i * 7 + Math.floor(tt * 8)) % 24), 13 + ((i * 11 + Math.floor(tt * 10)) % 20), 1, 1);
    chatActor.update(dt); chatActor.draw(g);
    st.c.imageSmoothingEnabled = false; st.c.drawImage(st.buf, 0, 0, cv.width, cv.height);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  leaveHooks.chat = () => { chatAlive = false; if (rec) rec.stop(); rememberChat(); };
}
// Recuerdos que salen de lo que contaron las niñas
function newKidMsgs() {
  const kid = S().kid; const since = (S().memCursor || {})[kid] || 0;
  return (S().chats[kid] || []).filter((m) => m.from === 'kid' && (m.ts || 0) > since);
}
const pendingKidMsgs = () => newKidMsgs().length;
let remembering = false;
async function rememberChat() {
  if (remembering || !hasKimi()) return;
  const kid = S().kid; const msgs = newKidMsgs();
  if (msgs.length < 2) return;
  remembering = true;
  const until = Math.max(...msgs.map((m) => m.ts || 0));
  try {
    const facts = await extractMemories(kid, msgs.map((m) => m.text));
    update((s) => {
      s.memCursor = s.memCursor || {}; s.memCursor[kid] = until;
      for (const f of facts) s.memories.push({ id: uid(), date: today(), kid, text: f });
      if (s.memories.length > 80) s.memories.splice(0, s.memories.length - 80);
    });
  } finally { remembering = false; }
}
function chatHistory() { return (S().chats[S().kid] || []).filter((m) => m.elf === chatElf); }
function renderLog() {
  const log = $('#chat-log');
  log.innerHTML = chatHistory().slice(-30).map((m) => m.from === 'kid'
    ? `<div class="msg kid ${S().kid}">${esc(m.text)}</div>`
    : `<div class="msg elf"><b>${esc(elfName(m.elf))}</b>${esc(m.text)}</div>`).join('');
  log.scrollTop = log.scrollHeight;
}
function pushMsg(m) {
  update((s) => { const arr = s.chats[s.kid] || (s.chats[s.kid] = []); arr.push({ ...m, ts: Date.now() }); if (arr.length > 120) arr.splice(0, arr.length - 120); });
}
async function elfSays(text) {
  const log = $('#chat-log');
  const el = document.createElement('div'); el.className = 'msg elf'; el.innerHTML = `<b>${esc(elfName(chatElf))}</b><span></span>`;
  log.appendChild(el); log.scrollTop = log.scrollHeight;
  pushMsg({ from: 'elf', elf: chatElf, text });
  const span = el.querySelector('span');
  const obs = new MutationObserver(() => (log.scrollTop = log.scrollHeight)); obs.observe(span, { childList: true, characterData: true, subtree: true });
  await sayIn(span, text, { who: chatElf, actor: chatActor });
  obs.disconnect();
}
function typing(on) {
  const log = $('#chat-log');
  const old = log.querySelector('.typing'); if (old) old.remove();
  if (on) { const el = document.createElement('div'); el.className = 'msg elf typing'; el.innerHTML = `<b>${esc(elfName(chatElf))}</b>${t('thinking')} <i>•</i><i>•</i><i>•</i>`; log.appendChild(el); log.scrollTop = log.scrollHeight; }
}
async function greetIfNeeded() {
  const key = `${S().kid}|${chatElf}`;
  if (greeted.has(key)) return;
  greeted.add(key); chatBusy = true; typing(true);
  const [text] = await Promise.all([elfGreeting(chatElf, S().kid, lang()), sleep(700)]);
  await A.prepareVoice(chatElf, lang(), text, 9000);
  typing(false);
  if (current === 'chat') await elfSays(text);
  chatBusy = false;
}
async function sendChat(text) {
  text = (text || '').trim(); if (!text || chatBusy) return;
  chatBusy = true; A.stopVoice();
  $('#chat-text').value = '';
  pushMsg({ from: 'kid', elf: chatElf, text });
  const log = $('#chat-log');
  const el = document.createElement('div'); el.className = `msg kid ${S().kid}`; el.textContent = text; log.appendChild(el); log.scrollTop = log.scrollHeight;
  A.sfx.pop();
  typing(true); chatActor.do('look');
  const [res] = await Promise.all([elfReply(chatElf, S().kid, chatHistory(), lang()), sleep(600)]);
  if (res.text) await A.prepareVoice(chatElf, lang(), res.text, 9000);
  typing(false);
  if (res.wish) {
    update((s) => s.wishes.push({ id: uid(), date: today(), kid: s.kid, text: res.wish }));
    A.sfx.sparkle(); chatActor.do('cheer'); chatActor.heart();
    toast(lang() === 'es' ? '⭐ ¡Deseo anotado para Santa!' : '⭐ Wish written down for Santa!');
  } else if (/(porté bien|fui buena|good today|was good)/i.test(text)) { chatActor.do('cheer'); chatActor.heart(); }
  else chatActor.do(Math.random() < 0.5 ? 'hop' : 'wave');
  if (current === 'chat') await elfSays(res.text || t('lineBusy'));
  if (pendingKidMsgs() >= 6) rememberChat();
  chatBusy = false;
}
$('#chat-send').addEventListener('click', () => sendChat($('#chat-text').value));
$('#chat-text').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat($('#chat-text').value); });
$('#chat-mic').addEventListener('click', () => { if (chatBusy) return; listen($('#chat-mic'), (txt) => sendChat(txt)); });

/* ================== 6. Calendario ================== */
ENTER.cal = () => {
  if (A.currentSong() !== 'wish') A.playSong('wish', { vol: 0.5 });
  const days = calendarDays();
  const td = today();
  $('#cal-grid').innerHTML = days.map((d, i) => {
    const dt = parseDay(d);
    const info = S().days[d] || {};
    const cls = d > td ? 'future' : d === td ? 'today' : '';
    const c = dayContent(d, i, lang());
    const tag = c.kid === 'sophie' || c.kid === 'alana' ? '🎂' : d.endsWith('12-24') ? '🛷' : d.endsWith('12-25') ? '🎄' : info.hint ? '🔍' : '';
    return `<button class="cal-cell ${cls} ${info.opened ? 'opened' : ''} ${c.type === 'special' ? 'special' : ''}" data-d="${d}" data-i="${i}">
      <span class="tag">${tag}</span><canvas></canvas><span class="d">${dt.getDate()}</span><span class="wd">${t('dayNames')[dt.getDay()]} · ${t('months')[dt.getMonth()]}</span></button>`;
  }).join('');
  $$('.cal-cell').forEach((b) => {
    const d = b.dataset.d, i = +b.dataset.i;
    const info = S().days[d] || {};
    const cv = b.querySelector('canvas');
    const src = info.opened ? openedGift(i) : gift(i, 'all', d > td);
    cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0);
    b.onclick = () => openDay(d, i, b);
  });
  const todayCell = $('.cal-cell.today'); if (todayCell) todayCell.scrollIntoView({ block: 'center' });
};
function openedGift(i) {
  const c = document.createElement('canvas'); c.width = 26; c.height = 28;
  const g = c.getContext('2d'); g.drawImage(gift(i, 'box'), 0, 0);
  const st = smallStar('#ffd23f'); g.drawImage(st, 8, 3);
  return c;
}
async function openDay(d, i, cell) {
  A.unlock();
  const td = today();
  if (d > td) {
    A.sfx.locked(); cell.animate([{ transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'none' }], { duration: 240, iterations: 2, easing: 'steps(2)' });
    const n = Math.round((parseDay(d) - parseDay(td)) / 86400000);
    A.speak(t('calLocked', n), { who: 'stripe', lang: lang() }); toast(t('calLocked', n));
    return;
  }
  const info = S().days[d] || {};
  const c = dayContent(d, i, lang());
  const dt = parseDay(d);
  const title = c.type === 'special' ? t('types').special : t('types')[c.type];
  const dateStr = `${dt.getDate()} ${t('months')[dt.getMonth()]}`;
  const thatDay = [...S().diary.filter((x) => x.date === d).map((x) => `📖 ${esc(x.text)}`), ...S().stars.filter((x) => x.date === d).map((x) => `⭐ ${esc(x.kid === 'both' ? t('both') : KIDS[x.kid].name)}: ${esc(x.reason)}`)];
  const html = `<h2>${dateStr} · ${esc(title)}</h2><canvas class="gift-big" id="gift-cv" width="78" height="84"></canvas>
    <div id="day-body" class="${info.opened ? '' : 'hidden'}">
      <p id="day-text"></p>
      ${info.msg ? `<p class="from-parents">💌 ${esc(info.msg)}</p>` : ''}
      ${info.hint ? `<div class="hint">🔍 ${t('calHint')}: ${esc(info.hint)}</div>` : ''}
      ${thatDay.length ? `<div class="that-day"><b>${t('calThatDay')}</b><br>${thatDay.join('<br>')}</div>` : ''}
      <button class="pix-btn green" id="day-ok">${t('calClose')}</button>
    </div>`;
  const box = openModal(html, () => { A.stopSong(); A.playSong('wish', { vol: 0.5 }); ENTER.cal(); });
  const gcv = box.querySelector('#gift-cv'); const g = gcv.getContext('2d'); g.imageSmoothingEnabled = false;
  const drawGift = (lidY, rot = 0) => { g.clearRect(0, 0, 78, 84); g.save(); g.translate(39, 84); g.rotate(rot); g.translate(-39, -84); g.drawImage(gift(i, 'box'), 0, 0, 26, 28, 0, 0, 78, 84); g.restore(); g.drawImage(gift(i, 'lid'), 0, 0, 26, 28, 0, lidY, 78, 84); };
  if (!info.opened) {
    drawGift(0);
    $('#day-body') && box.querySelector('#day-body').classList.add('hidden');
    const p = document.createElement('div'); p.className = 'blink-text'; p.style.color = '#a11f2a'; p.style.textShadow = 'none'; p.textContent = t('calOpen'); box.insertBefore(p, box.querySelector('#day-body'));
    await new Promise((r) => (gcv.onclick = r, p.onclick = r));
    p.remove();
    for (let k = 0; k < 3; k++) { A.sfx.pop(); for (const r of [-0.12, 0.12, 0]) { drawGift(0, r); await sleep(70); } await sleep(120); }
    A.sfx.unwrap();
    for (let y = 0; y > -90; y -= 10) { drawGift(y); await sleep(25); }
    confettiBurst(); skyFx(c.anim || 'sparkle');
    update((s) => { s.days[d] = { ...(s.days[d] || {}), opened: true, openedAt: Date.now() }; });
    // mostrar el contenido
    const st = smallStar('#ffd23f'); g.clearRect(0, 0, 78, 84); g.drawImage(gift(i, 'box'), 0, 0, 26, 28, 0, 0, 78, 84); g.drawImage(st, 22, 4, 36, 36);
  } else {
    g.drawImage(gift(i, 'box'), 0, 0, 26, 28, 0, 0, 78, 84); g.drawImage(smallStar('#ffd23f'), 22, 4, 36, 36); skyFx(c.anim || 'sparkle');
  }
  box.querySelector('#day-body').classList.remove('hidden');
  box.querySelector('#day-ok').onclick = () => { A.sfx.tap(); closeModal(); };
  if (c.song) A.playSong(c.song, { loop: false, vol: 0.8 });
  const reader = c.kid || c.type === 'joke' ? 'stripe' : c.type === 'mission' ? 'green' : 'scarf';
  let text = c.text; if (info.hint) text += lang() === 'es' ? ` Pista secreta: ${info.hint}` : ` Secret clue: ${info.hint}`;
  const el = box.querySelector('#day-text'); el.textContent = '';
  await sayIn(el, c.text, { who: reader, voice: true });
  if (info.hint) A.speak((lang() === 'es' ? 'Pista secreta: ' : 'Secret clue: ') + info.hint, { who: reader, lang: lang() });
}

/* ================== 7. Santa ================== */
let santaAlive = false, santaActor = null, santaText = '';
ENTER.santa = async () => {
  A.playSong('silent', { vol: 0.5 });
  $('#santa-letter').classList.add('hidden'); $('#santa-actions').classList.add('hidden');
  const cv = $('#santa-cv'); const W = 192, H = 120;
  const st = makeStage(cv, W, H);
  santaActor = new SantaActor(96, 120);
  const bg = santaRoom(W, H);
  let last = performance.now(), staticT = 1.6; santaAlive = true;
  const embers = [];
  A.sfx.static(1.6);
  const frame = (now) => {
    if (!santaAlive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const g = st.b; const tt = now / 1000;
    g.drawImage(bg, 0, 0);
    // fuego de la chimenea
    for (let i = 0; i < 12; i++) { const x = 158 + ((i * 5) % 14), h = 4 + Math.abs(Math.sin(tt * 9 + i)) * 9; for (let j = 0; j < h; j++) { g.fillStyle = j < h * 0.4 ? '#ffd23f' : j < h * 0.75 ? '#ff8a2a' : '#e03a3a'; g.fillRect(x, 104 - j, 2, 1); } }
    // nieve por la ventana
    g.fillStyle = '#fff'; for (let i = 0; i < 10; i++) g.fillRect(14 + ((i * 7 + Math.floor(tt * 6)) % 30), 18 + ((i * 13 + Math.floor(tt * 12)) % 30), 1, 1);
    // velita
    g.fillStyle = Math.sin(tt * 12) > 0 ? '#ffd23f' : '#ff8a2a'; g.fillRect(44, 86, 2, 3);
    santaActor.update(dt); santaActor.draw(g);
    // escritorio delante
    g.fillStyle = '#6e3f26'; g.fillRect(28, 108, 136, 12); g.fillStyle = '#8a5432'; g.fillRect(28, 108, 136, 2); g.fillStyle = '#4e2a18'; g.fillRect(28, 118, 136, 2);
    g.fillStyle = '#fff0c8'; g.fillRect(36, 103, 14, 6); g.fillRect(38, 101, 14, 6); g.fillStyle = '#e03a3a'; g.fillRect(48, 102, 2, 2);
    g.fillStyle = '#fdf9f0'; g.fillRect(140, 100, 2, 9); g.fillStyle = '#9a5cd8'; g.fillRect(138, 96, 4, 5);
    // estática de "transmisión"
    if (staticT > 0) {
      staticT -= dt;
      for (let i = 0; i < 1400 * Math.min(1, staticT); i++) { const v = Math.random() * 255 | 0; g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(Math.random() * W | 0, Math.random() * H | 0, 2, 1); }
      g.fillStyle = 'rgba(0,0,0,0.25)'; for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);
    }
    st.c.imageSmoothingEnabled = false; st.c.drawImage(st.buf, 0, 0, cv.width, cv.height);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  leaveHooks.santa = () => { santaAlive = false; A.stopSong(); };
  const msgP = santaMessage(S().kid, lang());
  await sleep(1700);
  if (!santaAlive) return;
  santaActor.do('laugh'); A.sfx.hoho(); skyFx('sparkle');
  await A.speak(lang() === 'es' ? '¡Jo, jo, jo!' : 'Ho, ho, ho!', { who: 'santa', lang: lang(), onStart: () => (santaActor.talking = true) });
  santaActor.talking = false;
  santaActor.do('wave');
  santaText = await msgP;
  if (!santaAlive) return;
  await santaBusy(A.prepareVoice('santa', lang(), santaText, 20000));
  if (!santaAlive) return;
  santaActor.arms = 'letter';
  await readSanta();
};
// Santa se mantiene animado mientras prepara su voz
async function santaBusy(promise) {
  let done = false; promise.finally(() => (done = true));
  const acts = ['wave', 'laugh', 'wink', 'wave'];
  for (let i = 0; !done && santaAlive; i++) {
    santaActor.do(acts[i % acts.length]); if (acts[i % acts.length] === 'laugh') A.sfx.jingle();
    await Promise.race([promise, sleep(1900)]);
  }
  return promise;
}
async function readSanta() {
  $('#santa-letter').classList.remove('hidden'); $('#santa-actions').classList.add('hidden');
  const el = $('#santa-text');
  await sayIn(el, santaText, { who: 'santa', actor: santaActor });
  if (!santaAlive) return;
  santaActor.arms = 'belly'; santaActor.do('wave'); santaActor.twinkleT = 1;
  $('#santa-actions').classList.remove('hidden');
}
$('#santa-again').addEventListener('click', () => { A.sfx.tap(); santaActor.arms = 'letter'; readSanta(); });
$('#santa-new').addEventListener('click', async () => {
  A.sfx.tap(); $('#santa-actions').classList.add('hidden'); $('#santa-text').textContent = '…';
  santaActor.do('laugh'); A.sfx.hoho();
  santaText = await santaMessage(S().kid, lang());
  await santaBusy(A.prepareVoice('santa', lang(), santaText, 20000));
  santaActor.arms = 'letter'; readSanta();
});
function santaRoom(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  // papel tapiz rojo con rayas
  for (let x = 0; x < W; x += 8) { g.fillStyle = (x / 8) % 2 ? '#7a1f2a' : '#8a2832'; g.fillRect(x, 0, 8, H); }
  for (let y = 6; y < 100; y += 14) for (let x = 4 + ((y / 14) % 2) * 8; x < W; x += 16) { g.fillStyle = '#c9a03a'; g.fillRect(x, y, 1, 3); g.fillRect(x - 1, y + 1, 3, 1); }
  g.fillStyle = '#4e2a18'; g.fillRect(0, 96, W, 24); g.fillStyle = '#5a3420'; g.fillRect(0, 96, W, 2);
  // ventana
  g.fillStyle = '#3b1f12'; g.fillRect(10, 14, 38, 40); g.fillStyle = '#1a1f5a'; g.fillRect(12, 16, 34, 36);
  g.fillStyle = '#5ad8a0'; g.globalAlpha = 0.35; g.fillRect(12, 22, 34, 4); g.globalAlpha = 1;
  g.fillStyle = '#3b1f12'; g.fillRect(28, 16, 2, 36); g.fillRect(12, 33, 34, 2); g.fillStyle = '#f4f8ff'; g.fillRect(12, 50, 34, 2);
  // cuadro del reno
  g.fillStyle = '#c99a1c'; g.fillRect(140, 12, 30, 24); g.fillStyle = '#9ad8ff'; g.fillRect(142, 14, 26, 20);
  g.fillStyle = '#c97a3c'; g.fillRect(150, 22, 10, 6); g.fillRect(158, 18, 4, 5); g.fillStyle = '#e03a3a'; g.fillRect(162, 20, 2, 2); g.fillStyle = '#8a4c22'; g.fillRect(157, 15, 1, 3); g.fillRect(160, 15, 1, 3);
  g.fillStyle = '#fff'; g.fillRect(142, 31, 26, 3);
  // chimenea pequeña
  g.fillStyle = '#8a8496'; g.fillRect(150, 70, 36, 38); g.fillStyle = '#1d1218'; g.fillRect(156, 82, 24, 24); g.fillStyle = '#6e3f26'; g.fillRect(146, 66, 44, 5);
  // estante con libros y vela
  g.fillStyle = '#5a3420'; g.fillRect(28, 90, 30, 3);
  ['#e03a3a', '#43b047', '#4a8ad8', '#ffd23f'].forEach((col, i) => { g.fillStyle = col; g.fillRect(30 + i * 4, 80 + (i % 2) * 2, 3, 10 - (i % 2) * 2); });
  g.fillStyle = '#fdf9f0'; g.fillRect(44, 89, 2, 1); g.fillRect(44, 84, 2, 6);
  // guirnalda
  for (let x = 0; x < W; x++) { const y = 4 + Math.round(Math.abs(Math.sin(x * 0.07)) * 4); g.fillStyle = x % 3 ? '#26802f' : '#43b047'; g.fillRect(x, y, 1, 2); }
  return c;
}

/* ================== 8. Estrellas ================== */
function jarCanvas(n, col) {
  const c = document.createElement('canvas'); c.width = 60; c.height = 70; const g = c.getContext('2d');
  g.fillStyle = '#2a1424'; g.fillRect(14, 2, 32, 8); g.fillStyle = col; g.fillRect(15, 3, 30, 6);
  g.fillStyle = 'rgba(200,230,255,.35)'; g.fillRect(8, 10, 44, 56); g.fillStyle = '#2a1424';
  g.fillRect(7, 10, 1, 57); g.fillRect(52, 10, 1, 57); g.fillRect(7, 66, 46, 1); g.fillRect(8, 10, 6, 1); g.fillRect(46, 10, 6, 1);
  const st = smallStar('#ffd23f');
  for (let i = 0; i < Math.min(n, 30); i++) { const row = Math.floor(i / 5), colI = i % 5; g.drawImage(st, 10 + colI * 8 + (row % 2) * 3, 57 - row * 7); }
  g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(11, 14, 2, 20);
  return c;
}
ENTER.stars = () => {
  if (A.currentSong() !== 'jingle') A.playSong('jingle', { vol: 0.4 });
  const kid = S().kid;
  $('#jars').innerHTML = ['sophie', 'alana'].map((k) => {
    const n = starsOf(k).length;
    return `<div class="jar ${kid !== 'both' && kid !== k ? 'dim' : ''}"><div class="who" style="color:${KIDS[k].color}">${KIDS[k].name}</div><canvas data-jar="${k}"></canvas><div class="count">★ ${n}</div><div class="meter-label">${t('goodMeter')}</div><div class="meter"><i style="width:${Math.min(100, 20 + n * 8)}%"></i></div></div>`;
  }).join('');
  $$('[data-jar]').forEach((cv) => { const src = jarCanvas(starsOf(cv.dataset.jar).length, KIDS[cv.dataset.jar].color); cv.width = src.width; cv.height = src.height; cv.getContext('2d').drawImage(src, 0, 0); });
  const list = S().stars.filter((s) => kid === 'both' || s.kid === kid || s.kid === 'both').slice().reverse();
  const starURL = toURL(smallStar('#ffd23f'), 3);
  $('#stars-list').innerHTML = list.length ? list.map((s) => `<div class="star-item"><img src="${starURL}" width="22" style="image-rendering:pixelated"><div>${esc(cap(s.reason))}<small>${esc(s.kid === 'both' ? t('both') : KIDS[s.kid].name)} · ${esc(s.date)}</small>${s.reward ? `<span class="rw">🎁 ${t('reward')}: ${esc(s.reward)}</span>` : ''}</div></div>`).join('') : `<div class="empty">${t('starsNone')}</div>`;
  const n = kid === 'both' ? S().stars.length : starsOf(kid).length;
  setTimeout(() => {
    if (current !== 'stars') return;
    skyFx('stars');
    A.speak(lang() === 'es' ? (n ? `¡Tienes ${n} ${n === 1 ? 'estrella' : 'estrellas'} en la Lista de los Buenos!` : t('starsNone')) : (n ? `You have ${n} ${n === 1 ? 'star' : 'stars'} on the Nice List!` : t('starsNone')), { who: 'green', lang: lang() });
  }, 500);
};

/* ================== 9. Papás ================== */
let pinBuf = '', parentsTab = 'today', parentWho = 'sophie';
ENTER.parents = () => { A.stopSong(); pinBuf = ''; renderPin(); };
function renderPin(msg = '') {
  const creating = !S().pin;
  $('#parents-root').innerHTML = `<div class="pin-title">🔒 ${creating ? t('pinSet') : t('pinEnter')}</div>
    <div class="pin-dots">${[0, 1, 2, 3].map((i) => `<i class="${i < pinBuf.length ? 'on' : ''}"></i>`).join('')}</div>
    ${msg ? `<div class="pin-title err">${msg}</div>` : ''}
    <div class="pinpad">${[1, 2, 3, 4, 5, 6, 7, 8, 9, '←', 0, '✓'].map((k) => `<button data-k="${k}">${k}</button>`).join('')}</div>`;
  $$('.pinpad button').forEach((b) => b.onclick = () => {
    const k = b.dataset.k; A.sfx.key(+k || 0);
    if (k === '←') pinBuf = pinBuf.slice(0, -1);
    else if (k === '✓') { if (pinBuf.length < 4) return; }
    else if (pinBuf.length < 4) pinBuf += k;
    if (pinBuf.length === 4) {
      if (!S().pin) { update((s) => (s.pin = pinBuf)); renderPanel(); return; }
      if (pinBuf === S().pin) { renderPanel(); return; }
      pinBuf = ''; A.sfx.locked(); renderPin(t('pinBad')); return;
    }
    renderPin();
  });
}
const P = {
  es: { today: 'Hoy', cal: 'Calendario', wishes: 'Deseos y recuerdos', settings: 'Ajustes', who: '¿De quién?', diary: '¿Qué pasó hoy?', diaryHelp: 'Escríbanlo en tercera persona. Los elfos lo van a mencionar como si lo hubieran visto con su magia. Ej: "ayudó a Alana a recoger los juguetes".', saveDiary: 'Guardar en el diario', star: 'Dar una estrella ⭐', reason: '¿Por qué se la ganó?', reasonPh: 'ayudó a recoger la mesa', reward: 'Premio (opcional)', rewardPh: 'helado el sábado', recent: 'Últimos registros', day: 'Día', hint: 'Pista de algo escondido (opcional)', hintPh: 'Busca debajo del cojín azul', msg: 'Mensaje especial para ese día (opcional)', msgPh: 'Hoy vamos a decorar galletas', saveDay: 'Guardar el día', noWishes: 'Todavía no hay deseos.', wishHelp: 'Lo que Santa ya sabe que quieren. Los elfos lo mencionan con ilusión pero nunca lo prometen. Lo que pidan en el chat aparece aquí solo.', wishPh: 'una bicicleta', addWish: 'Agregar deseo 🎁', memTitle: 'Recuerdos de las conversaciones', memHelp: 'Cosas que las niñas les contaron a los elfos. Santa y los elfos las recuerdan después. Pueden borrar lo que quieran.', memNone: 'Todavía no hay recuerdos. Se crean solos cuando conversan con Kimi conectado.', profile: 'Lo que Santa sabe de la familia', profileHelp: 'Escriban aquí todo lo que quieran que Santa y los elfos sepan. Se guarda solo en este dispositivo, nunca en internet ni en el código.', vsTitle: 'Puente de Cloudflare (voces de Fish y Kimi)', vsHelp: 'Dirección del Worker de Cloudflare y su clave. Con esto el chat y las cartas de Santa usan Kimi y suenan con las voces de Fish en todos los dispositivos. Viene incluido en el link privado.', vsToken: 'Clave del servidor', kimi: 'Kimi (conversaciones inteligentes)', kimiHelp: 'Si Kimi ya está en el Worker de Cloudflare, no hace falta pegar nada aquí. Solo úsenlo si no hay Worker: la key se guarda en este dispositivo. Sin Kimi, los elfos usan respuestas mágicas ya escritas.', test: 'Probar y guardar', model: 'Modelo', elves: 'Nombres de los elfos', rebapt: 'Repetir el bautizo', launch: 'Primer día del calendario', voice: 'Voz de los elfos y Santa', on: 'Sí', off: 'No', backup: 'Pasar datos a otro dispositivo', exp: 'Descargar respaldo', imp: 'Cargar respaldo', backupHelp: 'Cada dispositivo guarda sus propios datos. Descarga el respaldo aquí y cárgalo en el otro iPad o teléfono para que tengan lo mismo. La key de Kimi no viaja en el respaldo.', changePin: 'Cambiar PIN', reset: 'Borrar todo y empezar de nuevo', resetQ: '¿Seguro? Se borran diario, estrellas, nombres y calendario.', saved: '¡Guardado!', close: 'Cerrar panel', testing: 'Probando…', okKimi: (m) => `¡Conectado! Modelo: ${m}`, badKimi: (e) => `No funcionó (${e}). Revisa la key.`, del: 'Borrar' },
  en: { today: 'Today', cal: 'Calendar', wishes: 'Wishes & memories', settings: 'Settings', who: 'Who?', diary: 'What happened today?', diaryHelp: 'Write it in third person. The elves will mention it as if they saw it with their magic. E.g. "helped Alana tidy up the toys".', saveDiary: 'Save to diary', star: 'Give a star ⭐', reason: 'Why did she earn it?', reasonPh: 'helped clear the table', reward: 'Reward (optional)', rewardPh: 'ice cream on Saturday', recent: 'Recent entries', day: 'Day', hint: 'Clue for something hidden (optional)', hintPh: 'Look under the blue pillow', msg: 'Special message for that day (optional)', msgPh: "Today we're decorating cookies", saveDay: 'Save day', noWishes: 'No wishes yet.', wishHelp: 'What Santa already knows they want. The elves mention it with excitement but never promise it. Wishes from the chat show up here automatically.', wishPh: 'a bicycle', addWish: 'Add wish 🎁', memTitle: 'Memories from the chats', memHelp: 'Things the girls told the elves. Santa and the elves remember them later. You can delete anything.', memNone: 'No memories yet. They are created when they chat with Kimi connected.', profile: 'What Santa knows about the family', profileHelp: 'Write everything you want Santa and the elves to know. It is stored only on this device, never online or in the code.', vsTitle: 'Cloudflare bridge (Fish voices and Kimi)', vsHelp: 'Cloudflare Worker address and its key. With it, the chat and Santa letters use Kimi and the Fish voices on every device. It comes inside the private link.', vsToken: 'Server key', kimi: 'Kimi (smart conversations)', kimiHelp: 'If Kimi is already in the Cloudflare Worker, you do not need to paste anything here. Only use this without a Worker: the key is stored on this device. Without Kimi, the elves use pre-written magic replies.', test: 'Test and save', model: 'Model', elves: 'Elf names', rebapt: 'Redo the naming ceremony', launch: 'First calendar day', voice: 'Elf and Santa voices', on: 'On', off: 'Off', backup: 'Move data to another device', exp: 'Download backup', imp: 'Load backup', backupHelp: 'Each device keeps its own data. Download a backup here and load it on the other iPad or phone. The Kimi key is not included.', changePin: 'Change PIN', reset: 'Erase everything and start over', resetQ: 'Are you sure? Diary, stars, names and calendar will be erased.', saved: 'Saved!', close: 'Close panel', testing: 'Testing…', okKimi: (m) => `Connected! Model: ${m}`, badKimi: (e) => `Did not work (${e}). Check the key.`, del: 'Delete' },
};
const p = (k, ...a) => { const v = P[lang()][k]; return typeof v === 'function' ? v(...a) : v; };
function whoSeg(sel) {
  return `<div class="seg" data-seg>${['sophie', 'alana', 'both'].map((k) => `<button data-who="${k}" class="${sel === k ? 'on' : ''}">${kidLabel(k)}</button>`).join('')}</div>`;
}
function renderPanel() {
  const s = S();
  const tabs = `<div class="tabs">${['today', 'cal', 'wishes', 'settings'].map((k) => `<button data-tab="${k}" class="${parentsTab === k ? 'on' : ''}">${p(k)}</button>`).join('')}</div>`;
  let body = '';
  if (parentsTab === 'today') {
    const recent = [...s.diary.map((d) => ({ ...d, kind: 'd' })), ...s.stars.map((x) => ({ ...x, kind: 's' }))].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 12);
    body = `<label>${p('who')}</label>${whoSeg(parentWho)}
      <h3>📖 ${p('diary')}</h3><p class="help">${p('diaryHelp')}</p>
      <textarea id="pd-text" class="pix-input"></textarea><button id="pd-save" class="pix-btn green">${p('saveDiary')}</button>
      <h3>${p('star')}</h3>
      <label>${p('reason')}</label><input id="ps-reason" class="pix-input" placeholder="${p('reasonPh')}">
      <label>${p('reward')}</label><input id="ps-reward" class="pix-input" placeholder="${p('rewardPh')}">
      <button id="ps-save" class="pix-btn gold">${p('star')}</button>
      <h3>${p('recent')}</h3>
      ${recent.map((r) => `<div class="list-item"><div>${r.kind === 's' ? '⭐' : '📖'} ${esc(r.kind === 's' ? r.reason : r.text)}${r.reward ? ` · 🎁 ${esc(r.reward)}` : ''}<br><small>${kidLabel(r.kid)} · ${r.date}</small></div><button class="x" data-del="${r.kind}:${r.id}">✕</button></div>`).join('')}`;
  } else if (parentsTab === 'cal') {
    const days = calendarDays();
    const sel = parentsTab.day || today();
    const withInfo = Object.entries(s.days).filter(([, v]) => v.hint || v.msg).sort();
    body = `<label>${p('day')}</label><select id="pc-day" class="pix-input">${days.map((d) => `<option value="${d}" ${d === sel ? 'selected' : ''}>${d}${s.days[d]?.opened ? ' ✓' : ''}</option>`).join('')}</select>
      <label>${p('hint')}</label><input id="pc-hint" class="pix-input" placeholder="${p('hintPh')}">
      <label>${p('msg')}</label><input id="pc-msg" class="pix-input" placeholder="${p('msgPh')}">
      <button id="pc-save" class="pix-btn green">${p('saveDay')}</button>
      ${withInfo.map(([d, v]) => `<div class="list-item"><div><b>${d}</b>${v.hint ? `<br>🔍 ${esc(v.hint)}` : ''}${v.msg ? `<br>💌 ${esc(v.msg)}` : ''}</div><button class="x" data-dayx="${d}">✕</button></div>`).join('')}`;
  } else if (parentsTab === 'wishes') {
    body = `<p class="help">${p('wishHelp')}</p><label>${p('who')}</label>${whoSeg(parentWho)}
      <input id="pw-text" class="pix-input" placeholder="${p('wishPh')}"><button id="pw-save" class="pix-btn gold">${p('addWish')}</button>
      ${s.wishes.length ? s.wishes.slice().reverse().map((w) => `<div class="list-item"><div>🎁 <b>${esc(w.text)}</b><br><small>${kidLabel(w.kid)} · ${w.date}${w.from === 'parents' ? ' · 👨‍👩‍👧' : ' · 💬'}</small></div><button class="x" data-del="w:${w.id}">✕</button></div>`).join('') : `<p class="help">${p('noWishes')}</p>`}
      <h3>🧠 ${p('memTitle')}</h3><p class="help">${p('memHelp')}</p>
      ${s.memories.length ? s.memories.slice().reverse().map((m) => `<div class="list-item"><div>${esc(m.text)}<br><small>${kidLabel(m.kid)} · ${m.date}</small></div><button class="x" data-del="m:${m.id}">✕</button></div>`).join('') : `<p class="help">${p('memNone')}</p>`}`;
  } else {
    body = `<h3>🤖 ${p('kimi')}</h3><p class="help">${p('kimiHelp')}</p>
      <input id="pk-key" class="pix-input" type="password" placeholder="sk-..." value="${esc(s.kimi.key)}">
      <label>${p('model')}</label><input id="pk-model" class="pix-input" value="${esc(s.kimi.model)}" placeholder="auto">
      <button id="pk-test" class="pix-btn green">${p('test')}</button><div id="pk-res" class="help">${s.kimi.key ? `${s.kimi.base}` : ''}</div>
      <h3>🧝 ${p('elves')}</h3>
      ${ELF_IDS.map((id) => `<input class="pix-input" data-elfname="${id}" value="${esc(s.elves[id])}" placeholder="${esc(ELF_INFO[id][lang()].fallback)}">`).join('')}
      <div class="row"><button id="pe-save" class="pix-btn green">${p('saveDay').split(' ')[0]}</button><button id="pe-rebapt" class="pix-btn gray">${p('rebapt')}</button></div>
      <h3>👨‍👩‍👧 ${p('profile')}</h3><p class="help">${p('profileHelp')}</p>
      <textarea id="pf-text" class="pix-input" style="height:190px">${esc(s.profile || '')}</textarea>
      <button id="pf-save" class="pix-btn green">${p('saveDay').split(' ')[0]}</button>
      <h3>🎙️ ${p('vsTitle')}</h3><p class="help">${p('vsHelp')}</p>
      <input id="vs-url" class="pix-input" placeholder="https://polonorte-voces....workers.dev" value="${esc(s.voiceServer.url || '')}">
      <input id="vs-token" class="pix-input" type="password" placeholder="${p('vsToken')}" value="${esc(s.voiceServer.token || '')}">
      <button id="vs-test" class="pix-btn green">${p('test')}</button><div id="vs-res" class="help"></div>
      <h3>📅 ${p('launch')}</h3><input id="pl-date" type="date" class="pix-input" value="${s.launch}">
      <h3>📦 ${p('backup')}</h3><p class="help">${p('backupHelp')}</p>
      <div class="row"><button id="pb-exp" class="pix-btn green">${p('exp')}</button><label class="pix-btn gold" style="display:grid;place-items:center">${p('imp')}<input id="pb-imp" type="file" accept=".json,application/json" hidden></label></div>
      <button id="pp-pin" class="pix-btn gray">${p('changePin')}</button>
      <button id="pr-reset" class="pix-btn">${p('reset')}</button>`;
  }
  $('#parents-root').innerHTML = `<div class="panel"><h2>🔒 ${t('parents')}</h2>${tabs}${body}<button id="pp-close" class="pix-btn gray">${p('close')}</button></div>`;
  bindPanel();
}
function bindPanel() {
  const r = $('#parents-root');
  r.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => { parentsTab = b.dataset.tab; renderPanel(); });
  r.querySelectorAll('[data-who]').forEach((b) => b.onclick = () => { parentWho = b.dataset.who; renderPanel(); });
  r.querySelector('#pp-close').onclick = () => go(homeScreen());
  const on = (id, fn) => { const el = r.querySelector(id); if (el) el.onclick = fn; };
  on('#pd-save', () => { const v = $('#pd-text').value.trim(); if (!v) return; update((s) => s.diary.push({ id: uid(), date: today(), kid: parentWho, text: v })); toast(p('saved')); renderPanel(); });
  on('#ps-save', () => {
    const v = $('#ps-reason').value.trim(); if (!v) return;
    update((s) => s.stars.push({ id: uid(), date: today(), kid: parentWho, reason: v, reward: $('#ps-reward').value.trim(), ts: Date.now() }));
    A.unlock(); A.sfx.fanfare(); toast('⭐ ' + p('saved')); renderPanel();
  });
  r.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => {
    const [k, id] = b.dataset.del.split(':');
    update((s) => { const key = k === 's' ? 'stars' : k === 'w' ? 'wishes' : k === 'm' ? 'memories' : 'diary'; s[key] = s[key].filter((x) => x.id !== id); });
    renderPanel();
  });
  const daySel = r.querySelector('#pc-day');
  if (daySel) {
    const fill = () => { const v = S().days[daySel.value] || {}; $('#pc-hint').value = v.hint || ''; $('#pc-msg').value = v.msg || ''; };
    daySel.onchange = fill; fill();
    on('#pc-save', () => { const d = daySel.value; update((s) => { s.days[d] = { ...(s.days[d] || {}), hint: $('#pc-hint').value.trim(), msg: $('#pc-msg').value.trim() }; }); toast(p('saved')); renderPanel(); });
    r.querySelectorAll('[data-dayx]').forEach((b) => b.onclick = () => { update((s) => { const v = s.days[b.dataset.dayx]; if (v) { delete v.hint; delete v.msg; } }); renderPanel(); });
  }
  on('#pk-test', async () => {
    const key = $('#pk-key').value.trim(); const res = $('#pk-res');
    if (!key) { update((s) => (s.kimi.key = '')); res.textContent = ''; return; }
    res.textContent = p('testing'); res.className = 'help';
    const out = await testKimi(key);
    if (out.ok) {
      const model = $('#pk-model').value.trim() || out.model;
      update((s) => { s.kimi = { key, base: out.base, model }; });
      res.textContent = p('okKimi', model); res.className = 'ok';
      $('#pk-model').value = model;
    } else { res.textContent = p('badKimi', out.error); res.className = 'err'; }
  });
  on('#pe-save', () => { update((s) => r.querySelectorAll('[data-elfname]').forEach((i) => (s.elves[i.dataset.elfname] = i.value.trim()))); toast(p('saved')); });
  on('#pe-rebapt', () => { update((s) => { s.elves = { scarf: '', stripe: '', green: '' }; s.named = false; }); toast(p('saved')); go('phone'); });
  on('#pf-save', () => { update((s) => (s.profile = $('#pf-text').value.trim())); toast(p('saved')); });
  on('#pw-save', () => { const v = $('#pw-text').value.trim(); if (!v) return; update((s) => s.wishes.push({ id: uid(), date: today(), kid: parentWho, text: v, from: 'parents' })); toast(p('saved')); renderPanel(); });
  on('#vs-test', async () => {
    const url = $('#vs-url').value.trim(), token = $('#vs-token').value.trim(), res = $('#vs-res');
    update((s) => (s.voiceServer = { url, token })); A.setVoiceServer(S().voiceServer);
    if (!url) { res.textContent = ''; return; }
    A.unlock(); res.textContent = p('testing'); res.className = 'help';
    const ok = await A.prepareVoice('santa', lang(), lang() === 'es' ? `¡Jo, jo, jo! Prueba de voz número ${Math.floor(Math.random() * 1000)}.` : `Ho, ho, ho! Voice test number ${Math.floor(Math.random() * 1000)}.`, 20000);
    const st = await serverStatus();
    const kimiTxt = st && st.kimi && st.kimi.model ? ` · Kimi ✓ (${st.kimi.model})` : st && st.kimi && st.kimi.error ? ` · Kimi ❌ ${st.kimi.error}` : ' · Kimi: no configurado en Cloudflare';
    if (ok) { res.textContent = '✓ Voces' + kimiTxt; res.className = 'ok'; A.speak(lang() === 'es' ? '¡Jo, jo, jo! ¡Ya tengo mi voz para hablar con ustedes!' : 'Ho, ho, ho! I have my voice to talk with you!', { who: 'santa', lang: lang() }); }
    else { res.textContent = '❌'; res.className = 'err'; }
  });
  const ld = r.querySelector('#pl-date'); if (ld) ld.onchange = () => { if (ld.value && ld.value <= today()) { update((s) => (s.launch = ld.value)); toast(p('saved')); } };
  on('#pb-exp', () => {
    const blob = new Blob([exportData()], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `polo-norte-${today()}.json`; a.click();
  });
  const imp = r.querySelector('#pb-imp'); if (imp) imp.onchange = async () => { try { importData(await imp.files[0].text()); toast(p('saved')); applyTexts(); renderPanel(); } catch (e) { toast('❌'); } };
  on('#pp-pin', () => { update((s) => (s.pin = null)); pinBuf = ''; renderPin(); });
  on('#pr-reset', () => { if (confirm(p('resetQ'))) { resetAll(); applyTexts(); renderPanel(); } });
}
$('#btn-parents').addEventListener('click', () => { A.sfx.tap(); go('parents'); });
$('#btn-parents-phone').addEventListener('click', (e) => { e.stopPropagation(); cancelAnimationFrame(phoneRAF); go('parents'); });
const homeScreen = () => (S().named ? 'hub' : 'phone');

/* ================== barra superior ================== */
$('#btn-back').addEventListener('click', () => { A.sfx.tap(); go(current === 'parents' ? homeScreen() : 'hub'); });
$('#btn-lang').addEventListener('click', () => {
  A.unlock(); A.sfx.tap(); A.stopVoice();
  update((s) => (s.lang = s.lang === 'es' ? 'en' : 'es'));
  applyTexts(); greeted.clear();
  if (current !== 'phone') { const e = ENTER[current]; if (current === 'hub') { placeTags(); tickCountdown(); } else if (e && current !== 'naming' && current !== 'santa') e(); }
});
$('#btn-sound').addEventListener('click', () => {
  A.unlock();
  update((s) => (s.muted = !s.muted)); A.setMuted(S().muted); applyTexts();
  if (!S().muted) A.sfx.jingle();
});

/* ================== inicio ================== */
applyTexts();
paintIcons();
initSky($('#sky'));
A.loadRecorded();
// Link privado de papás: #setup=<base64> trae el perfil, los deseos y el servidor de voces
function readSetup() {
  const m = location.hash.match(/setup=([A-Za-z0-9_-]+)/);
  if (!m) return;
  try {
    const json = decodeURIComponent(escape(atob(m[1].replace(/-/g, '+').replace(/_/g, '/'))));
    if (applySetup(JSON.parse(json))) setTimeout(() => toast(lang() === 'es' ? '🎅 ¡Santa ya conoce a la familia!' : '🎅 Santa knows the family now!', 4000), 600);
  } catch (e) { console.warn('setup', e); }
  history.replaceState(null, '', location.pathname + location.search);
}
readSetup();
addEventListener('hashchange', readSetup);
A.setVoiceServer(S().voiceServer);
// Cualquier toque reactiva el sonido (iPad lo pausa al volver de otra app)
document.addEventListener('pointerdown', () => A.unlock(), { capture: true, passive: true });
tickCountdown();
// Al volver a la app después de un rato, se vuelve a "llamar"
let hiddenAt = 0;
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { hiddenAt = Date.now(); A.stopVoice(); A.stopSong(0.1); }
  else if (hiddenAt && Date.now() - hiddenAt > 10 * 60 * 1000 && current !== 'parents') { go('gate', { instant: true }); }
  else { A.unlock(); A.resumeMusic(); }
});
ENTER.phone = ENTER_PHONE;

/* ================== 0. Clave mágica ==================
   La clave es 1521: el 15 de diciembre (cumpleaños de Sophie) y el 21 (cumpleaños de Alana). */
const GATE_CODE = '1521';
const GATE = {
  intro: '¡Jo, jo, jo! Hola, Sophie y Alana. La Línea Directa al Polo Norte está cerrada con un candado mágico. La clave tiene cuatro números, y es muy especial, porque abre los dos días más felices de su diciembre. ¿Cuáles serán?',
  hints: [
    'Primera pista: en diciembre hay dos días con torta, velitas y la canción de feliz cumpleaños.',
    'Segunda pista: la clave son los días de sus cumpleaños. Primero el de Sophie, que es la hermana mayor, y después el de Alana.',
    'Última pista: Sophie cumple el quince y Alana cumple el veintiuno. ¡Pónganlos juntitos, uno detrás del otro!',
  ],
  wrong: ['¡Uy, casi! Esa no es la clave mágica. ¡Inténtenlo otra vez!', '¡Jo, jo! El candado sigue cerrado. Piensen en sus cumpleaños.'],
  right: '¡Jo, jo, jo! ¡Lo lograron! Esa es la clave mágica de sus cumpleaños. ¡Bienvenidas a la Línea Directa al Polo Norte!',
};
let gateBuf = '', gateHint = 0, gateWrong = 0, gateBusy = false, gateAlive = false, gateSanta = null, gateOpen = 0, gateStarted = false, gateShake = 0;
function gateScene() {
  const cv = $('#gate-cv'); const W = 192, H = 104;
  const st = makeStage(cv, W, H);
  gateSanta = new SantaActor(66, 106);
  gateAlive = true; let last = performance.now(); const snow = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 6 + Math.random() * 9 }));
  const sparks = [];
  const frame = (now) => {
    if (!gateAlive) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now; const t = now / 1000;
    const g = st.b;
    g.fillStyle = '#141a4e'; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(90,240,170,0.18)'; for (let x = 0; x < W; x++) g.fillRect(x, Math.round(14 + Math.sin(x * 0.06 + t * 0.5) * 5), 1, 6);
    g.fillStyle = '#fff6d6'; g.beginPath(); g.arc(24, 18, 7, 0, 7); g.fill();
    g.fillStyle = '#e9efff'; g.fillRect(0, 94, W, 10); g.fillStyle = '#c4d0f0'; for (let x = 0; x < W; x += 7) g.fillRect(x, 96 + (x % 3), 3, 1);
    gateSanta.update(dt); gateSanta.draw(g, 1);
    // candado gigante
    const ox = 150 + (gateShake > 0 ? (Math.floor(t * 40) % 2 ? 2 : -2) : 0), oy = 50 + Math.round(Math.sin(t * 2) * 1.5);
    gateShake = Math.max(0, gateShake - dt);
    const lift = Math.round(gateOpen * 14);
    g.fillStyle = '#8a8496'; g.fillRect(ox - 13, oy - 22 - lift, 5, 24); g.fillRect(ox - 13, oy - 26 - lift, 26, 5);
    g.fillStyle = '#c9c4d6'; g.fillRect(ox - 12, oy - 25 - lift, 24, 2); g.fillRect(ox - 12, oy - 22 - lift, 2, 22);
    if (gateOpen < 0.5) { g.fillStyle = '#8a8496'; g.fillRect(ox + 8, oy - 22 - lift, 5, 24); g.fillStyle = '#c9c4d6'; g.fillRect(ox + 9, oy - 22 - lift, 2, 22); }
    else { g.fillStyle = '#8a8496'; g.fillRect(ox + 8, oy - 22 - lift, 5, 12); }
    g.fillStyle = '#2a1424'; g.fillRect(ox - 21, oy - 1, 42, 36);
    g.fillStyle = '#ffd23f'; g.fillRect(ox - 20, oy, 40, 34); g.fillStyle = '#fff3a0'; g.fillRect(ox - 20, oy, 40, 3); g.fillRect(ox - 20, oy, 3, 34); g.fillStyle = '#c99a1c'; g.fillRect(ox - 20, oy + 30, 40, 4); g.fillRect(ox + 16, oy, 4, 34);
    // copito en el candado y cerradura
    g.fillStyle = '#e03a3a'; g.fillRect(ox - 3, oy + 8, 6, 6); g.fillRect(ox - 1, oy + 13, 2, 9);
    g.fillStyle = '#fff'; [[-12, 8], [12, 8], [-12, 24], [12, 24]].forEach(([dx, dy]) => { g.fillRect(ox + dx - 1, oy + dy, 3, 1); g.fillRect(ox + dx, oy + dy - 1, 1, 3); });
    // estrellitas
    if (gateOpen > 0 && Math.random() < 0.6) sparks.push({ x: ox + (Math.random() - 0.5) * 50, y: oy + (Math.random() - 0.5) * 50, life: 0.8 });
    if (Math.floor(t * 2) % 3 === 0) { g.fillStyle = '#fff6b0'; g.fillRect(ox + 12, oy + 4, 1, 3); g.fillRect(ox + 11, oy + 5, 3, 1); }
    for (let i = sparks.length - 1; i >= 0; i--) { const s = sparks[i]; s.life -= dt; s.y -= 12 * dt; if (s.life <= 0) { sparks.splice(i, 1); continue; } g.fillStyle = Math.random() < 0.5 ? '#ffd23f' : '#fff'; g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); g.fillRect(Math.round(s.x) - 1, Math.round(s.y), 3, 1); }
    g.fillStyle = '#fff'; snow.forEach((s) => { s.y += s.v * dt; if (s.y > H) { s.y = 0; s.x = Math.random() * W; } g.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); });
    st.c.imageSmoothingEnabled = false; st.c.drawImage(st.buf, 0, 0, cv.width, cv.height);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
function gateSlots() { $$('#gate-slots i').forEach((el, i) => { el.textContent = gateBuf[i] || ''; el.classList.toggle('on', i < gateBuf.length); }); }
async function santaSays(text) { return sayIn($('#gate-text'), text, { who: 'santa', actor: gateSanta }); }
ENTER.gate = () => {
  gateBuf = ''; gateOpen = 0; gateHint = 0; gateWrong = 0; gateStarted = false;
  $('#gate-slots').classList.remove('good', 'bad'); gateSlots();
  $('#gate-pad').classList.add('hidden'); $('#gate-start').classList.remove('hidden');
  $('#gate-text').textContent = 'El Polo Norte está cerrado con un candado mágico…';
  gateScene();
  leaveHooks.gate = () => { gateAlive = false; };
};
async function gateBegin() {
  if (gateStarted) return; gateStarted = true;
  A.unlock(); A.sfx.jingle(); A.playSong('silent', { vol: 0.35 });
  $('#gate-start').classList.add('hidden'); $('#gate-pad').classList.remove('hidden');
  gateSanta.do('laugh'); A.sfx.hoho();
  await santaSays(GATE.intro);
  gateSanta.do('wave');
}
$('#gate-start').addEventListener('click', gateBegin);
$('#gate-cv').addEventListener('click', () => { if (!gateStarted) gateBegin(); else { gateSanta.do('laugh'); A.sfx.hoho(); } });
$$('#gate-pad button').forEach((b) => b.addEventListener('click', async () => {
  if (gateBusy) return;
  A.unlock(); if (!gateStarted) gateBegin();
  const k = b.dataset.k;
  if (k === 'hint') {
    A.sfx.sparkle(); gateSanta.do('wink');
    const h = GATE.hints[Math.min(gateHint, GATE.hints.length - 1)]; gateHint++;
    await santaSays(h); return;
  }
  if (k === 'del') { gateBuf = gateBuf.slice(0, -1); A.sfx.pop(); gateSlots(); return; }
  if (gateBuf.length >= 4) return;
  gateBuf += k; A.sfx.key(+k); gateSlots();
  if (gateBuf.length < 4) return;
  gateBusy = true;
  await sleep(350);
  if (gateBuf === GATE_CODE) {
    $('#gate-slots').classList.add('good'); A.stopVoice();
    A.sfx.unwrap(); for (let i = 0; i <= 10; i++) { gateOpen = i / 10; await sleep(40); }
    A.sfx.fanfare(); confettiBurst(); skyFx('fireworks'); gateSanta.do('laugh');
    await santaSays(GATE.right);
    await sleep(500);
    gateBusy = false; gateAlive = false;
    go('phone');
  } else {
    gateWrong++; gateShake = 0.6;
    $('#gate-slots').classList.remove('bad'); void $('#gate-slots').offsetWidth; $('#gate-slots').classList.add('bad');
    A.sfx.locked();
    await sleep(300);
    gateBuf = ''; gateSlots();
    gateBusy = false;
    // después de 2 intentos, Santa regala la siguiente pista solito
    const line = gateWrong >= 2 && gateHint < GATE.hints.length ? GATE.hints[gateHint++] : GATE.wrong[(gateWrong - 1) % GATE.wrong.length];
    await santaSays(line);
  }
}));
// Para pruebas: ?go=hub
const q = new URLSearchParams(location.search);
if (q.get('go')) { A.unlock(); go(q.get('go'), { instant: true }); }
else ENTER.gate();
