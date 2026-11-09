import assert from 'node:assert/strict';
import { fakeD1 } from './d1shim.mjs';
import { onRequestPost as room } from '../functions/api/room.js';
import { onRequestPost as state } from '../functions/api/state.js';
import { onRequestGet as screen } from '../functions/api/screen.js';
import { onRequestGet as adminStats } from '../functions/api/admin/stats.js';
import { onRequestPost as fbPost, onRequestGet as fbGet } from '../functions/api/feedback.js';
import { onRequestGet as admList, onRequestPost as admAct } from '../functions/api/admin/messages.js';
import { onRequestGet as phGet, onRequestPost as phPost } from '../functions/api/phrases.js';
import { onRequestGet as apGet, onRequestPost as apPost } from '../functions/api/admin/phrases.js';

const env = { DB: fakeD1() };
const call = (fn, url, init = {}) =>
  fn({ request: new Request('http://x' + url, init), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
const post = (fn, url, body, token) => call(fn, url, {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
  headers: token ? { Authorization: 'Bearer ' + token, 'CF-Connecting-IP': '1.2.3.4' } : { 'CF-Connecting-IP': '1.2.3.4' },
});
const S = (o) => ({ v: 1, phrase: 'CHI DORME NON PIGLIA PESCI', cat: 'Proverbio', revealed: [], called: [], players: ['Mario', 'Giulia'], turn: 0, ev: { seq: 0, t: '' }, ...o });
const stat = (n) => env.DB._db.prepare('SELECT COALESCE(SUM(n),0) AS n FROM stats WHERE name=?').get(n).n;
let ok = 0; const t = (name) => { ok++; console.log('ok', name); };

// crea stanza
const r = await post(room, '/api/room', { lang: 'it' });
assert.equal(r.s, 200); assert.match(r.b.code, /^[A-Z2-9]{6}$/); assert.ok(r.b.token.length >= 30);
const { token, code } = r.b; t('crea stanza');
const hashInDb = env.DB._db.prepare('SELECT owner_hash FROM rooms').get().owner_hash;
assert.notEqual(hashInDb, token); assert.equal(hashInDb.length, 64); t('token non salvato in chiaro');

// schermo prima di qualsiasi invio
let g = await call(screen, `/api/screen?c=${code}&first=1`);
assert.equal(g.s, 200); assert.equal(g.b.view, null); assert.equal(stat('screen_connected'), 1); t('schermo in attesa');
g = await call(screen, `/api/screen?c=${code}&v=${g.b.ver}`); assert.equal(g.b.same, true); assert.equal(stat('screen_connected'), 1); t('poll senza conteggio');
assert.equal((await call(screen, '/api/screen?c=ab')).s, 400); t('codice malformato');

// scrittura senza token / token errato / stato non valido
assert.equal((await post(state, '/api/state', S())).s, 401);
assert.equal((await post(state, '/api/state', S(), 'x'.repeat(32))).s, 404);
assert.equal((await post(state, '/api/state', '{no json', token)).s, 400);
assert.equal((await post(state, '/api/state', { v: 2 }, token)).s, 400);
assert.equal((await post(state, '/api/state', S({ phrase: '123 !!' }), token)).s, 400);
assert.equal((await post(state, '/api/state', 'x'.repeat(9000), token)).s, 413); t('autenticazione e validazione');

// invio stato con lettera chiamata
let st = S({ revealed: [1, 2, 3 ].slice(0, 0) });
let w = await post(state, '/api/state', st, token); assert.equal(w.s, 200); assert.equal(w.b.ver, 1);
st = S({ revealed: [5, 6], called: [{ l: 'O', r: 'hit' }], ev: { seq: 1, t: 'hit', l: 'O', n: 2 } });
st.phrase = 'CHI DORME NON PIGLIA PESCI';
w = await post(state, '/api/state', st, token); assert.equal(w.b.ver, 2);
assert.equal(stat('game_started'), 1); assert.equal(stat('letter_hit'), 1); t('stato e contatori');
w = await post(state, '/api/state', st, token); // stesso evento rinviato
assert.equal(stat('letter_hit'), 1); t('rinvio non conta due volte');

// la frase in chiaro non esce dallo schermo
g = await call(screen, `/api/screen?c=${code}&v=0`);
const view = g.b.view;
assert.equal(view.phrase.length, st.phrase.length);
for (let i = 0; i < st.phrase.length; i++) {
  const c = st.phrase[i];
  if (/[A-Z]/.test(c) && !view.revealed.includes(i)) assert.equal(view.phrase[i], 'A');
  else assert.equal(view.phrase[i], c);
}
assert.ok(!JSON.stringify(g.b).includes('PIGLIA')); t('frase mascherata');

// revealed non coerenti (indice fuori frase, non lettera, doppioni) vengono scartati
w = await post(state, '/api/state', S({ revealed: [999, 3, 3, 5, -1, 'a'] }), token);
const saved = JSON.parse(env.DB._db.prepare('SELECT state FROM rooms').get().state);
assert.deepEqual(saved.revealed, [5]); t('revealed ripulito');

// completamento
const all = []; for (let i = 0; i < st.phrase.length; i++) if (/[A-Z]/.test(st.phrase[i])) all.push(i);
w = await post(state, '/api/state', S({ revealed: all, called: [{ l: 'E', r: 'hit' }], ev: { seq: 9, t: 'hit', l: 'E', n: 1 } }), token);
assert.equal(stat('phrase_completed'), 1); t('frase completata');

// limite codici sbagliati
let last;
for (let i = 0; i < 32; i++) last = await call(screen, '/api/screen?c=ZZZZZZ', { headers: { 'CF-Connecting-IP': '9.9.9.9' } });
assert.equal(last.s, 429); t('limite tentativi');

// ruota e punteggi
const W = [100, 'B', 250, 'P', 500, 300];
const G0 = { on: true, vowel: 250, wheel: W, phase: 'letter', val: 300, scores: [{ r: 600, t: 1200, j: 1 }, { r: 0, t: 0 }], spin: { seq: 1, i: 2, turns: 4, j: 0.3 } };
w = await post(state, '/api/state', S({ game: G0, ev: { seq: 20, t: 'spin', v: 250, p: 0 } }), token);
assert.equal(w.s, 200);
let sv = JSON.parse(env.DB._db.prepare('SELECT state FROM rooms').get().state);
assert.deepEqual(sv.game.wheel, W); assert.equal(sv.game.scores[0].t, 1200); assert.equal(sv.ev.v, 250);
assert.equal(stat('wheel_spin'), 1); t('ruota e punteggi salvati');
g = await call(screen, `/api/screen?c=${code}&v=0`);
assert.equal(g.b.view.game.phase, 'letter'); assert.equal(g.b.view.game.scores[0].r, 600); t('lo schermo riceve la ruota');
w = await post(state, '/api/state', S({ game: { ...G0, wheel: [100, 'J', 'B', 'P', 200, 300], phase: 'jolly', loss: 'B', scores: [{ r: 600, t: 1200, j: 1 }, { r: 0, t: 0, j: 7 }], spin: { seq: 2, i: 2, turns: 4, j: 0.3 } }, ev: { seq: 5, t: 'jolly', p: 0, dup: 1 } }), token);
assert.equal(w.s, 200);
sv = JSON.parse(env.DB._db.prepare('SELECT state FROM rooms').get().state);
assert.equal(sv.game.phase, 'jolly'); assert.equal(sv.game.loss, 'B'); assert.equal(sv.game.scores[0].j, 1); assert.equal(sv.game.scores[1].j, 0); assert.ok(sv.game.wheel.includes('J')); assert.equal(sv.ev.t, 'jolly'); assert.equal(sv.ev.dup, 1); t('Jolly: spicchio, fase, gettone ed evento salvati');
// ruota non valida o modalita' spenta: game = null, lo stato resta valido
for (const bad of [{ ...G0, wheel: [1, 2, 3] }, { ...G0, wheel: [100, 'X', 1, 2, 3, 4] }, { ...G0, on: false }, { ...G0, wheel: Array(40).fill(100) }]) {
  w = await post(state, '/api/state', S({ game: bad }), token);
  assert.equal(w.s, 200);
  sv = JSON.parse(env.DB._db.prepare('SELECT state FROM rooms').get().state);
  assert.equal(sv.game, null);
}
t('ruota non valida scartata');
// punteggi fuori scala ripuliti, lunghezza uguale ai concorrenti
w = await post(state, '/api/state', S({ game: { ...G0, scores: [{ r: -5, t: 1e12 }], spin: { seq: 'x', i: 99, turns: 99, j: 7 } } }), token);
sv = JSON.parse(env.DB._db.prepare('SELECT state FROM rooms').get().state);
assert.equal(sv.game.scores.length, 2); assert.deepEqual(sv.game.scores[0], { r: 0, t: 0, j: 0 }); assert.equal(sv.game.spin.i, -1); assert.equal(sv.game.spin.turns, 4); assert.equal(sv.game.spin.j, 0.5);
t('punteggi ripuliti');
// frase risolta
w = await post(state, '/api/state', S({ game: G0, ev: { seq: 30, t: 'solved', p: 0, pts: 600 } }), token);
assert.equal(stat('phrase_solved'), 1); t('contatore frase risolta');

// statistiche admin
const adm = (tok) => adminStats({ request: new Request('http://x/api/admin/stats?days=7', { headers: tok ? { Authorization: 'Bearer ' + tok } : {} }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
assert.equal((await adm('a'.repeat(20))).s, 503); // ADMIN_TOKEN non impostato
env.ADMIN_TOKEN = 'segreto-lungo-1234567';
assert.equal((await adm()).s, 401); assert.equal((await adm('sbagliato-sbagliato-1')).s, 401);
const a = await adm('segreto-lungo-1234567');
assert.equal(a.s, 200); assert.equal(a.b.rooms_total, 1); assert.ok(a.b.rows.some((r) => r.name === 'room_created' && r.n === 1 && r.lang === 'it'));
env.ADMIN_TOKEN = 'Ab!9#xY_k$2@qZ+p'; // 16 caratteri con simboli
assert.equal((await adm('Ab!9#xY_k$2@qZ+p')).s, 200);
t('statistiche admin');

// domande e suggerimenti
const ADM = 'Ab!9#xY_k$2@qZ+p';
const fbp = (body, ip = '5.5.5.5') => fbPost({ request: new Request('http://x/api/feedback', { method: 'POST', body: JSON.stringify(body), headers: { 'CF-Connecting-IP': ip } }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
const fbg = (id) => fbGet({ request: new Request('http://x/api/feedback?id=' + id, { headers: { 'CF-Connecting-IP': '6.6.6.6' } }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
const al = (status) => admList({ request: new Request('http://x/api/admin/messages?status=' + status, { headers: { Authorization: 'Bearer ' + ADM } }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
const aa = (body, tok = ADM) => admAct({ request: new Request('http://x/api/admin/messages', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + tok } }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));

assert.equal((await fbp({ kind: 'question', text: 'ok' })).s, 400);                     // troppo corto
assert.equal((await fbp({ kind: 'question', text: 'x'.repeat(1600) })).s, 400);         // troppo lungo
assert.equal((await fbp({ text: 'Come si usa la ruota?', email: 'non-una-mail' })).s, 400);
const trap = await fbp({ text: 'sono un robot spam', hp: 'http://spam' });               // honeypot
assert.equal(trap.s, 200); assert.equal(env.DB._db.prepare('SELECT COUNT(*) n FROM messages').get().n, 0); t('feedback: validazione e honeypot');
const f1 = await fbp({ kind: 'suggestion', text: 'Vorrei una manche finale.\nGrazie!', email: 'mario@example.com', lang: 'it' });
assert.equal(f1.s, 200); assert.match(f1.b.id, /^[A-Z2-9]{10}$/);
let g1 = await fbg(f1.b.id); assert.equal(g1.s, 200); assert.equal(g1.b.status, 'open'); assert.equal(g1.b.reply, ''); assert.equal(g1.b.kind, 'suggestion');
assert.ok(!('email' in g1.b)); assert.ok(g1.b.text.includes('\n')); t('feedback: invio e lettura senza email');
assert.equal((await fbg('ZZZZZZZZZZ')).s, 404); assert.equal((await fbg('abc')).s, 400); t('feedback: codici sconosciuti');
assert.equal((await al('open')).s, 200);
env.ADMIN_TOKEN = ADM;
let l1 = await al('open'); assert.equal(l1.b.open, 1); assert.equal(l1.b.rows[0].email, 'mario@example.com'); assert.equal(l1.b.rows[0].lang, 'it'); t('admin: elenco con email');
const noadm = await admList({ request: new Request('http://x/api/admin/messages'), env }); assert.equal(noadm.status, 401);
assert.equal((await aa({ id: f1.b.id, action: 'reply', reply: 'Buona idea, la prevediamo.' }, 'sbagliatosbagliato1')).s, 401); t('admin: protetto');
assert.equal((await aa({ id: f1.b.id, action: 'reply', reply: '   ' })).s, 400);
assert.equal((await aa({ id: 'ZZZZZZZZZZ', action: 'reply', reply: 'x' })).s, 404);
assert.equal((await aa({ id: f1.b.id, action: 'reply', reply: 'Buona idea, la prevediamo.' })).s, 200);
g1 = await fbg(f1.b.id); assert.equal(g1.b.status, 'answered'); assert.equal(g1.b.reply, 'Buona idea, la prevediamo.'); assert.ok(g1.b.replied > 0);
l1 = await al('open'); assert.equal(l1.b.open, 0); assert.equal(l1.b.answered, 1);
assert.equal((await al('answered')).b.rows.length, 1); assert.equal((await al('all')).b.rows.length, 1); t('admin: risposta visibile all\'utente');
assert.equal((await aa({ id: f1.b.id, action: 'reopen' })).s, 200); assert.equal((await al('open')).b.rows.length, 1);
assert.equal((await aa({ id: f1.b.id, action: 'delete' })).s, 200); assert.equal((await fbg(f1.b.id)).s, 404); t('admin: riapri ed elimina');
// limite: 5 messaggi all'ora per rete
let lim; for (let i = 0; i < 6; i++) lim = await fbp({ text: 'domanda numero ' + i + ' lunga abbastanza' }, '7.7.7.7');
assert.equal(lim.s, 429); t('feedback: limite per rete');
assert.ok(stat('feedback_suggestion') === 1 && stat('feedback_question') >= 1); t('feedback: contatori');

// lettere sbagliate nascoste: il campo hm arriva allo schermo solo se vero
const hr = await post(room, '/api/room', { lang: 'it' });
let hs = await post(state, '/api/state', S({ hm: true }), hr.b.token); assert.equal(hs.s, 200);
let hg = await call(screen, `/api/screen?c=${hr.b.code}&first=1`); assert.equal(hg.b.view.hm, true); t('hm: nascoste inviate allo schermo');
await post(state, '/api/state', S({ hm: 'si' }), hr.b.token);
hg = await call(screen, `/api/screen?c=${hr.b.code}&first=1`); assert.equal(hg.b.view.hm, false); t('hm: valore non booleano ignorato');

// ---- frasi della community ----
env.ADMIN_TOKEN = ADM;
const ph = (body) => post(phPost, '/api/phrases', body);
const apg = (qs) => apGet({ request: new Request('http://x/api/admin/phrases?' + qs, { headers: { Authorization: 'Bearer ' + ADM } }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
const app = (body, tok = ADM) => apPost({ request: new Request('http://x/api/admin/phrases', { method: 'POST', body: JSON.stringify(body), headers: { Authorization: 'Bearer ' + tok } }), env }).then(async (r) => ({ s: r.status, b: await r.json() }));
let pr = await ph({ lang: 'it', items: [{ c: 'Proverbi', t: 'Chi va piano va sano' }, { t: 'http://spam.com bella' }, { t: 'ab' }, { t: 'che cazzo' }, { c: 'x', t: 'chi VA piano, va sano!' }] });
assert.equal(pr.s, 200); assert.equal(pr.b.accepted, 1); t('frasi: filtri e doppioni nello stesso invio');
pr = await ph({ lang: 'it', items: [{ c: 'Proverbi', t: 'Chi va piano va sano' }] });
assert.equal(pr.b.accepted, 1);
pr = await ph({ lang: 'it', items: [{ c: 'Storia', t: 'Colombo scoprì l\'America nel 1492' }, { c: 'Storia', t: 'Il 4 novembre' }] });
assert.equal(pr.b.accepted, 0); t('frasi: le cifre non sono ammesse (solo lettere)');
let pg = await apg('status=pending&lang=it');
assert.equal(pg.b.pending, 1); assert.equal(pg.b.rows[0].n, 2); assert.equal(pg.b.rows[0].text, 'CHI VA PIANO VA SANO'); t('frasi: da approvare, contatore proposte');
assert.equal((await call(phGet, '/api/phrases?lang=it')).b.rows.length, 0); t('frasi: non approvate non pubbliche');
assert.equal((await ph({ lang: 'it', items: [{ t: 'Frase da bot' }], hp: 'x' })).b.accepted, 0); t('frasi: trappola robot');
const key = pg.b.rows[0].k;
assert.equal((await app({ items: [{ lang: 'it', k: key }], action: 'approve' }, 'sbagliato-sbagliato-1')).s, 401); t('frasi: admin richiesto');
assert.equal((await app({ items: [{ lang: 'it', k: key }], action: 'approve' })).s, 200);
let pub = await call(phGet, '/api/phrases?lang=it');
assert.deepEqual(pub.b.rows, [{ c: 'Proverbi', t: 'CHI VA PIANO VA SANO' }]); t('frasi: approvata e pubblica');
assert.equal((await call(phGet, '/api/phrases?lang=en')).b.rows.length, 0); t('frasi: catalogo separato per lingua');
const ed = await app({ lang: 'it', k: key, action: 'edit', text: 'Chi va piano, va sano e lontano', cat: 'Proverbi', newLang: 'it' });
assert.equal(ed.s, 200);
pub = await call(phGet, '/api/phrases?lang=it'); assert.equal(pub.b.rows[0].t, 'CHI VA PIANO, VA SANO E LONTANO'); t('frasi: modifica testo');
for (let i = 0; i < 3; i++) await post(phPost, '/api/phrases', { lang: 'it', report: { t: 'Chi va piano, va sano e lontano' } });
assert.equal((await call(phGet, '/api/phrases?lang=it')).b.rows.length, 0); t('frasi: 3 segnalazioni la ritirano');
pg = await apg('status=reported'); assert.equal(pg.b.rows.length, 1);
await app({ items: [{ lang: 'it', k: pg.b.rows[0].k }], action: 'reject' });
await ph({ lang: 'it', items: [{ t: 'Chi va piano va sano e lontano' }] });
pg = await apg('status=rejected'); assert.equal(pg.b.rows.length, 1); assert.equal((await apg('status=pending')).b.rows.length, 0); t('frasi: rifiutata non torna da approvare');
const mv = await app({ items: [{ lang: 'it', k: pg.b.rows[0].k }], action: 'delete' }); assert.equal(mv.s, 200); t('frasi: eliminazione');
assert.ok(stat('phrases_shared') >= 2); t('frasi: contatore anonimo');

console.log(`\n${ok} test passati`);
