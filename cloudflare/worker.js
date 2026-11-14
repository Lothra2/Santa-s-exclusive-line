// Puente de voces para la Línea Directa al Polo Norte (Cloudflare Worker).
// La página le manda un texto y este Worker lo convierte en audio con Fish Audio.
// Secretos en Cloudflare: FISH_API_KEY (key de Fish Audio) y ACCESS_TOKEN (la clave que va en el panel de papás).
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

export default {
  async fetch(req, env) {
    const origin = req.headers.get('origin') || '';
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED.includes(origin) ? origin : ALLOWED[0],
      'Access-Control-Allow-Headers': 'content-type, x-token',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      Vary: 'Origin',
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method === 'GET') return new Response('Puente de voces del Polo Norte funcionando 🎅', { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });
    if (req.method !== 'POST') return new Response('Método no permitido', { status: 405, headers: cors });
    if (!ALLOWED.includes(origin)) return new Response('Origen no permitido', { status: 403, headers: cors });
    if (env.ACCESS_TOKEN && req.headers.get('x-token') !== env.ACCESS_TOKEN) return new Response('Clave incorrecta', { status: 403, headers: cors });
    let body;
    try { body = await req.json(); } catch { return new Response('JSON inválido', { status: 400, headers: cors }); }
    const text = String(body.text || '').trim();
    const ref = VOICES[body.voice];
    if (!ref || !text || text.length > 1200) return new Response('Petición inválida', { status: 400, headers: cors });
    const r = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.FISH_API_KEY}`, 'Content-Type': 'application/json', model: 's1' },
      body: JSON.stringify({ text, reference_id: ref, format: 'mp3', mp3_bitrate: 64, normalize: true }),
    });
    if (!r.ok) return new Response(`Fish Audio respondió ${r.status}`, { status: 502, headers: cors });
    return new Response(r.body, { headers: { ...cors, 'Content-Type': 'audio/mpeg', 'Cache-Control': 'no-store' } });
  },
};
