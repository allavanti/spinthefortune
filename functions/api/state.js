// POST /api/state (Authorization: Bearer TOKEN) -> salva lo stato di gioco completo. Risposta: {ver}
// 404 {error:'room'} se la stanza e' scaduta: il client ne crea una nuova.
import { ensureSchema, now, sha256Hex, statInc, allow } from '../../lib/db.js';
import { json, bearer, readBody } from '../../lib/http.js';
import { cleanState, isComplete } from '../../lib/game.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    const token = bearer(request);
    if (!token) return json({ error: 'token mancante' }, 401);
    const text = await readBody(request, 8000);
    if (text === null) return json({ error: 'troppo grande' }, 413);
    let raw;
    try { raw = JSON.parse(text); } catch (e) { return json({ error: 'json non valido' }, 400); }
    const next = cleanState(raw);
    if (!next) return json({ error: 'stato non valido' }, 400);

    await ensureSchema(env.DB);
    const hash = await sha256Hex(token);
    if (!(await allow(env.DB, 'w:' + hash, 120, 60))) return json({ error: 'troppe richieste' }, 429);

    const room = await env.DB.prepare(
      'SELECT state, lang, country, calls FROM rooms WHERE owner_hash = ?1'
    ).bind(hash).first();
    if (!room) return json({ error: 'room' }, 404);

    let prev = null;
    try { prev = room.state ? JSON.parse(room.state) : null; } catch (e) { prev = null; }

    // contatori anonimi: si contano solo i cambi di evento (un nuovo invio dello stesso stato non conta)
    const stats = [];
    let calls = room.calls;
    if (!prev || prev.ev.seq !== next.ev.seq) {
      const t = next.ev.t;
      if (t === 'hit' || t === 'miss') {
        if (calls === 0) stats.push(statInc(env.DB, 'game_started', room.lang, room.country));
        calls++;
        stats.push(statInc(env.DB, t === 'hit' ? 'letter_hit' : 'letter_miss', room.lang, room.country));
        if (t === 'hit' && isComplete(next) && !(prev && prev.phrase === next.phrase && isComplete(prev))) {
          stats.push(statInc(env.DB, 'phrase_completed', room.lang, room.country));
        }
      } else if (t === 'reveal') {
        stats.push(statInc(env.DB, 'phrase_revealed', room.lang, room.country));
      }
    }

    const res = await env.DB.batch([
      env.DB.prepare(
        'UPDATE rooms SET ver = ver + 1, state = ?2, calls = ?3, updated = ?4 WHERE owner_hash = ?1 RETURNING ver'
      ).bind(hash, JSON.stringify(next), calls, now()),
      ...stats,
    ]);
    const row = res[0].results && res[0].results[0];
    if (!row) return json({ error: 'room' }, 404);
    return json({ ver: row.ver });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
