// GET /api/admin/stats?days=30 (Authorization: Bearer ADMIN_TOKEN) -> contatori aggregati.
// Serve la variabile segreta ADMIN_TOKEN (almeno 16 caratteri) nelle impostazioni del progetto.
import { now } from '../../../lib/db.js';
import { json } from '../../../lib/http.js';
import { adminGuard } from '../../../lib/admin.js';

export async function onRequestGet({ request, env }) {
  try {
    const no = await adminGuard(request, env);
    if (no) return no;
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
