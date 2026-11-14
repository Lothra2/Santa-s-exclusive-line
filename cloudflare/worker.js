// VERSIÓN 6. Puente del Polo Norte (Cloudflare Worker): voces de Fish Audio y conversaciones con Kimi.
// Secretos en Cloudflare:
//   FISH_API_KEY  key de Fish Audio
//   KIMI_API_KEY  key de Kimi (Moonshot)
//   ACCESS_TOKEN  la clave que también va en la página (link privado o panel de papás)
// Opcional: KIMI_MODEL para forzar un modelo. Si no está, el Worker escoge el mejor disponible.
//
// Rutas:  POST /      o /tts   → audio mp3 con la voz pedida
//         POST /chat           → respuesta de Kimi (formato chat/completions)
//         POST /asr            → texto de lo que dijo la niña (audio grabado → Fish Audio)
//         GET  /status         → qué está configurado
const VOICES = {
  santa_es: '7e778565d6c04034b8f8dacbd4418cc7',
  santa_en: '31088114f4114db98de61c41c2f163db',
  scarf_es: '541dad35db004c03a11e33c439fad693',
  stripe_es: '546a9688254942d38761b203667c1e0f',
  green_es: 'fe30d67ab5b74751b2554129e93b816c',
  scarf_en: 'b9011feb3c6f46ddaeb90043fab0eb4a',
  stripe_en: 'b9011feb3c6f46ddaeb90043fab0eb4a',
  green_en: 'ee2fa25a56364be9a80d0028eecc6ea4',
};
const ALLOWED = ['https://lothra2.github.io', 'http://localhost:8000', 'http://localhost:8765'];
const KIMI_BASES = ['https://api.moonshot.ai/v1', 'https://api.moonshot.cn/v1'];
let kimiCfg = null; // se calcula una vez: { base, models: [en orden de preferencia], ids }

