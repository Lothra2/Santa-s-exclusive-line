// Puente del Polo Norte (Cloudflare Worker): voces de Fish Audio y conversaciones con Kimi.
// Secretos en Cloudflare:
//   FISH_API_KEY  key de Fish Audio
//   KIMI_API_KEY  key de Kimi (Moonshot)
//   ACCESS_TOKEN  la clave que también va en la página (link privado o panel de papás)
// Opcional: KIMI_MODEL para forzar un modelo. Si no está, el Worker escoge el mejor disponible.
//
// Rutas:  POST /      o /tts   → audio mp3 con la voz pedida
//         POST /chat           → respuesta de Kimi (formato chat/completions)
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

// Preferimos modelos rápidos de chat. Los modelos que "piensan" van al final.
const PREF = [/^kimi-k2-turbo/, /^kimi-k2-\d{4}-preview$/, /^kimi-k2-\d{4}/, /^kimi-k2\.\d+-turbo/, /^kimi-latest/, /^moonshot-v1-8k$/, /^moonshot-v1-32k$/, /^kimi-k2\.\d+$/, /^kimi-k2/];
async function findKimi(env) {
  if (kimiCfg) return kimiCfg;
  let lastErr = '';
  for (const base of KIMI_BASES) {
    const r = await fetch(`${base}/models`, { headers: { Authorization: `Bearer ${env.KIMI_API_KEY}` } });
    if (!r.ok) { lastErr = `HTTP ${r.status}`; continue; }
    const ids = ((await r.json()).data || []).map((m) => m.id);
    const models = [];
    if (env.KIMI_MODEL) models.push(env.KIMI_MODEL);
    for (const re of PREF) for (const id of ids.filter((x) => re.test(x) && !/thinking|vision/.test(x)).sort().reverse()) if (!models.includes(id)) models.push(id);
    if (!models.length && ids.length) models.push(ids[0]);
    kimiCfg = { base, models: models.slice(0, 5), ids };
    return kimiCfg;
  }
  throw new Error(`La key de Kimi no funcionó en moonshot.ai ni en moonshot.cn (${lastErr})`);
}

// Intenta con cada modelo y con parámetros más simples hasta que uno responda
async function kimiChat(env, messages, temperature, maxTokens) {
  const cfg = await findKimi(env);
  const errors = [];
  for (const model of cfg.models) {
    const variants = [{ temperature }, {}, { temperature: 1, thinking: { type: 'disabled' } }];
    for (const extra of variants) {
      const r = await fetch(`${cfg.base}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${env.KIMI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages, max_tokens: maxTokens, ...extra }),
      });
      if (r.ok) {
        // recordamos lo que funcionó para la próxima
        cfg.models = [model, ...cfg.models.filter((m) => m !== model)];
        return r;
      }
      const err = (await r.text()).slice(0, 200);
      errors.push(`${model} ${r.status}: ${err}`);
      if (r.status === 401) { kimiCfg = null; throw new Error('Key de Kimi rechazada'); }
      if (r.status !== 400) break; // otro error: probar el siguiente modelo
    }
  }
  throw new Error(errors.slice(-3).join(' | '));
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
      if (env.KIMI_API_KEY) { try { const c = await findKimi(env); kimi = { base: c.base, model: c.models[0], candidates: c.models, available: c.ids.slice(0, 40) }; } catch (e) { kimi = { error: e.message }; } }
      return json({ fish: !!env.FISH_API_KEY, kimi });
    }
    if (req.method !== 'POST') return text('Método no permitido', 405);
    let body;
    try { body = await req.json(); } catch { return text('JSON inválido', 400); }

    // ---- Kimi ----
    if (url.pathname === '/chat') {
      if (!env.KIMI_API_KEY) return text('Kimi no está configurado', 501);
      const messages = Array.isArray(body.messages) ? body.messages.slice(-30) : null;
      if (!messages || !messages.length) return text('Petición inválida', 400);
      try {
        const r = await kimiChat(env, messages, Math.min(1, Math.max(0, +body.temperature || 0.7)), Math.min(600, +body.max_tokens || 220));
        return new Response(r.body, { headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
      } catch (e) { return text(`Kimi: ${e.message}`, 502); }
    }

    // ---- Voces Fish Audio ----
    const say = String(body.text || '').trim();
    const ref = VOICES[body.voice];
    if (!ref || !say || say.length > 1200) return text('Petición inválida', 400);
    const r = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.FISH_API_KEY}`, 'Content-Type': 'application/json', model: 's1' },
      body: JSON.stringify({ text: say, reference_id: ref, format: 'mp3', mp3_bitrate: 64, normalize: true }),
    });
    if (!r.ok) return text(`Fish Audio respondió ${r.status}`, 502);
    return new Response(r.body, { headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  },
};
