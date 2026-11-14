// Datos de la línea. Se guardan solo en este dispositivo.
const KEY = 'polonorte_v1';

export const KIDS = {
  sophie: { name: 'Sophie', born: '2018-12-15', color: '#9a5cd8' },
  alana: { name: 'Alana', born: '2021-12-21', color: '#f06aa0' },
};

export function today(d = new Date()) {
  const z = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}
export function parseDay(s) { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); }
export function addDays(s, n) { const d = parseDay(s); d.setDate(d.getDate() + n); return today(d); }

function fresh() {
  return {
    v: 1,
    lang: 'es',
    launch: today(),
    pin: null,
    muted: false,
    voice: true,
    kimi: { key: '', base: 'https://api.moonshot.ai/v1', model: '' },
    elves: { scarf: '', stripe: '', green: '' },
    named: false,
    kid: 'sophie',
    diary: [], // {id, date, kid, text}
    stars: [], // {id, date, kid, reason, reward, ts}
    wishes: [], // {id, date, kid, text}
    days: {}, // 'YYYY-MM-DD': {opened, hint, msg}
    chats: { sophie: [], alana: [], both: [] },
    seen: { sophie: 0, alana: 0, both: 0 },
  };
}

let state = null;
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? Object.assign(fresh(), JSON.parse(raw)) : fresh();
  } catch (e) { state = fresh(); }
  // Si la fecha de lanzamiento quedó después de hoy (reloj cambiado), la corregimos
  if (state.launch > today()) state.launch = today();
  return state;
}
export function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
export const S = () => state;
export function update(fn) { fn(state); save(); }

export function exportData() {
  const copy = JSON.parse(JSON.stringify(state));
  copy.kimi = { ...copy.kimi, key: '' }; // la key no viaja en el respaldo
  return JSON.stringify(copy, null, 1);
}
export function importData(txt) {
  const data = JSON.parse(txt);
  if (!data || data.v !== 1) throw new Error('bad');
  const keep = state.kimi;
  state = Object.assign(fresh(), data, { kimi: data.kimi && data.kimi.key ? data.kimi : keep });
  save();
}
export function resetAll() { const k = state.kimi, pin = state.pin; state = fresh(); state.kimi = k; state.pin = pin; save(); }

export const uid = () => Math.random().toString(36).slice(2, 9);

// Edad que cumple este diciembre
export function ageOn(kid, date = new Date()) {
  const b = parseDay(KIDS[kid].born);
  let a = date.getFullYear() - b.getFullYear();
  const bd = new Date(date.getFullYear(), b.getMonth(), b.getDate());
  if (date < bd) a -= 1;
  return a;
}
export function birthdayThisYear(kid, year = new Date().getFullYear()) {
  const b = parseDay(KIDS[kid].born);
  return { date: today(new Date(year, b.getMonth(), b.getDate())), turns: year - b.getFullYear() };
}

export function christmas(now = new Date()) {
  let y = now.getFullYear();
  // después del 26 de diciembre, cuenta para el próximo año
  if (now.getMonth() === 11 && now.getDate() > 26) y += 1;
  return new Date(y, 11, 25, 0, 0, 0);
}
export function daysLeft(now = new Date()) {
  const x = christmas(now);
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((x - a) / 86400000));
}

// Lista de días del calendario: desde el lanzamiento hasta el 25 de diciembre
export function calendarDays() {
  const end = today(christmas());
  const out = [];
  let d = state.launch;
  // como mínimo 24 casillas si se lanzó muy tarde no aplica, se respeta el lanzamiento
  while (d <= end && out.length < 80) { out.push(d); d = addDays(d, 1); }
  return out;
}

export function starsOf(kid) { return state.stars.filter((s) => s.kid === kid || s.kid === 'both'); }
export function diaryRecent(days = 7) {
  const from = addDays(today(), -days);
  return state.diary.filter((d) => d.date >= from).sort((a, b) => (a.date < b.date ? -1 : 1));
}
