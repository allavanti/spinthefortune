// Accesso al database D1 (binding "DB"): schema automatico, hash, contatori, limiti di richieste.

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS rooms (
     owner_hash TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE, ver INTEGER NOT NULL DEFAULT 0,
     state TEXT, lang TEXT NOT NULL DEFAULT 'en', country TEXT NOT NULL DEFAULT '',
     calls INTEGER NOT NULL DEFAULT 0, created INTEGER NOT NULL, updated INTEGER NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS rooms_updated ON rooms(updated)`,
  `CREATE TABLE IF NOT EXISTS stats (
     day TEXT NOT NULL, name TEXT NOT NULL, lang TEXT NOT NULL, country TEXT NOT NULL,
     n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, name, lang, country))`,
  `CREATE TABLE IF NOT EXISTS messages (
     id TEXT PRIMARY KEY, kind TEXT NOT NULL, text TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
     lang TEXT NOT NULL DEFAULT 'en', country TEXT NOT NULL DEFAULT '', created INTEGER NOT NULL,
     status TEXT NOT NULL DEFAULT 'open', reply TEXT NOT NULL DEFAULT '', replied INTEGER NOT NULL DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS messages_status ON messages(status, created)`,
  `CREATE TABLE IF NOT EXISTS pool (
     lang TEXT NOT NULL, k TEXT NOT NULL, text TEXT NOT NULL, cat TEXT NOT NULL DEFAULT '',
     status TEXT NOT NULL DEFAULT 'pending', n INTEGER NOT NULL DEFAULT 1, reports INTEGER NOT NULL DEFAULT 0,
     created INTEGER NOT NULL, updated INTEGER NOT NULL, PRIMARY KEY (lang, k))`,
  `CREATE INDEX IF NOT EXISTS pool_status ON pool(status, lang, n)`,
  `CREATE TABLE IF NOT EXISTS ratelimit (
     k TEXT NOT NULL, win INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL,
     PRIMARY KEY (k, win))`,
];

let pronto = false;
export async function ensureSchema(db) {
  if (pronto) return;
  await db.batch(SCHEMA.map((q) => db.prepare(q)));
  pronto = true;
}

export const now = () => Math.floor(Date.now() / 1000);

export async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Incremento di un contatore anonimo (giorno, evento, lingua, paese). Ritorna lo statement per db.batch().
export function statInc(db, name, lang, country, n = 1) {
  const day = new Date().toISOString().slice(0, 10);
  return db.prepare(
    'INSERT INTO stats (day, name, lang, country, n) VALUES (?1, ?2, ?3, ?4, ?5) ' +
    'ON CONFLICT(day, name, lang, country) DO UPDATE SET n = n + excluded.n'
  ).bind(day, name, lang, country, n);
}

// true se la richiesta e' consentita. Le chiavi sono hash, la riga scade da sola.
export async function allow(db, key, limit, windowSec) {
  const t = now();
  const win = Math.floor(t / windowSec);
  const row = await db.prepare(
    'INSERT INTO ratelimit (k, win, n, exp) VALUES (?1, ?2, 1, ?3) ' +
    'ON CONFLICT(k, win) DO UPDATE SET n = n + 1 RETURNING n'
  ).bind(key, win, t + windowSec * 2).first();
  return row.n <= limit;
}

// Pulizia occasionale: stanze ferme da 24 ore e limiti scaduti.
export const ROOM_TTL = 24 * 3600;
export async function purge(db) {
  const t = now();
  await db.batch([
    db.prepare('DELETE FROM rooms WHERE updated < ?1').bind(t - ROOM_TTL),
    db.prepare('DELETE FROM ratelimit WHERE exp < ?1').bind(t),
  ]);
}
