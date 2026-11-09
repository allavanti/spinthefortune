/* rules.js - regole di gioco con ruota e punteggi (usate dalla pagina del conduttore).
 *
 * Modello: G.game = { on, vowel, wheel, phase, val, loss, scores:[{r,t,j}], spin:{seq,i,turns,j} }
 *   phase 'spin'   il giocatore di turno deve girare la ruota
 *   phase 'letter' ha girato un valore: deve chiamare una consonante (vale G.game.val per lettera)
 *   phase 'choose' ha trovato lettere: puo' girare ancora, comprare una vocale o risolvere
 *   phase 'rolling' la ruota gira sulla TV finche' il conduttore non preme STOP (spin.st = 1)
 *   phase 'jolly' chi e' di turno sta per perdere il turno (loss = B, P, M, V o W) e ha il Jolly: puo' usarlo o rinunciare
 *   j = 1 se il giocatore ha il Jolly (si prende con lo spicchio JOLLY, resta tra le manche, si consuma)
 *   bk = la bancarotta azzera anche il totale accumulato nelle manche precedenti (opzione)
 *   r = punti della manche (si azzerano con Bancarotta), t = totale accumulato
 * Gli eventi vanno in G.ev (seq cresce a ogni evento) e lo schermo li mostra.
 */
(function (g) {
'use strict';

var VOWELS = 'AEIOU';
var DEFAULT_WHEEL = [300, 150, 'B', 500, 200, 250, 100, 'P', 400, 350, 600, 150,
                     'B', 800, 200, 300, 450, 'P', 250, 1000, 500, 100, 350, 700];
DEFAULT_WHEEL[11] = 'J';

function isVowel(L) { return VOWELS.indexOf(L) >= 0; }

/* "100, 250, bancarotta, passa" (virgole o righe) -> array, oppure null se non valido */
function parseWheel(text) {
  var parts = String(text || '').split(/[\n,;]+/);
  var out = [];
  for (var n = 0; n < parts.length; n++) {
    var s = parts[n].trim();
    if (!s) continue;
    if (/^(b|bankrupt|bancarotta)$/i.test(s)) out.push('B');
    else if (/^(p|pass|passa|lose|perdi|perde)$/i.test(s)) out.push('P');
    else if (/^(j|jolly|joker)$/i.test(s)) out.push('J');
    else if (/^\d{1,5}$/.test(s) && +s >= 1) out.push(+s);
    else return null;
  }
  return out.length >= 6 && out.length <= 32 ? out : null;
}
/* lang: 'it' scrive BANCAROTTA e PASSA, altrimenti BANKRUPT e PASS (parseWheel li capisce entrambi) */
function wheelToText(w, lang) {
  var b = lang === 'it' ? 'BANCAROTTA' : 'BANKRUPT', p = lang === 'it' ? 'PASSA' : 'PASS';
  return w.map(function (x) { return x === 'B' ? b : x === 'P' ? p : x === 'J' ? (lang === 'it' ? 'JOLLY' : 'JOKER') : String(x); }).join('\n');
}

function newGame(players, opts) {
  opts = opts || {};
  var sc = [];
  for (var n = 0; n < players; n++) sc.push({ r: 0, t: 0, j: 0 });
  return {
    on: true,
    vowel: typeof opts.vowel === 'number' ? opts.vowel : 250,
    wheel: (opts.wheel || DEFAULT_WHEEL).slice(),
    bk: opts.bk === true,
    phase: 'spin', val: 0, loss: '', scores: sc,
    spin: { seq: 0, i: -1, turns: 4, j: 0.5, st: 0 }
  };
}

/* adegua i punteggi al numero di concorrenti (aggiunge o toglie in coda) */
function fitPlayers(G, players) {
  var gm = G.game;
  if (!gm) return;
  while (gm.scores.length < players) gm.scores.push({ r: 0, t: 0, j: 0 });
  gm.scores.length = players;
  if (G.turn >= players) G.turn = 0;
}

function active(G) { return !!(G.game && G.game.on && G.players.length > 0); }

function event(G, ev) {
  ev.seq = G.ev.seq + 1;
  G.ev = ev;
}
function nextTurn(G) {
  if (G.players.length) G.turn = (G.turn + 1) % G.players.length;
  if (G.game) { cancelRun(G); G.game.phase = 'spin'; G.game.val = 0; G.game.loss = ''; }
}
/* se la ruota sta girando la ferma senza risultato (la TV la nasconde) */
function cancelRun(G) {
  var gm = G.game;
  if (gm && gm.spin && gm.spin.st === 1) gm.spin = { seq: gm.spin.seq + 1, i: -1, turns: 4, j: 0.5, st: 0 };
}

/* Cosa puo' fare chi e' di turno */
function canSpin(G) { return active(G) && (G.game.phase === 'spin' || G.game.phase === 'choose'); }
function canSolve(G) { return active(G) && (G.game.phase === 'letter' || G.game.phase === 'choose'); }
function canStop(G) { return active(G) && G.game.phase === 'rolling'; }
function canJolly(G) { return active(G) && G.game.phase === 'jolly'; }
function canBuyVowel(G) {
  return active(G) && G.game.phase === 'choose' && G.game.scores[G.turn].r >= G.game.vowel;
}
/* la lettera L si puo' chiamare adesso? (senza modalita' punteggi: sempre) */
function canCall(G, L) {
  if (!active(G)) return true;
  if (isVowel(L)) return canBuyVowel(G);
  return G.game.phase === 'letter';
}

/* Fa partire la ruota: gira finche' il conduttore non preme STOP. */
function startSpin(G) {
  if (!canSpin(G)) return false;
  var gm = G.game;
  gm.phase = 'rolling';
  gm.spin = { seq: gm.spin.seq + 1, i: -1, turns: 4, j: 0.5, st: 1 };
  return true;
}
/* Una perdita di turno (B bancarotta, P passa, M lettera mancata, V vocale mancata, W risposta sbagliata).
 * Chi ha il Jolly puo' annullarla: in quel caso si ferma in fase 'jolly' in attesa della scelta. */
function loseTurn(G, kind, prevPhase) {
  var gm = G.game, p = G.turn;
  if (gm.scores[p].j === 1) {
    gm.loss = kind;
    gm.prev = prevPhase || 'spin';
    gm.phase = 'jolly';
    return;
  }
  applyLoss(G, kind);
}
function applyLoss(G, kind) {
  var gm = G.game, p = G.turn;
  if (kind === 'B') {
    gm.scores[p].r = 0;
    if (gm.bk) gm.scores[p].t = 0;
    event(G, { t: 'bankrupt', v: 'B', p: p });
  } else if (kind === 'P') {
    event(G, { t: 'pass', v: 'P', p: p });
  } else if (kind === 'W') {
    event(G, { t: 'wrong', p: p });
  }
  nextTurn(G);
}
/* Il giocatore usa il Jolly: la perdita di turno viene annullata e il Jolly si consuma. */
function useJolly(G) {
  if (!canJolly(G)) return false;
  var gm = G.game, p = G.turn, kind = gm.loss;
  gm.scores[p].j = 0;
  gm.phase = kind === 'W' ? (gm.prev === 'letter' ? 'letter' : 'choose') : kind === 'V' ? 'choose' : 'spin';
  gm.val = gm.phase === 'letter' ? gm.val : 0;
  gm.loss = '';
  event(G, { t: 'jollyuse', p: p, k: kind });
  return true;
}
/* Rinuncia al Jolly: la perdita di turno si applica. */
function declineJolly(G) {
  if (!canJolly(G)) return false;
  var kind = G.game.loss;
  G.game.loss = '';
  applyLoss(G, kind);
  return true;
}
/* Esito del giro sul settore i: aggiorna punti, fase ed evento. */
function resolve(G, i, rnd) {
  var gm = G.game;
  var v = gm.wheel[i];
  gm.spin = { seq: gm.spin.seq + 1, i: i, turns: 3 + Math.floor(rnd() * 3), j: rnd(), st: 0 };
  var p = G.turn;
  if (v === 'B') {
    loseTurn(G, 'B');
  } else if (v === 'P') {
    loseTurn(G, 'P');
  } else if (v === 'J') {
    var dup = gm.scores[p].j === 1;
    gm.scores[p].j = 1;
    gm.phase = 'spin';
    event(G, dup ? { t: 'jolly', p: p, dup: 1 } : { t: 'jolly', p: p });
  } else {
    gm.phase = 'letter';
    gm.val = v;
    event(G, { t: 'spin', v: v, p: p });
  }
}
/* STOP: il settore dipende dal tempo trascorso dalla partenza (ms), a DPS gradi al secondo, piu' la frenata. */
var DPS = 720, BRAKE_DEG = 900;
function stopSpin(G, elapsedMs, rnd) {
  if (!canStop(G)) return false;
  var n = G.game.wheel.length;
  var deg = ((Math.max(0, elapsedMs) / 1000) * DPS + BRAKE_DEG) % 360;
  var i = Math.floor(deg / (360 / n));
  if (i >= n) i = n - 1;
  resolve(G, i, rnd || Math.random);
  return true;
}
/* Giro istantaneo con settore casuale (test e modalita' senza tasto STOP). rnd = numero tra 0 e 1. */
function spin(G, rnd) {
  if (!canSpin(G)) return false;
  var n = G.game.wheel.length;
  var i = Math.floor(rnd() * n);
  if (i >= n) i = n - 1;
  resolve(G, i, rnd);
  return true;
}

/* Il giocatore ha chiamato la lettera L, che compare n volte nella frase. */
function call(G, L, n) {
  var p = G.turn;
  if (!active(G)) {
    event(G, { t: n ? 'hit' : 'miss', l: L, n: n });
    return;
  }
  var gm = G.game;
  if (isVowel(L)) {
    gm.scores[p].r -= gm.vowel;
    var ev = { t: n ? 'hit' : 'miss', l: L, n: n, p: p, vow: 1 };
    if (gm.vowel) ev.cost = gm.vowel;
    event(G, ev);
    if (n) gm.phase = 'choose'; else loseTurn(G, 'V');
    return;
  }
  if (n) {
    var pts = gm.val * n;
    gm.scores[p].r += pts;
    gm.phase = 'choose';
    event(G, { t: 'hit', l: L, n: n, p: p, pts: pts });
  } else {
    event(G, { t: 'miss', l: L, n: 0, p: p });
    loseTurn(G, 'M');
  }
}

/* Frase risolta da chi e' di turno: i punti della manche entrano nel totale. */
function solved(G) {
  if (!active(G)) return;
  var p = G.turn, gm = G.game;
  var pts = gm.scores[p].r;
  gm.scores[p].t += pts;
  gm.phase = 'spin';
  gm.val = 0;
  event(G, { t: 'solved', p: p, pts: pts });
}
/* Risposta sbagliata: passa il turno. */
function wrong(G) {
  if (!active(G)) return;
  var prev = G.game.phase;
  loseTurn(G, 'W', prev);
}
/* Nuova frase: si azzerano i punti della manche; advance = cambia chi inizia. */
function newRound(G, advance) {
  if (!G.game) return;
  G.game.scores.forEach(function (s) { s.r = 0; });
  cancelRun(G);
  G.game.phase = 'spin';
  G.game.val = 0;
  G.game.loss = '';
  if (advance && G.players.length) G.turn = (G.turn + 1) % G.players.length;
}
function resetScores(G) {
  if (!G.game) return;
  G.game.scores.forEach(function (s) { s.r = 0; s.t = 0; s.j = 0; });
  cancelRun(G);
  G.game.phase = 'spin';
  G.game.val = 0;
  G.game.loss = '';
}
/* Cambio turno a mano (nome toccato o pulsante). */
function setTurn(G, n) {
  G.turn = n;
  if (G.game) { cancelRun(G); G.game.phase = 'spin'; G.game.val = 0; G.game.loss = ''; }
}

g.Rules = {
  isVowel: isVowel, DEFAULT_WHEEL: DEFAULT_WHEEL, parseWheel: parseWheel, wheelToText: wheelToText,
  newGame: newGame, fitPlayers: fitPlayers, active: active,
  canSpin: canSpin, canStop: canStop, canJolly: canJolly, useJolly: useJolly, declineJolly: declineJolly, canSolve: canSolve, canBuyVowel: canBuyVowel, canCall: canCall,
  spin: spin, startSpin: startSpin, stopSpin: stopSpin, DPS: DPS, call: call, solved: solved, wrong: wrong, newRound: newRound,
  resetScores: resetScores, setTurn: setTurn
};
})(typeof window !== 'undefined' ? window : globalThis);
