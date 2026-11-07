import assert from 'node:assert/strict';
import { fakeD1 } from './d1shim.mjs';
import { onRequestPost as room } from '../functions/api/room.js';
import { onRequestPost as state } from '../functions/api/state.js';
import { onRequestGet as screen } from '../functions/api/screen.js';
import { onRequestGet as adminStats } from '../functions/api/admin/stats.js';

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

console.log(`\n${ok} test passati`);
