// GET /api/screen?c=CODICE&v=N[&first=1] -> stato per lo schermo, con le lettere nascoste mascherate.
// {ver, same:true} se N e' gia' l'ultima versione; {ver, view:null} finche' il conduttore non ha inviato nulla.
// 404 se il codice non esiste. Tentativi sbagliati limitati per rete.
import { ensureSchema, sha256Hex, statInc, allow } from '../../lib/db.js';
import { json, country, ipKey } from '../../lib/http.js';
import { maskState } from '../../lib/game.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  try {
    const url = new URL(request.url);
    const code = (url.searchParams.get('c') || '').toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(code)) return json({ error: 'codice non valido' }, 400);

    await ensureSchema(env.DB);
    const room = await env.DB.prepare('SELECT ver, state, lang FROM rooms WHERE code = ?1').bind(code).first();

    if (!room) {
      // solo i codici sbagliati scrivono sul database: 30 ogni 10 minuti per rete
      const ok = await allow(env.DB, await ipKey(request, sha256Hex, 'bad'), 30, 600);
      return json({ error: ok ? 'codice sconosciuto' : 'troppi tentativi' }, ok ? 404 : 429);
    }

    const v = url.searchParams.get('v');
    if (v !== null && String(room.ver) === v) return json({ ver: room.ver, same: true });

    // first=1 solo nella prima richiesta di una pagina schermo: lo contiamo come collegamento
    if (url.searchParams.get('first') === '1') await statInc(env.DB, 'screen_connected', room.lang, country(request)).run();

    let view = null;
    if (room.state) {
      try { view = maskState(JSON.parse(room.state)); } catch (e) { view = null; }
    }
    return json({ ver: room.ver, view });
  } catch (e) {
    return json({ error: 'errore del server' }, 500);
  }
}
