import assert from 'node:assert/strict';
import '../public/js/rules.js';
const R = globalThis.Rules;
let ok = 0; const t = (n) => { ok++; console.log('ok', n); };
const rndSeq = (...v) => { let k = 0; return () => v[k++ % v.length]; };
const mk = (players = ['Anna', 'Ben', 'Cleo'], opts) => ({ players, turn: 0, ev: { seq: 0, t: '' }, game: R.newGame(players.length, opts) });

// ruota predefinita
assert.equal(R.DEFAULT_WHEEL.length, 24); assert.ok(R.DEFAULT_WHEEL.includes('B') && R.DEFAULT_WHEEL.includes('P')); t('ruota predefinita');
assert.deepEqual(R.parseWheel('100, 200\nbancarotta;passa 300'), null); // "passa 300" non valido
assert.deepEqual(R.parseWheel('100,200,300,Bancarotta,PASS,Lose,500'), [100, 200, 300, 'B', 'P', 'P', 500]);
assert.equal(R.parseWheel('1,2,3'), null); assert.equal(R.parseWheel('1,2,3,4,5,x'), null); assert.equal(R.parseWheel('0,2,3,4,5,6'), null);
assert.equal(R.parseWheel(Array(33).fill(5).join(',')), null); t('parseWheel');

// flusso: gira -> consonante -> punti
let G = mk(undefined, { wheel: [100, 200, 300, 400, 'B', 'P'] });
assert.equal(R.canCall(G, 'B'), false); assert.equal(R.canCall(G, 'A'), false); assert.equal(R.canSpin(G), true); assert.equal(R.canSolve(G), false);
assert.ok(R.spin(G, rndSeq(0.34, 0.0, 0.5)));            // indice 2 -> 300
assert.equal(G.game.val, 300); assert.equal(G.game.phase, 'letter'); assert.equal(G.game.spin.i, 2); assert.equal(G.game.spin.turns, 3);
assert.equal(G.ev.t, 'spin'); assert.equal(G.ev.v, 300);
assert.equal(R.spin(G, rndSeq(0)), false);               // non si gira due volte di fila
assert.equal(R.canCall(G, 'B'), true); assert.equal(R.canCall(G, 'A'), false);
R.call(G, 'T', 2);
assert.equal(G.game.scores[0].r, 600); assert.equal(G.game.phase, 'choose'); assert.equal(G.turn, 0); assert.equal(G.ev.pts, 600); t('gira e consonante');

// vocale a pagamento
assert.equal(R.canBuyVowel(G), true); R.call(G, 'E', 1);
assert.equal(G.game.scores[0].r, 350); assert.equal(G.ev.cost, 250); assert.equal(G.game.phase, 'choose'); assert.equal(G.ev.vow, 1);
R.call(G, 'U', 0); assert.equal(G.game.scores[0].r, 100); assert.equal(G.turn, 1); assert.equal(G.game.phase, 'spin'); t('vocale a pagamento');
G = mk(); assert.equal(R.canBuyVowel(G), false); G.game.phase = 'choose'; assert.equal(R.canBuyVowel(G), false); G.game.scores[0].r = 249; assert.equal(R.canBuyVowel(G), false); G.game.scores[0].r = 250; assert.equal(R.canBuyVowel(G), true); t('vocale solo con punti sufficienti');

// consonante sbagliata passa il turno, mantiene i punti
G = mk(undefined, { wheel: [100, 200, 300, 400, 'B', 'P'] }); G.game.scores[0].r = 500;
R.spin(G, rndSeq(0.0, 0, 0)); R.call(G, 'Z', 0);
assert.equal(G.turn, 1); assert.equal(G.game.scores[0].r, 500); assert.equal(G.game.phase, 'spin'); assert.equal(G.ev.t, 'miss'); t('consonante sbagliata');

// bancarotta e passa
G = mk(undefined, { wheel: [100, 200, 300, 400, 'B', 'P'] }); G.game.scores[0].r = 700; G.game.scores[0].t = 900;
R.spin(G, rndSeq(4.5 / 6, 0, 0));
assert.equal(G.ev.t, 'bankrupt'); assert.equal(G.game.scores[0].r, 0); assert.equal(G.game.scores[0].t, 900); assert.equal(G.turn, 1); assert.equal(G.game.phase, 'spin');
R.spin(G, rndSeq(5.5 / 6, 0, 0)); assert.equal(G.ev.t, 'pass'); assert.equal(G.turn, 2); t('bancarotta e passa');

