// Frasi della community.
// GET  /api/phrases?lang=it|en -> {rows:[{c, t}]}   solo frasi approvate dall'amministratore
// POST /api/phrases {lang, items:[{c, t}], hp}      invio anonimo (arrivano "da approvare")
// POST /api/phrases {lang, report:{t}}              segnalazione: con 3 segnalazioni la frase torna "da approvare"
import { ensureSchema, now, sha256Hex, statInc, allow } from '../../lib/db.js';
import { json, lang, country, readBody, ipKey } from '../../lib/http.js';
import { cleanPhrase, PH } from '../../lib/phrases.js';

const MAX_POOL = 20000;   // oltre questo numero di frasi si rifiutano le nuove, a protezione del database

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    const l = lang(new URL(request.url).searchParams.get('lang'));
    await ensureSchema(env.DB);
    const r = await env.DB.prepare(
      "SELECT cat AS c, text AS t FROM pool WHERE lang = ?1 AND status = 'approved' ORDER BY cat, text LIMIT 3000"
    ).bind(l).all();
    return json({ rows: r.results });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    const raw = await readBody(request, 12000);
    if (raw === null) return json({ error: 'troppo grande' }, 413);
    let b;
    try { b = JSON.parse(raw); } catch (e) { return json({ error: 'json non valido' }, 400); }
    if (!b || typeof b !== 'object') return json({ error: 'json non valido' }, 400);
    if (typeof b.hp === 'string' && b.hp.trim() !== '') return json({ accepted: 0 });   // robot

    const l = lang(b.lang), t = now();
    await ensureSchema(env.DB);

    if (b.report && typeof b.report === 'object') {
      const p = cleanPhrase(b.report.t, '');
      if (!p) return json({ error: 'frase non valida' }, 400);
      if (!(await allow(env.DB, await ipKey(request, sha256Hex, 'phrep'), 20, 3600))) return json({ error: 'troppe richieste' }, 429);
      await env.DB.prepare(
        "UPDATE pool SET reports = reports + 1, " +
        "status = CASE WHEN status = 'approved' AND reports + 1 >= 3 THEN 'pending' ELSE status END, updated = ?3 " +
        "WHERE lang = ?1 AND k = ?2"
      ).bind(l, p.k, t).run();
      return json({ ok: true });
    }

    if (!Array.isArray(b.items) || !b.items.length) return json({ error: 'nessuna frase' }, 400);
    const clean = [], seen = new Set();
    for (const it of b.items.slice(0, PH.perPost)) {
      if (!it || typeof it !== 'object') continue;
      const p = cleanPhrase(it.t, it.c);
      if (p && !seen.has(p.k)) { seen.add(p.k); clean.push(p); }
    }
    if (!clean.length) return json({ accepted: 0 });

    if (!(await allow(env.DB, await ipKey(request, sha256Hex, 'phsub'), 6, 3600))) return json({ error: 'troppi invii' }, 429);
    const tot = await env.DB.prepare('SELECT COUNT(*) AS n FROM pool').first();
    if (tot.n >= MAX_POOL) return json({ error: 'archivio pieno' }, 503);

    const c = country(request);
    await env.DB.batch([
      ...clean.map((p) => env.DB.prepare(
        'INSERT INTO pool (lang, k, text, cat, created, updated) VALUES (?1, ?2, ?3, ?4, ?5, ?5) ' +
        "ON CONFLICT(lang, k) DO UPDATE SET n = n + 1, updated = ?5 WHERE status != 'rejected'"
      ).bind(l, p.k, p.text, p.cat, t)),
      statInc(env.DB, 'phrases_shared', l, c, clean.length),
    ]);
    return json({ accepted: clean.length });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
