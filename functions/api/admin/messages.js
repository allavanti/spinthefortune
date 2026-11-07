// Messaggi degli utenti (solo amministratore, Authorization: Bearer ADMIN_TOKEN).
// GET  /api/admin/messages?status=open|answered|all -> {open, answered, rows:[...]}
// POST /api/admin/messages {id, action:'reply', reply} | {id, action:'reopen'} | {id, action:'delete'}
import { now } from '../../../lib/db.js';
import { json, readBody } from '../../../lib/http.js';
import { adminGuard } from '../../../lib/admin.js';

export async function onRequestGet({ request, env }) {
  try {
    const no = await adminGuard(request, env);
    if (no) return no;
    const st = new URL(request.url).searchParams.get('status');
    const where = st === 'answered' ? "WHERE status = 'answered'" : st === 'all' ? '' : "WHERE status = 'open'";
    const rows = await env.DB.prepare(
      `SELECT id, kind, text, email, lang, country, created, status, reply, replied FROM messages ${where} ORDER BY created DESC LIMIT 200`
    ).all();
    const c = await env.DB.prepare(
      "SELECT COALESCE(SUM(status = 'open'), 0) AS open, COALESCE(SUM(status = 'answered'), 0) AS answered FROM messages"
    ).first();
    return json({ open: c.open, answered: c.answered, rows: rows.results });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const no = await adminGuard(request, env);
    if (no) return no;
    const raw = await readBody(request, 6000);
    if (raw === null) return json({ error: 'troppo grande' }, 413);
    let b;
    try { b = JSON.parse(raw); } catch (e) { return json({ error: 'json non valido' }, 400); }
    const id = String((b && b.id) || '').toUpperCase();
    if (!/^[A-Z2-9]{10}$/.test(id)) return json({ error: 'codice non valido' }, 400);

    if (b.action === 'delete') {
      await env.DB.prepare('DELETE FROM messages WHERE id = ?1').bind(id).run();
      return json({ ok: true });
    }
    if (b.action === 'reopen') {
      await env.DB.prepare("UPDATE messages SET status = 'open' WHERE id = ?1").bind(id).run();
      return json({ ok: true });
    }
    if (b.action === 'reply') {
      const reply = String(b.reply || '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim();
      if (!reply || reply.length > 2000) return json({ error: 'risposta non valida' }, 400);
      const r = await env.DB.prepare(
        "UPDATE messages SET reply = ?2, status = 'answered', replied = ?3 WHERE id = ?1 RETURNING id"
      ).bind(id, reply, now()).first();
      return r ? json({ ok: true }) : json({ error: 'non trovato' }, 404);
    }
    return json({ error: 'azione non valida' }, 400);
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
