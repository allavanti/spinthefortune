-- Schema di riferimento. Le API lo creano da sole al primo uso (lib/db.js), non serve eseguirlo a mano.
CREATE TABLE IF NOT EXISTS rooms (
  owner_hash TEXT PRIMARY KEY,      -- SHA-256 del token del conduttore (il token non e' mai salvato)
  code       TEXT NOT NULL UNIQUE,  -- codice breve per collegare lo schermo
  ver        INTEGER NOT NULL DEFAULT 0,
  state      TEXT,                  -- stato completo (con la frase in chiaro): non esce mai dal server; NULL finche' il conduttore non invia nulla
  lang       TEXT NOT NULL DEFAULT 'en',
  country    TEXT NOT NULL DEFAULT '',
  calls      INTEGER NOT NULL DEFAULT 0,
  created    INTEGER NOT NULL,
  updated    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS rooms_updated ON rooms(updated);

-- Contatori anonimi aggregati per giorno: nessun identificativo di persona.
CREATE TABLE IF NOT EXISTS stats (
  day TEXT NOT NULL, name TEXT NOT NULL, lang TEXT NOT NULL, country TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, name, lang, country)
);

-- Limite di richieste: chiave = hash giornaliero, si cancella da solo.
CREATE TABLE IF NOT EXISTS ratelimit (
  k TEXT NOT NULL, win INTEGER NOT NULL, n INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL,
  PRIMARY KEY (k, win)
);
