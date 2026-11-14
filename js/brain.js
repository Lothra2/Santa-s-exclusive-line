// Conversación con Kimi (Moonshot). Primero por el Worker de Cloudflare (la key vive allá).
// Si no hay Worker, con una key guardada en este dispositivo.
import { S, KIDS, today, daysLeft, ageOn, birthdayThisYear, diaryRecent, starsOf } from './store.js';
import { ELF_INFO, elfName } from './i18n.js';
import { offlineReply, offlineGreeting, offlineSanta } from './content.js';

const viaServer = () => !!(S().voiceServer && S().voiceServer.url);
export const hasKimi = () => viaServer() || !!(S().kimi && S().kimi.key);
const serverURL = (path) => S().voiceServer.url.replace(/\/$/, '') + path;

// Revisa qué tiene configurado el Worker (voces y Kimi)
export async function serverStatus() {
  if (!viaServer()) return null;
  try {
    const r = await fetch(serverURL('/status'), { headers: { 'x-token': S().voiceServer.token || '' } });
    if (!r.ok) return { error: `HTTP ${r.status}` };
    return await r.json();
  } catch (e) { return { error: e.message }; }
}

// Modelos probados con la cuenta de la familia: responden en 2 segundos con el pensamiento apagado (variante 1 del Worker)
const SERVER_MODELS = ['kimi-k3.1-pro', 'kimi-k2.6', 'kimi-k3'];

async function fetchJSON(url, opts, timeout) {
  const ctl = new AbortController();
  const tm = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(url, { ...opts, signal: ctl.signal });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const j = await r.json();
    const txt = (j.choices?.[0]?.message?.content || '').trim();
    if (!txt) throw new Error('empty');
    return txt;
  } finally { clearTimeout(tm); }
}

async function call(messages, { maxTokens = 220, temperature = 0.7, timeout = 15000 } = {}) {
  if (viaServer()) {
    let lastErr;
    for (const model of SERVER_MODELS) {
      try {
        return await fetchJSON(serverURL('/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-token': S().voiceServer.token || '' },
          body: JSON.stringify({ messages, temperature, max_tokens: maxTokens, model, variant: 1 }),
        }, timeout);
      } catch (e) { lastErr = e; }
    }
    throw lastErr;
  }
  const k = S().kimi;
  return fetchJSON(`${k.base.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k.key}` },
    body: JSON.stringify({ model: k.model || 'kimi-k2-turbo-preview', messages, temperature, max_tokens: maxTokens }),
  }, timeout + 10000);
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
  if (s.profile && s.profile.trim()) lines.push('What Santa knows about the family (private notes from the parents, use them warmly and naturally, never read them like a list):\n' + s.profile.trim());
  lines.push(`The three elves at home: ${['scarf', 'stripe', 'green'].map((id) => `${elfName(id)} (${ELF_INFO[id].en.bio.split(',')[0]})`).join('; ')}.`);
  const diary = diaryRecent(10);
  if (diary.length) lines.push('What the parents told the elves recently (use it naturally, as if the elves saw it with their magic, never say the parents told you):\n' + diary.map((d) => `- ${d.date} [${d.kid}]: ${d.text}`).join('\n'));
  const stars = s.stars.slice(-8);
  if (stars.length) lines.push('Stars on the Nice List:\n' + stars.map((x) => `- ${x.date} [${x.kid}]: ${x.reason}${x.reward ? ` (reward: ${x.reward})` : ''}`).join('\n'));
  const wishes = s.wishes.slice(-16);
  if (wishes.length) lines.push('Christmas wishes Santa already knows (you may say Santa knows about them with excitement, but NEVER promise them):\n' + wishes.map((w) => `- [${w.kid}] ${w.text}`).join('\n'));
  const mem = s.memories.slice(-25);
  if (mem.length) lines.push('Things the girls told the elves in earlier chats (remember them like a loving friend and bring one up when it fits):\n' + mem.map((m) => `- ${m.date} [${m.kid}]: ${m.text}`).join('\n'));
  return lines.join('\n');
}

const SAFETY = `Rules you must always follow:
- You are talking with a young child. Use very simple, warm words. Short replies: 1 to 3 short sentences, max 45 words. At most one emoji.
- Never break character. Never say you are an AI, a computer, a program or a model. You are a real elf at the North Pole.
- Never promise a specific gift. If the child wishes for something, say you will tell Santa and add at the very end the tag [WISH: short description].
- Never say Santa might not come, never threaten, never mention the "naughty list". If something went wrong, encourage gently and say tomorrow is a new chance.
- If the child sounds sad, scared, hurt or mentions danger, comfort them and tell them to talk to mom or dad right away.
- Never ask for an address, phone numbers or passwords. Never suggest leaving the house or talking to strangers. You may ask about their day at school, their teachers and friends.
- No scary, violent or grown-up topics. If asked something odd, answer playfully and steer back to Christmas magic.
- If asked how Santa or magic works, keep the magic alive with a fun answer.
- Ask a small friendly question back sometimes to keep the chat going.`;

