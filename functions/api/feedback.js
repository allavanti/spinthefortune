// Domande e suggerimenti degli utenti.
// POST /api/feedback {kind, text, email?, lang, hp} -> {id}   (hp e' un campo trappola per i robot: deve restare vuoto)
// GET  /api/feedback?id=CODICE -> {kind, text, status, reply, created, replied}  (l'email non esce mai)
import { ensureSchema, now, sha256Hex, statInc, allow } from '../../lib/db.js';
import { json, lang, country, readBody, ipKey } from '../../lib/http.js';
import { casuale } from '../../lib/ids.js';

const KINDS = ['question', 'suggestion', 'bug'];
const MAX_TEXT = 1500;
const MAX_TOTAL = 5000;   // oltre questo numero di messaggi si rifiutano i nuovi, a protezione del database

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    const raw = await readBody(request, 6000);
    if (raw === null) return json({ error: 'troppo grande' }, 413);
    let b;
    try { b = JSON.parse(raw); } catch (e) { return json({ error: 'json non valido' }, 400); }
    if (!b || typeof b !== 'object') return json({ error: 'json non valido' }, 400);

    // robot: risposta finta, niente salvato
    if (typeof b.hp === 'string' && b.hp.trim() !== '') return json({ id: casuale(10) });

    const text = String(b.text || '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, ' ').trim();
    if (text.length < 5) return json({ error: 'testo troppo corto' }, 400);
    if (text.length > MAX_TEXT) return json({ error: 'testo troppo lungo' }, 400);
    const kind = KINDS.includes(b.kind) ? b.kind : 'question';
    let email = String(b.email || '').trim();
    if (email && (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))) return json({ error: 'email non valida' }, 400);

    await ensureSchema(env.DB);
    if (!(await allow(env.DB, await ipKey(request, sha256Hex, 'fb'), 5, 3600))) {
      return json({ error: 'troppi messaggi' }, 429);
    }
    const tot = await env.DB.prepare('SELECT COUNT(*) AS n FROM messages').first();
    if (tot.n >= MAX_TOTAL) return json({ error: 'casella piena' }, 503);

    const l = lang(b.lang), c = country(request), t = now();
    for (let tentativo = 0; tentativo < 5; tentativo++) {
      const id = casuale(10);
      try {
        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO messages (id, kind, text, email, lang, country, created) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)'
          ).bind(id, kind, text, email, l, c, t),
          statInc(env.DB, 'feedback_' + kind, l, c),
        ]);
        return json({ id });
      } catch (e) {
        if (!/UNIQUE|constraint/i.test(String(e && e.message))) throw e;
      }
    }
    return json({ error: 'riprova' }, 503);
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    const id = (new URL(request.url).searchParams.get('id') || '').toUpperCase();
    if (!/^[A-Z2-9]{10}$/.test(id)) return json({ error: 'codice non valido' }, 400);
    await ensureSchema(env.DB);
    const row = await env.DB.prepare(
      'SELECT kind, text, status, reply, created, replied FROM messages WHERE id = ?1'
    ).bind(id).first();
    if (!row) {
      const ok = await allow(env.DB, await ipKey(request, sha256Hex, 'badfb'), 30, 600);
      return json({ error: ok ? 'codice sconosciuto' : 'troppi tentativi' }, ok ? 404 : 429);
    }
    return json(row);
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