// risolta: la manche entra nel totale; il turno non cambia
G = mk(); G.game.phase = 'choose'; G.game.scores[1].r = 800; G.turn = 1;
assert.equal(R.canSolve(G), true); R.solved(G);
assert.equal(G.game.scores[1].t, 800); assert.equal(G.game.phase, 'spin'); assert.equal(G.ev.t, 'solved'); assert.equal(G.ev.pts, 800);
R.newRound(G, true); assert.equal(G.game.scores[1].r, 0); assert.equal(G.game.scores[1].t, 800); assert.equal(G.turn, 2); t('risolta e nuova manche');
// risposta sbagliata
G = mk(); G.game.phase = 'choose'; R.wrong(G); assert.equal(G.turn, 1); assert.equal(G.game.phase, 'spin'); assert.equal(G.ev.t, 'wrong'); t('risposta sbagliata');
// turno a mano e reset punteggi
G = mk(); G.game.phase = 'letter'; R.setTurn(G, 2); assert.equal(G.game.phase, 'spin'); G.game.scores[2].t = 5; R.resetScores(G); assert.equal(G.game.scores[2].t, 0); t('turno e reset');
// concorrenti cambiati
G = mk(); G.turn = 2; R.fitPlayers(G, ['a'].length); assert.equal(G.game.scores.length, 1); assert.equal(G.turn, 0); R.fitPlayers(G, 4); assert.equal(G.game.scores.length, 4); t('numero concorrenti');
// senza concorrenti o con punteggi spenti: modalita' libera
G = mk([]); assert.equal(R.active(G), false); assert.equal(R.canCall(G, 'A'), true); assert.equal(R.spin(G, rndSeq(0)), false);
R.call(G, 'A', 1); assert.equal(G.ev.t, 'hit'); assert.equal(G.ev.pts, undefined); t('modalita libera');
// l'ultimo indice non esce dall'array
G = mk(undefined, { wheel: [1, 2, 3, 4, 5, 6] }); R.spin(G, rndSeq(1, 0, 0)); assert.equal(G.game.spin.i, 5); t('rnd=1 sicuro');

// ruota con STOP: parte, gira, si ferma in base al tempo
G = mk(undefined, { wheel: [100, 200, 300, 400, 'B', 'P'] });
assert.ok(R.startSpin(G)); assert.equal(G.game.phase, 'rolling'); assert.equal(G.game.spin.st, 1); assert.equal(G.game.spin.i, -1);
assert.equal(R.canSpin(G), false); assert.equal(R.canStop(G), true); assert.equal(R.canSolve(G), false); assert.equal(R.canCall(G, 'T'), false);
assert.equal(R.startSpin(G), false); assert.equal(R.stopSpin(mk(), 0), false);
const seq0 = G.game.spin.seq;
assert.ok(R.stopSpin(G, 1000, rndSeq(0.1)));
assert.equal(G.game.spin.st, 0); assert.equal(G.game.spin.seq, seq0 + 1);
// 1000 ms * 720 deg/s + 900 = 1620 -> 180 deg -> 6 segmenti da 60: indice 3
assert.equal(G.game.spin.i, 3); assert.equal(G.game.val, 400); assert.equal(G.game.phase, 'letter'); assert.equal(G.ev.t, 'spin'); t('startSpin e stopSpin');
// tempi diversi, settori diversi; sempre dentro la ruota
const seen = new Set(); for (let ms = 0; ms < 3000; ms += 37) { G = mk(undefined, { wheel: [1, 2, 3, 4, 5, 6] }); R.startSpin(G); R.stopSpin(G, ms); assert.ok(G.game.spin.i >= 0 && G.game.spin.i < 6); seen.add(G.game.spin.i); }
assert.equal(seen.size, 6); t('lo stop copre tutti i settori');
// annullare un giro: cambio turno o nuova frase fermano la ruota senza risultato
G = mk(); R.startSpin(G); const s1 = G.game.spin.seq; R.setTurn(G, 1); assert.equal(G.game.phase, 'spin'); assert.equal(G.game.spin.st, 0); assert.equal(G.game.spin.i, -1); assert.equal(G.game.spin.seq, s1 + 1);
G = mk(); R.startSpin(G); R.newRound(G, true); assert.equal(G.game.spin.st, 0); assert.equal(G.game.phase, 'spin'); t('giro annullato');
// bancarotta: azzera la manche; con bk anche il totale
G = mk(undefined, { wheel: [100, 'B', 100, 'B', 100, 'B'] }); G.game.scores[0] = { r: 500, t: 900 }; R.spin(G, rndSeq(0.2)); assert.equal(G.ev.t, 'bankrupt');
assert.equal(G.game.scores[0].r, 0); assert.equal(G.game.scores[0].t, 900); assert.equal(G.turn, 1);
G = mk(undefined, { wheel: [100, 'B', 100, 'B', 100, 'B'], bk: true }); G.game.scores[0] = { r: 500, t: 900 }; R.spin(G, rndSeq(0.2));
assert.equal(G.game.scores[0].r, 0); assert.equal(G.game.scores[0].t, 0); assert.equal(G.game.scores[1].t, 0); t('bancarotta con e senza opzione totale');

console.log(`\n${ok} test passati`);
