# Spin the Fortune / Gira la Fortuna

Gioco di parole gratuito: il tabellone sulla TV, le lettere dal telefono. Inglese (predefinito) e italiano.
Cloudflare Pages + Pages Functions + D1. Nessun account: le stanze sono anonime.

## Struttura

- `public/`: sito statico. `index.html` (EN) e `it/index.html` (IT) sono le landing; `play.html` e `screen.html` sono l'app (conduttore e schermo); `admin.html` mostra i contatori.
- `functions/api/`: `room.js` (crea stanza), `state.js` (il conduttore invia lo stato), `screen.js` (lo schermo legge lo stato con le lettere nascoste mascherate), `admin/stats.js` (contatori).
- `lib/`: regole di gioco (`game.js`), database (`db.js`), utilita' HTTP (`http.js`).
- `migrations/0001_init.sql`: schema di riferimento. Le API lo creano da sole al primo uso.
- `test/`: test delle API (`api.test.mjs`, usa `node:sqlite` al posto di D1) e prova nel browser (`e2e.py`, richiede Playwright).

## Pubblicazione su Cloudflare (da GitHub, senza terminale)

1. Database: Storage & databases, D1, Create database, nome `stf`.
2. Sito: Workers & Pages, Create, Pages, Connect to Git, scegli questo repository. Framework: None. Build command: vuoto. Build output directory: `public`. Save and Deploy.
3. Collega il database: progetto, Settings, Bindings, Add, D1 database. Variable name `DB` (esattamente cosi'), database `stf`.
4. Contatori: Settings, Variables and Secrets, Add, nome `ADMIN_TOKEN`, tipo Secret, valore casuale di almeno 16 caratteri. Serve per aprire `/admin.html`.
5. Ripubblica: bindings e variabili valgono solo dal deploy successivo (Deployments, Retry deployment, oppure un nuovo push).
6. Statistiche di visita: nel progetto, Metrics, abilita Web Analytics (senza cookie).

Da qui ogni push su `main` ripubblica il sito.

## Come funziona

- Il conduttore (`/play`) crea una stanza: riceve un token segreto (salvato solo nel suo browser; il database ha solo l'hash) e un codice di 6 caratteri.
- Lo schermo (`/screen`) chiede il codice. Il server gli manda la frase con le lettere ancora nascoste sostituite da "A": la soluzione non esce mai dal server.
- Frasi e concorrenti restano nel browser del conduttore. Al server va solo la frase corrente.
- Le stanze ferme da 24 ore vengono cancellate. Lo schermo interroga il server ogni secondo, poi ogni 2 e 4 secondi se non cambia nulla.

## Contatori anonimi

Tabella `stats`: giorno, evento, lingua, paese, totale. Eventi: `room_created`, `screen_connected`, `game_started`, `letter_hit`, `letter_miss`, `phrase_completed`, `phrase_revealed`. Nessun identificativo di persona. I limiti di richieste usano un hash della rete che scade dopo poco.

## Prima del lancio pubblico (serve un dominio)

- Togliere `X-Robots-Tag` da `public/_headers` e `Disallow: /` da `public/robots.txt`.
- Aggiungere `canonical` e `hreflang` assoluti, `sitemap.xml`, pagina privacy e termini.
- Accesso con email e account: richiede un servizio di invio email con dominio verificato.

## Test

```
node --no-warnings test/api.test.mjs
python3 test/e2e.py
```

## Limiti noti

- Lo schermo usa polling: il piano gratuito di Pages Functions ha un limite giornaliero di richieste (per quanto ne so 100.000 al giorno). Per molti schermi contemporanei serve il tempo reale con Durable Objects.
