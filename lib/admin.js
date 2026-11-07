// Accesso riservato all'amministratore: variabile segreta ADMIN_TOKEN (almeno 16 caratteri).
import { ensureSchema, sha256Hex, allow } from './db.js';
import { json, ipKey } from './http.js';

function uguali(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Ritorna una Response se l'accesso e' negato, null se e' consentito.
export async function adminGuard(request, env) {
  if (!env.DB) return json({ error: 'database non collegato (binding DB)' }, 500);
  const atteso = env.ADMIN_TOKEN;
  if (!atteso || atteso.length < 16) return json({ error: 'ADMIN_TOKEN non configurato' }, 503);
  await ensureSchema(env.DB);
  // il token dell'admin puo' avere qualsiasi carattere: non si usa bearer(), pensato per i token delle stanze
  const m = /^Bearer (.+)$/.exec(request.headers.get('Authorization') || '');
  const dato = m ? m[1].trim() : '';
  if (dato && uguali(dato, atteso)) return null;
  const ok = await allow(env.DB, await ipKey(request, sha256Hex, 'admin'), 10, 600);
  return json({ error: ok ? 'non autorizzato' : 'troppi tentativi' }, ok ? 401 : 429);
}
