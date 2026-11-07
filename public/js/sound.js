/* sound.js - suoni sintetizzati con WebAudio (nessun file audio, nessun diritto di terzi).
 * Il browser permette l'audio solo dopo un gesto dell'utente: unlock() va chiamata da un click o un tasto.
 * Ogni funzione accetta un ritardo in secondi (per sincronizzarsi con le animazioni). */
(function (g) {
'use strict';

var ctx = null, master = null, muted = false, listeners = [];
try { muted = localStorage.getItem('stf-muted') === '1'; } catch (e) {}

function unlock() {
  try {
    if (!ctx) {
      var AC = g.AudioContext || g.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { return false; }
  notify();
  return true;
}
function ready() { return !!ctx && ctx.state !== 'closed'; }
function isMuted() { return muted; }
function setMuted(m) {
  muted = !!m;
  try { localStorage.setItem('stf-muted', muted ? '1' : '0'); } catch (e) {}
  notify();
}
function onChange(fn) { listeners.push(fn); }
function notify() { for (var i = 0; i < listeners.length; i++) { try { listeners[i](); } catch (e) {} } }

function can() { return ready() && !muted && ctx.state === 'running'; }

/* una nota: frequenza, inizio (s da adesso), durata, forma d'onda, volume, frequenza finale facoltativa */
function tone(freq, at, dur, type, vol, toFreq) {
  var t0 = ctx.currentTime + (at || 0);
  var o = ctx.createOscillator(), gn = ctx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (toFreq) o.frequency.exponentialRampToValueAtTime(toFreq, t0 + dur);
  gn.gain.setValueAtTime(0.0001, t0);
  gn.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01);
  gn.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(gn); gn.connect(master);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

/* lettera che si scopre: tic secco + nota che sale con k */
function flip(k, at) {
  if (!can()) return;
  var f = 520 * Math.pow(1.06, Math.min(k || 0, 12));
  tone(f, at, 0.16, 'triangle', 0.32);
  tone(f * 2, at, 0.07, 'square', 0.07);
}
/* lettera sbagliata */
function miss(at) {
  if (!can()) return;
  tone(190, at, 0.32, 'sawtooth', 0.28, 110);
  tone(150, (at || 0) + 0.12, 0.34, 'sawtooth', 0.24, 80);
}
/* paletto della ruota */
function tick() {
  if (!can()) return;
  tone(1500, 0, 0.035, 'square', 0.09);
}
/* ruota ferma su un valore */
function land(at) {
  if (!can()) return;
  [660, 880, 1100].forEach(function (f, n) { tone(f, (at || 0) + n * 0.09, 0.22, 'triangle', 0.3); });
}
function bankrupt(at) {
  if (!can()) return;
  [392, 370, 349, 262].forEach(function (f, n) { tone(f, (at || 0) + n * 0.24, 0.34, 'sawtooth', 0.22); });
}
function pass(at) {
  if (!can()) return;
  tone(440, at, 0.2, 'square', 0.16, 330);
  tone(330, (at || 0) + 0.2, 0.3, 'square', 0.16, 247);
}
/* punti guadagnati */
function coin(at) {
  if (!can()) return;
  tone(988, at, 0.09, 'square', 0.14);
  tone(1319, (at || 0) + 0.09, 0.3, 'square', 0.14);
}
/* frase risolta */
function win(at) {
  if (!can()) return;
  [523, 659, 784, 1047, 784, 1047, 1319].forEach(function (f, n) {
    tone(f, (at || 0) + n * 0.13, 0.28, 'triangle', 0.32);
  });
  tone(262, at, 0.9, 'sine', 0.2);
}
function wrong(at) {
  if (!can()) return;
  tone(220, at, 0.4, 'square', 0.2, 140);
}

g.Sound = {
  unlock: unlock, ready: ready, isMuted: isMuted, setMuted: setMuted, onChange: onChange,
  flip: flip, miss: miss, tick: tick, land: land, bankrupt: bankrupt, pass: pass,
  coin: coin, win: win, wrong: wrong
};
})(window);
