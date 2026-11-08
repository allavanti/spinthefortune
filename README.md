# Spin the Fortune / Gira la Fortuna

Gioco di parole gratuito: il tabellone sulla TV, le lettere dal telefono. Inglese (predefinito) e italiano.
Cloudflare Pages + Pages Functions + D1. Nessun account: le stanze sono anonime.

## Struttura

- `public/`: sito statico. `index.html` (EN) e `it/index.html` (IT) sono le landing; `play.html` e `screen.html` sono l'app (conduttore e schermo); `admin.html` mostra i contatori.
- `functions/api/`: `room.js` (crea stanza), `state.js` (il conduttore invia lo stato), `screen.js` (lo schermo legge lo stato con le lettere nascoste mascherate), `admin/stats.js` (contatori).
- `lib/`: validazione dello stato (`game.js`), database (`db.js`), utilita' HTTP (`http.js`).
- `public/js/`: tabellone (`board.js`), regole con ruota e punteggi (`rules.js`), suoni (`sound.js`), traduzioni EN/IT (`i18n.js`).
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

## Punteggi, ruota e suoni

- I punteggi si attivano quando ci sono i nomi dei concorrenti (Impostazioni, voce "Usa punteggi e ruota"). Senza nomi il gioco resta libero come prima.
- Regole: Gira, il valore dello spicchio vale per ogni consonante trovata, vocale a pagamento (costo configurabile, 250 predefinito), Bancarotta azzera i punti della manche, Passa cede il turno, Risolta porta i punti della manche nel totale.
- Gli spicchi della ruota si cambiano nelle Impostazioni (da 6 a 32 righe: numeri, BANKRUPT, PASS).
- La ruota gira sullo schermo (circa 5 secondi, poi il risultato). Il conduttore e' bloccato per 6,5 secondi mentre gira.
- Suoni sintetizzati nel browser (WebAudio, nessun file). Il browser li permette solo dopo un click: lo schermo mostra "Clicca per attivare l'audio"; il tasto M silenzia.
- Il tabellone e' mascherato dal server: lo schermo confronta le frasi tenendo conto delle lettere nascoste (vedi `samePuzzle` in `screen.html`).

## Contatori anonimi

Tabella `stats`: giorno, evento, lingua, paese, totale. Eventi: `room_created`, `screen_connected`, `game_started`, `letter_hit`, `letter_miss`, `phrase_completed`, `phrase_revealed`, `wheel_spin`, `phrase_solved`. Nessun identificativo di persona. I limiti di richieste usano un hash della rete che scade dopo poco.

## SEO e pagine statiche

- Dominio: `spinthefortune.com` (www in 301 verso il dominio nudo tramite Redirect Rule su Cloudflare).
- Le pagine home, privacy e termini si rigenerano con `cd scripts/gen && python3 gen.py && python3 privacy.py && python3 terms.py` (canonical, hreflang, Open Graph e JSON-LD inclusi).
- `public/robots.txt` e `public/sitemap.xml` sono statici; play/screen/admin/feedback hanno `noindex` nel meta, `/api/*` ha `X-Robots-Tag`.
- Nei testi non usare "ruota della fortuna" / "Wheel of Fortune" (marchio): `test/seo.test.mjs` lo verifica.
- Ancora da fare: accesso con email (serve un servizio di invio con dominio verificato).

## Test

```
node --no-warnings test/api.test.mjs
node test/rules.test.mjs
python3 test/e2e.py
python3 test/e2e_host.py
python3 test/e2e_game.py
```

## Limiti noti

- Lo schermo usa polling: il piano gratuito di Pages Functions ha un limite giornaliero di richieste (per quanto ne so 100.000 al giorno). Per molti schermi contemporanei serve il tempo reale con Durable Objects.


## Domande e suggerimenti

Pagina pubblica `/feedback` (EN/IT). L'utente scrive un messaggio e riceve un codice di 10 caratteri; la risposta compare sulla stessa pagina
(il codice resta salvato nel browser, oppure si ritrova inserendolo a mano). L'email e' facoltativa e viene solo memorizzata: non si inviano email
finche' non c'e' un dominio. Protezioni: campo trappola per i robot, limite di invii per IP. Nell'admin (`/admin`, scheda "Messaggi") si
filtra, si risponde, si riapre o si elimina; serve `ADMIN_TOKEN`. La tabella `messages` si crea da sola.

Test: `node test/i18n.test.mjs` (nessun testo inglese nella versione italiana e viceversa), `python3 test/e2e_feedback.py`.

## Frasi pronte e frasi della community

- Il catalogo curato sta in `public/data/phrases-it.json` e `phrases-en.json` (120 frasi per lingua, frasi complete e non solo titoli, generate da `scripts/build_catalog.py`, formato `{"c":"Categoria","t":"FRASE"}`): ogni lingua ha frasi e categorie solo nella propria lingua.
- Le frasi inviate dagli utenti (casella spenta di default nelle Impostazioni) finiscono nella tabella D1 `pool` come "da approvare". Si creano da sole come le altre tabelle.
- In `/admin`, scheda "Frasi": si approva, rifiuta, modifica o elimina (anche in blocco). Solo le approvate escono da `GET /api/phrases?lang=it|en` e compaiono in "Frasi pronte". Con 3 segnalazioni una frase approvata torna "da approvare"; una frase rifiutata non viene riproposta.
- Filtri automatici in `lib/phrases.js` (lunghezza, link, email, numeri lunghi, parole non ammesse): sono solo una prima barriera, la moderazione resta manuale.
- Test: `python3 test/e2e_phrases.py`.
