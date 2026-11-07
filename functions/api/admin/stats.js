// GET /api/admin/stats?days=30 (Authorization: Bearer ADMIN_TOKEN) -> contatori aggregati.
// Serve la variabile segreta ADMIN_TOKEN (almeno 16 caratteri) nelle impostazioni del progetto.
import { ensureSchema, now, sha256Hex, allow } from '../../../lib/db.js';
import { json, bearer, ipKey } from '../../../lib/http.js';

function uguali(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  const atteso = env.ADMIN_TOKEN;
  if (!atteso || atteso.length < 16) return json({ error: 'ADMIN_TOKEN non configurato' }, 503);
  try {
    await ensureSchema(env.DB);
    const dato = bearer(request);
    if (!dato || !uguali(dato, atteso)) {
      const ok = await allow(env.DB, await ipKey(request, sha256Hex, 'admin'), 10, 600);
      return json({ error: ok ? 'non autorizzato' : 'troppi tentativi' }, ok ? 401 : 429);
    }
    const days = Math.min(365, Math.max(1, parseInt(new URL(request.url).searchParams.get('days'), 10) || 30));
    const da = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const rows = await env.DB.prepare(
      'SELECT day, name, lang, country, n FROM stats WHERE day >= ?1 ORDER BY day DESC, name'
    ).bind(da).all();
    const t = now();
    const live = await env.DB.prepare(
      'SELECT COUNT(*) AS total, COALESCE(SUM(updated >= ?1), 0) AS active FROM rooms'
    ).bind(t - 3600).first();
    return json({ since: da, rooms_total: live.total, rooms_active_1h: live.active, rows: rows.results });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
