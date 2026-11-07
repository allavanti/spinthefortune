// Utilita' per le risposte e per i dati di contesto della richiesta.

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export const lang = (v) => (v === 'it' ? 'it' : 'en');
export const country = (request) => {
  const c = request.cf && request.cf.country;
  return typeof c === 'string' && /^[A-Z]{2}$/.test(c) ? c : '';
};

// Legge il corpo come testo con un limite di dimensione. Ritorna null se troppo grande.
export async function readBody(request, max) {
  const len = Number(request.headers.get('Content-Length') || 0);
  if (len > max) return null;
  const text = await request.text();
  return text.length > max ? null : text;
}

export function bearer(request) {
  const h = request.headers.get('Authorization') || '';
  const m = /^Bearer ([A-Za-z0-9_-]{20,64})$/.exec(h);
  return m ? m[1] : '';
}

export async function ipKey(request, sha256Hex, scope) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const day = new Date().toISOString().slice(0, 10);
  return sha256Hex(`${scope}|${day}|${ip}`);
}
