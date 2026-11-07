// Moderazione delle frasi della community (solo amministratore, Authorization: Bearer ADMIN_TOKEN).
// GET  /api/admin/phrases?status=pending|approved|rejected|reported&lang=it|en|all
//        -> {pending, approved, reported, rows:[{lang,k,text,cat,status,n,reports,created}]}
// POST /api/admin/phrases {items:[{lang,k}], action:'approve'|'reject'|'pending'|'delete'}
// POST /api/admin/phrases {lang,k, action:'edit', text, cat, newLang}   (corregge testo, categoria o lingua; resta approvata se lo era)
import { now } from '../../../lib/db.js';
import { json, readBody } from '../../../lib/http.js';
import { adminGuard } from '../../../lib/admin.js';
import { cleanPhrase } from '../../../lib/phrases.js';

const STATES = { approve: 'approved', reject: 'rejected', pending: 'pending' };
const lg = (v) => (v === 'it' ? 'it' : 'en');

export async function onRequestGet({ request, env }) {
  try {
    const no = await adminGuard(request, env);
    if (no) return no;
    const q = new URL(request.url).searchParams;
    const st = q.get('status');
    const where = [], args = [];
    if (st === 'reported') where.push("reports > 0 AND status != 'rejected'");
    else { where.push('status = ?' + (args.push(['approved', 'rejected'].includes(st) ? st : 'pending'))); }
    const lang = q.get('lang');
    if (lang === 'it' || lang === 'en') where.push('lang = ?' + args.push(lang));
    const rows = await env.DB.prepare(
      `SELECT lang, k, text, cat, status, n, reports, created FROM pool WHERE ${where.join(' AND ')} ORDER BY reports DESC, n DESC, created DESC LIMIT 300`
    ).bind(...args).all();
    const c = await env.DB.prepare(
      "SELECT COALESCE(SUM(status = 'pending'), 0) AS pending, COALESCE(SUM(status = 'approved'), 0) AS approved, " +
      "COALESCE(SUM(reports > 0 AND status != 'rejected'), 0) AS reported FROM pool"
    ).first();
    return json({ pending: c.pending, approved: c.approved, reported: c.reported, rows: rows.results });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const no = await adminGuard(request, env);
    if (no) return no;
    const raw = await readBody(request, 20000);
    if (raw === null) return json({ error: 'troppo grande' }, 413);
    let b;
    try { b = JSON.parse(raw); } catch (e) { return json({ error: 'json non valido' }, 400); }
    if (!b || typeof b !== 'object') return json({ error: 'json non valido' }, 400);
    const t = now();

    if (b.action === 'edit') {
      const l = lg(b.lang), nl = lg(b.newLang || b.lang);
      const old = await env.DB.prepare('SELECT * FROM pool WHERE lang = ?1 AND k = ?2').bind(l, String(b.k || '')).first();
      if (!old) return json({ error: 'non trovata' }, 404);
      const p = cleanPhrase(b.text, b.cat);
      if (!p) return json({ error: 'frase non valida' }, 400);
      if ((p.k !== old.k || nl !== l) && (await env.DB.prepare('SELECT 1 AS x FROM pool WHERE lang = ?1 AND k = ?2').bind(nl, p.k).first())) {
        return json({ error: 'esiste gia' }, 409);
      }
      await env.DB.batch([
        env.DB.prepare('DELETE FROM pool WHERE lang = ?1 AND k = ?2').bind(l, old.k),
        env.DB.prepare(
          'INSERT INTO pool (lang, k, text, cat, status, n, reports, created, updated) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)'
        ).bind(nl, p.k, p.text, p.cat, old.status, old.n, old.reports, old.created, t),
      ]);
      return json({ ok: true });
    }

    const items = Array.isArray(b.items) ? b.items.slice(0, 300) : [];
    const valid = items.filter((x) => x && typeof x.k === 'string' && /^[A-Z]{1,200}$/.test(x.k)).map((x) => [lg(x.lang), x.k]);
    if (!valid.length) return json({ error: 'nessuna frase' }, 400);
    if (b.action === 'delete') {
      await env.DB.batch(valid.map(([l, k]) => env.DB.prepare('DELETE FROM pool WHERE lang = ?1 AND k = ?2').bind(l, k)));
      return json({ ok: true, n: valid.length });
    }
    if (STATES[b.action]) {
      // approvare azzera le segnalazioni
      await env.DB.batch(valid.map(([l, k]) => env.DB.prepare(
        'UPDATE pool SET status = ?3, reports = CASE WHEN ?3 = \'approved\' THEN 0 ELSE reports END, updated = ?4 WHERE lang = ?1 AND k = ?2'
      ).bind(l, k, STATES[b.action], t)));
      return json({ ok: true, n: valid.length });
    }
    return json({ error: 'azione non valida' }, 400);
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