const HEART = `How to make them feel loved (very important):
- Make the girls feel pampered, special and deeply loved by Santa and the elves. Use their names. Celebrate them.
- Be curious about their life: their day at school, their teachers, friends, what made them laugh, what they are grateful for, their favorite memories of their trips, and what else they would love for Christmas (discover new wishes little by little and tag them).
- Praise how brave they are for traveling and living in different countries, and how happy their new adventures can be.
- The family believes in God. When it fits naturally, speak sweetly and simply about God's love, gratitude, prayer, kindness and baby Jesus as the heart of Christmas. Help them notice how fortunate and blessed they are, with joy, never preachy.
- Remember earlier chats and bring back one detail now and then, so it feels like a real friendship that grows day by day.`;

export async function elfReply(elfId, kid, history, lang) {
  const name = elfName(elfId);
  const kidName = kid === 'both' ? 'Sophie and Alana (both sisters together)' : KIDS[kid].name;
  const sys = `You are ${name}, a friendly Christmas elf who ${ELF_INFO[elfId].en.bio}
You are one of three elves Santa sent to watch over and cheer the two sisters. Right now ${kidName} is calling the North Pole Hotline on a magic phone.
Reply ONLY in ${lang === 'es' ? 'Spanish (warm Latin American Spanish, simple words, like talking to a ' + (kid === 'alana' ? '4 or 5' : '7 or 8') + ' year old)' : 'English (simple words for a young child)'}.
${SAFETY}
${HEART}

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
Say hello in ${lang === 'es' ? 'Spanish' : 'English'} in 1 or 2 short sentences (max 35 words). If there is something recent and nice in the notes or earlier chats below, mention it as if you saw it with elf magic. End with a small curious question about their day, school, a memory or a wish.
${SAFETY}
${HEART}

${context(kid, lang)}`;
  try { return await call([{ role: 'system', content: sys }, { role: 'user', content: '(the phone just connected)' }], { maxTokens: 120 }); }
  catch (e) { return offlineGreeting({ lang, kid, elfName: name }); }
}

export async function santaMessage(kid, lang) {
  if (!hasKimi()) return offlineSanta({ lang, kid });
  const kidName = kid === 'both' ? 'Sophie and Alana (write to both sisters)' : KIDS[kid].name;
  const sys = `You are Santa Claus writing a short warm letter that will be read aloud to ${kidName}.
Write ONLY in ${lang === 'es' ? 'Spanish (warm Latin American Spanish)' : 'English'}.
- 90 to 140 words, simple words for young children, 3 or 4 short paragraphs.
- Start with "¡Jo, jo, jo!" (or "Ho, ho, ho!") and the child's name. End with a short loving sign-off from Santa.
- Mention 1 or 2 specific things from the notes and earlier chats below as if the elves told you, so the letter shows Santa really knows and follows their life day by day. Mention how many days are left until Christmas and something fun at the North Pole (reindeer, Mrs. Claus, the workshop). If a birthday is close, celebrate it.
- Make them feel pampered and blessed: praise their kindness and their bravery for traveling the world, encourage gratitude, and when it fits add one sweet line about God's love or baby Jesus.
- You may say you know what they dream of for Christmas with a twinkle, but never promise a specific gift.
- Make every letter different. Never mention a naughty list or threats. Never break character.

${context(kid, lang)}`;
  try { return await call([{ role: 'system', content: sys }, { role: 'user', content: `Write a new letter now. Variation seed: ${Math.random().toString(36).slice(2, 6)}` }], { maxTokens: 450, temperature: 0.9, timeout: 25000 }); }
  catch (e) { return offlineSanta({ lang, kid }); }
}

// Saca recuerdos cortos de lo que las niñas contaron en el chat, para que Santa y los elfos los recuerden después
export async function extractMemories(kid, kidMessages) {
  if (!hasKimi() || !kidMessages.length) return [];
  const sys = `You help Santa's elves remember what a child told them. From the child's messages below, extract up to 3 short facts worth remembering later (things she likes, events in her life, friends, school, feelings, trips, wishes, something she is grateful for). Write each fact in Spanish, in third person, max 15 words. Skip greetings and small talk. Reply ONLY with a JSON array of strings, or [] if nothing is worth remembering.`;
  try {
    const raw = await call([{ role: 'system', content: sys }, { role: 'user', content: `Child: ${kid === 'both' ? 'Sophie y Alana' : KIDS[kid].name}\nMessages:\n` + kidMessages.map((m) => '- ' + m).join('\n') }], { maxTokens: 200, temperature: 0.3 });
    const m = raw.match(/\[[\s\S]*\]/);
    const arr = m ? JSON.parse(m[0]) : [];
    return arr.filter((x) => typeof x === 'string' && x.trim()).slice(0, 3).map((x) => x.trim());
  } catch (e) { return []; }
}
