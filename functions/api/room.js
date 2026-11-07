// POST /api/room -> crea una stanza anonima. Risposta: {token, code}
// Il token (segreto del conduttore) non viene salvato: nel database c'e' solo il suo hash.
import { ensureSchema, now, sha256Hex, statInc, allow, purge } from '../../lib/db.js';
import { json, lang, country, readBody, ipKey } from '../../lib/http.js';
import { casuale } from '../../lib/ids.js';

const CODICE_LEN = 6;

function nuovoToken() {
  const b = crypto.getRandomValues(new Uint8Array(24));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    await ensureSchema(env.DB);
    const text = await readBody(request, 1000);
    if (text === null) return json({ error: 'troppo grande' }, 413);
    let body = {};
    try { body = text ? JSON.parse(text) : {}; } catch (e) { return json({ error: 'json non valido' }, 400); }
    const l = lang(body && body.lang);

    // massimo 20 stanze all'ora per rete
    if (!(await allow(env.DB, await ipKey(request, sha256Hex, 'room'), 20, 3600))) {
      return json({ error: 'troppe richieste' }, 429);
    }
    if (Math.random() < 0.1) await purge(env.DB);

    const token = nuovoToken();
    const hash = await sha256Hex(token);
    const t = now();
    const c = country(request);
    for (let tentativo = 0; tentativo < 6; tentativo++) {
      const code = casuale(CODICE_LEN);
      try {
        await env.DB.batch([
          env.DB.prepare(
            'INSERT INTO rooms (owner_hash, code, ver, state, lang, country, calls, created, updated) ' +
            'VALUES (?1, ?2, 0, NULL, ?3, ?4, 0, ?5, ?5)'
          ).bind(hash, code, l, c, t),
          statInc(env.DB, 'room_created', l, c),
        ]);
        return json({ token, code });
      } catch (e) {
        if (!/UNIQUE|constraint/i.test(String(e && e.message))) throw e; // codice gia' in uso: riprovo
      }
    }
    return json({ error: 'riprova' }, 503);
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