// Preferimos modelos rápidos de chat. Los de código nunca. Los que "piensan" se usan con el pensamiento apagado.
const PREF = [/^kimi-k2-turbo/, /^kimi-k2-\d{4}-preview$/, /^kimi-latest/, /^moonshot-v1-8k$/, /^kimi-k3\.\d+-pro$/, /^kimi-k2\.\d+$/, /^kimi-k3$/, /^kimi-k3\.\d+$/, /^kimi-k2\.\d+-turbo/, /^kimi-k3/, /^kimi-k2/];
async function findKimi(env) {
  if (kimiCfg) return kimiCfg;
  let lastErr = '';
  for (const base of KIMI_BASES) {
    const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${env.KIMI_API_KEY}` } });
    if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
    const ids = ((await r.json()).data || []).map((m) => m.id);
    const models = [];
    if (env.KIMI_MODEL) models.push(env.KIMI_MODEL);
    for (const re of PREF) for (const id of ids.filter((x) => re.test(x) && !/thinking|vision|code/.test(x)).sort().reverse()) if (!models.includes(id)) models.push(id);
    if (!models.length && ids.length) models.push(ids[0]);
    kimiCfg = { base, models: models.slice(0, 5), ids, ok: null };
    return kimiCfg;
  }
  throw new Error(`La key de Kimi no funcionó en moonshot.ai ni en moonshot.cn (${lastErr})`);
}

// Formas de pedir la respuesta, de la más rápida a la más permisiva
const VARIANTS = [
  (t, m) => ({ thinking: { type: 'disabled' }, temperature: t, max_tokens: m }),
  (t, m) => ({ thinking: { type: 'disabled' }, max_tokens: m }),
  (t, m) => ({ temperature: t, max_tokens: m }),
  (t, m) => ({ max_tokens: m }),
  (t, m) => ({ max_tokens: Math.max(m * 6, 1500) }), // modelos que piensan sí o sí: más espacio para que alcancen a responder
];
const contentOf = (j) => (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content || '').trim();

// Intenta modelos y variantes hasta obtener una respuesta con texto. Recuerda la combinación que funcionó.
async function kimiChat(env, messages, temperature, maxTokens, force = {}) {
  const cfg = await findKimi(env);
  const errors = [];
  const models = force.model ? [force.model] : cfg.models;
  const combos = [];
  if (cfg.ok && !force.model && force.variant == null) combos.push(cfg.ok);
  for (const model of models) for (let v = 0; v < VARIANTS.length; v++) if (force.variant == null || force.variant === v) combos.push({ model, v });
  const t0 = Date.now();
  for (const c of combos) {
    if (Date.now() - t0 > 25000) break;
    let r;
    try {
      r = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.KIMI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: c.model, messages, ...VARIANTS[c.v](temperature, maxTokens) }),
        signal: AbortSignal.timeout(12000),
      });
    } catch (e) { errors.push(`${c.model}#${c.v} tardó demasiado`); continue; }
    if (r.status === 401) { kimiCfg = null; throw new Error('Key de Kimi rechazada'); }
    if (!r.ok) { errors.push(`${c.model}#${c.v} ${r.status}: ${(await r.text()).slice(0, 120)}`); continue; }
    const j = await r.json();
    if (contentOf(j)) {
      if (!force.model && force.variant == null) cfg.ok = c;
      j.via = `${c.model}#${c.v}`;
      return j;
    }
    errors.push(`${c.model}#${c.v} sin texto (${j.choices && j.choices[0] && j.choices[0].finish_reason})`);
  }
  throw new Error(errors.slice(-3).join(' | ') || 'sin respuesta');
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const origin = req.headers.get('origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
      'Access-Control-Allow-Headers': 'content-type, x-token',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      Vary: 'Origin',
    };
    const text = (msg, status = 200) => new Response(msg, { status, headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'GET' && url.pathname !== '/status') return text('Puente de voces del Polo Norte funcionando 🎅');
    if (!ALLOWED.includes(origin)) return text('Origen no permitido', 403);
    if (env.ACCESS_TOKEN && req.headers.get('x-token') !== env.ACCESS_TOKEN) return text('Clave incorrecta', 403);

    if (url.pathname === '/status') {
      let kimi = null;
      if (env.KIMI_API_KEY) { try { const c = await findKimi(env); kimi = { base: c.base, model: c.models[0], candidates: c.models, working: c.ok, available: c.ids.slice(0, 40) }; } catch (e) { kimi = { error: e.message }; } }
      return json({ version: 6, fish: !!env.FISH_API_KEY, asr: !!env.FISH_API_KEY, kimi });
    }
    if (req.method !== 'POST') return text('Método no permitido', 405);

    // ---- Oído: voz grabada → texto con Fish Audio ----
    if (url.pathname === '/asr') {
      if (!env.FISH_API_KEY) return text('Fish no está configurado', 501);
      const type = (req.headers.get('content-type') || 'audio/webm').split(';')[0];
      const audio = await req.arrayBuffer();
      if (audio.byteLength < 800 || audio.byteLength > 5000000) return text('Audio inválido', 400);
      const ext = type.includes('mp4') || type.includes('aac') || type.includes('m4a') ? 'm4a' : type.includes('wav') ? 'wav' : type.includes('mpeg') ? 'mp3' : type.includes('ogg') ? 'ogg' : 'webm';
      for (let attempt = 0; attempt < 2; attempt++) {
        const fd = new FormData();
        fd.append('audio', new Blob([audio], { type }), `voz.${ext}`);
        fd.append('language', 'es');
        fd.append('ignore_timestamps', 'true');
        const r = await fetch('https://api.fish.audio/v1/asr', { method: 'POST', headers: { Authorization: `Bearer ${env.FISH_API_KEY}` }, body: fd });
        if (r.ok) { const j = await r.json(); return json({ text: String(j.text || '').trim() }); }
        if (r.status !== 429 && r.status < 500) return text(`Fish ASR respondió ${r.status}`, 502);
        await new Promise((ok) => setTimeout(ok, 700));
      }
      return text('Fish ASR no respondió', 502);
    }

    let body;
    try { body = await req.json(); } catch { return text('JSON inválido', 400); }

    // ---- Kimi ----
    if (url.pathname === '/chat') {
      if (!env.KIMI_API_KEY) return text('Kimi no está configurado', 501);
      const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : null;
      if (!messages || !messages.length) return text('Petición inválida', 400);
      try {
        const force = { model: typeof body.model === 'string' ? body.model : null, variant: Number.isInteger(body.variant) ? body.variant : null };
        const j = await kimiChat(env, messages, Math.min(1, Math.max(0, +body.temperature || 0.7)), Math.min(600, +body.max_tokens || 220), force);
        return json(j);
      } catch (e) { return text(`Kimi: ${e.message}`, 502); }
    }

    // ---- Voces Fish Audio ----
    const say = String(body.text || '').trim();
    const ref = VOICES[body.voice];
    if (!ref || !say || say.length > 1200) return text('Petición inválida', 400);
    let r;
    for (let attempt = 0; attempt < 3; attempt++) {
      r = await fetch('https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.FISH_API_KEY}`, 'Content-Type': 'application/json', model: 's1' },
        body: JSON.stringify({ text: say, reference_id: ref, format: 'mp3', mp3_bitrate: 64, normalize: true }),
      });
      if (r.ok || (r.status !== 429 && r.status < 500)) break;
      await new Promise((ok) => setTimeout(ok, 600 * (attempt + 1)));
    }
    if (!r.ok) return text(`Fish Audio respondió ${r.status}`, 502);
    return new Response(r.body, { headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  },
};
