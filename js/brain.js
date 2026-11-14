// Conversación con Kimi (Moonshot). La key vive solo en este dispositivo.
import { S, KIDS, today, daysLeft, ageOn, birthdayThisYear, diaryRecent, starsOf } from './store.js';
import { ELF_INFO, elfName } from './i18n.js';
import { offlineReply, offlineGreeting, offlineSanta } from './content.js';

export const hasKimi = () => !!(S().kimi && S().kimi.key);

async function call(messages, { maxTokens = 220, temperature = 0.7, timeout = 20000 } = {}) {
  const k = S().kimi;
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(`${k.base.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k.key}` },
      body: JSON.stringify({ model: k.model || 'kimi-k2-turbo-preview', messages, temperature, max_tokens: maxTokens }),
      signal: ctl.signal,
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const txt = j.choices?.[0]?.message?.content || '';
    if (!txt.trim()) throw new Error('empty');
    return txt.trim();
  } finally { clearTimeout(tm); }
}

// Prueba la key, busca el mejor modelo disponible y el servidor correcto (.ai o .cn)
export async function testKimi(key) {
  const bases = ['https://api.moonshot.ai/v1', 'https://api.moonshot.cn/v1'];
  let lastErr = '';
  for (const base of bases) {
    try {
      const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${key}` } });
      if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
      const j = await r.json();
      const ids = (j.data || []).map((m) => m.id);
      const pref = [/^kimi-k2\.\d+-turbo/, /^kimi-k2-turbo/, /^kimi-k2\.\d+$/, /^kimi-k2-\d{4}/, /^kimi-k2/, /^kimi-latest/, /^moonshot-v1-8k$/];
      let model = '';
      for (const re of pref) { const m = ids.filter((x) => re.test(x) && !/thinking|vision/.test(x)).sort().reverse()[0]; if (m) { model = m; break; } }
      if (!model) model = ids[0] || 'kimi-k2-turbo-preview';
      return { ok: true, base, model, ids };
    } catch (e) { lastErr = e.message; }
  }
  return { ok: false, error: lastErr };
}

function context(kid, lang) {
  const s = S();
  const es = lang === 'es';
  const lines = [];
  const now = new Date();
  lines.push(`Today is ${now.toDateString()}. Days until Christmas: ${daysLeft()}.`);
  for (const k of ['sophie', 'alana']) {
    const b = birthdayThisYear(k);
    lines.push(`${KIDS[k].name}: ${ageOn(k)} years old, birthday on ${b.date} (turns ${b.turns}).`);
  }
  lines.push('The family: mom, dad (papá), the sisters Sophie and Alana, and their dog Thor. They live in Vietnam, where it is warm and there is no snow.');
  lines.push(`The three elves at home: ${['scarf', 'stripe', 'green'].map((id) => `${elfName(id)} (${ELF_INFO[id].en.bio.split(',')[0]})`).join('; ')}.`);
  const diary = diaryRecent(10);
  if (diary.length) lines.push('What the parents told the elves recently (use it naturally, as if the elves saw it with their magic, never say the parents told you):\n' + diary.map((d) => `- ${d.date} [${d.kid}]: ${d.text}`).join('\n'));
  const stars = s.stars.slice(-8);
  if (stars.length) lines.push('Stars on the Nice List:\n' + stars.map((x) => `- ${x.date} [${x.kid}]: ${x.reason}${x.reward ? ` (reward: ${x.reward})` : ''}`).join('\n'));
  const wishes = s.wishes.slice(-8);
  if (wishes.length) lines.push('Wishes already noted:\n' + wishes.map((w) => `- [${w.kid}] ${w.text}`).join('\n'));
  return lines.join('\n');
}

const SAFETY = `Rules you must always follow:
- You are talking with a young child. Use very simple, warm words. Short replies: 1 to 3 short sentences, max 45 words. At most one emoji.
- Never break character. Never say you are an AI, a computer, a program or a model. You are a real elf at the North Pole.
- Never promise a specific gift. If the child wishes for something, say you will tell Santa and add at the very end the tag [WISH: short description].
- Never say Santa might not come, never threaten, never mention the "naughty list". If something went wrong, encourage gently and say tomorrow is a new chance.
- If the child sounds sad, scared, hurt or mentions danger, comfort them and tell them to talk to mom or dad right away.
- Never ask for personal info like address, school, phone or passwords. Never suggest leaving the house or talking to strangers.
- No scary, violent or grown-up topics. If asked something odd, answer playfully and steer back to Christmas magic.
- If asked how Santa or magic works, keep the magic alive with a fun answer.
- Ask a small friendly question back sometimes to keep the chat going.`;

export async function elfReply(elfId, kid, history, lang) {
  const name = elfName(elfId);
  const kidName = kid === 'both' ? 'Sophie and Alana (both sisters together)' : KIDS[kid].name;
  const sys = `You are ${name}, a friendly Christmas elf who ${ELF_INFO[elfId].en.bio}
You are one of three elves Santa sent to watch over and cheer the two sisters. Right now ${kidName} is calling the North Pole Hotline on a magic phone.
Reply ONLY in ${lang === 'es' ? 'Spanish (warm Latin American Spanish, simple words, like talking to a ' + (kid === 'alana' ? '4 or 5' : '7 or 8') + ' year old)' : 'English (simple words for a young child)'}.
${SAFETY}

${context(kid, lang)}`;
  const msgs = [{ role: 'system', content: sys }, ...history.slice(-12).map((m) => ({ role: m.from === 'kid' ? 'user' : 'assistant', content: m.text }))];
  if (!hasKimi()) return offlineReply(history[history.length - 1].text, { lang, kid, elf: elfId, elfName: name });
  try {
    const raw = await call(msgs);
    let wish = null;
    const m = raw.match(/\[(?:WISH|DESEO)\s*:\s*([^\]]+)\]/i);
    if (m) wish = m[1].trim();
    const text = raw.replace(/\[(?:WISH|DESEO)\s*:[^\]]*\]/gi, '').trim();
    return { text, wish };
  } catch (e) {
    console.warn('Kimi', e);
    return offlineReply(history[history.length - 1].text, { lang, kid, elf: elfId, elfName: name });
  }
}

export async function elfGreeting(elfId, kid, lang) {
  if (!hasKimi()) return offlineGreeting({ lang, kid, elfName: elfName(elfId) });
  const name = elfName(elfId);
  const kidName = kid === 'both' ? 'Sophie and Alana together' : KIDS[kid].name;
  const sys = `You are ${name}, a Christmas elf who ${ELF_INFO[elfId].en.bio} ${kidName} just called the North Pole Hotline.
Say hello in ${lang === 'es' ? 'Spanish' : 'English'} in 1 or 2 short sentences (max 30 words). If there is something recent and nice in the notes below, mention it as if you saw it with elf magic. End with a small question.
${SAFETY}

${context(kid, lang)}`;
  try { return await call([{ role: 'system', content: sys }, { role: 'user', content: '(the phone just connected)' }], { maxTokens: 120 }); }
  catch (e) { return offlineGreeting({ lang, kid, elfName: name }); }
}

export async function santaMessage(kid, lang) {
  if (!hasKimi()) return offlineSanta({ lang, kid });
  const kidName = kid === 'both' ? 'Sophie and Alana (write to both sisters)' : KIDS[kid].name;
  const sys = `You are Santa Claus writing a short warm letter that will be read aloud to ${kidName}.
Write ONLY in ${lang === 'es' ? 'Spanish (warm Latin American Spanish)' : 'English'}.
- 70 to 120 words, simple words for young children, 3 or 4 short paragraphs.
- Start with "¡Jo, jo, jo!" (or "Ho, ho, ho!") and the child's name. End with a short loving sign-off from Santa.
- Mention 1 or 2 specific nice things from the notes below as if the elves told you. Mention how many days are left until Christmas and something fun happening at the North Pole (reindeer, Mrs. Claus, the workshop). If a birthday is close, celebrate it.
- Make every letter different. Never promise specific gifts. Never mention a naughty list or threats. Never break character.

${context(kid, lang)}`;
  try { return await call([{ role: 'system', content: sys }, { role: 'user', content: `Write a new letter now. Variation seed: ${Math.random().toString(36).slice(2, 6)}` }], { maxTokens: 400, temperature: 0.9, timeout: 30000 }); }
  catch (e) { return offlineSanta({ lang, kid }); }
}
