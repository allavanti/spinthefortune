// Regole di gioco condivise dalle API: validazione dello stato, mascheratura, completamento.
// Le stesse regole di lettera/accenti di public/js/board.js.

export function norm(ch) {
  return ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}
export function isLetter(ch) {
  return /^[A-Z]$/.test(norm(ch));
}

const CTRL = /[\u0000-\u001f\u007f]/g;
const EVENTS = ['', 'hit', 'miss', 'reveal', 'reset'];

function cleanText(s, max) {
  return String(s).replace(CTRL, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

export const LIMITS = { phrase: 200, cat: 60, players: 12, name: 24 };

// Riceve l'oggetto inviato dal conduttore e ne ricostruisce una copia pulita.
// Restituisce null se non valido: non si salva mai nulla che non sia stato ricostruito qui.
export function cleanState(s) {
  if (!s || typeof s !== 'object' || s.v !== 1 || typeof s.phrase !== 'string') return null;

  const phrase = s.phrase
    .normalize('NFC').replace(/[̀-ͯ]/g, '')
    .replace(CTRL, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
  if (!phrase || phrase.length > LIMITS.phrase) return null;
  if (![...phrase].some(isLetter)) return null;

  const revealed = [];
  if (Array.isArray(s.revealed)) {
    const seen = new Set();
    for (const i of s.revealed) {
      if (Number.isInteger(i) && i >= 0 && i < phrase.length && isLetter(phrase[i]) && !seen.has(i)) {
        seen.add(i);
        revealed.push(i);
      }
    }
    revealed.sort((a, b) => a - b);
  }

  const called = [];
  if (Array.isArray(s.called)) {
    const seen = new Set();
    for (const c of s.called) {
      if (c && typeof c.l === 'string' && /^[A-Z]$/.test(c.l) && !seen.has(c.l) &&
          (c.r === 'hit' || c.r === 'miss')) {
        seen.add(c.l);
        called.push({ l: c.l, r: c.r });
      }
    }
  }

  const players = [];
  if (Array.isArray(s.players)) {
    for (const p of s.players) {
      if (typeof p !== 'string') continue;
      const name = cleanText(p, LIMITS.name);
      if (name && players.length < LIMITS.players) players.push(name);
    }
  }
  const turn = Number.isInteger(s.turn) && s.turn >= 0 && s.turn < players.length ? s.turn : 0;

  const ev = { seq: 0, t: '' };
  if (s.ev && typeof s.ev === 'object') {
    if (Number.isInteger(s.ev.seq) && s.ev.seq >= 0 && s.ev.seq <= 1e9) ev.seq = s.ev.seq;
    if (EVENTS.includes(s.ev.t)) ev.t = s.ev.t;
    if (typeof s.ev.l === 'string' && /^[A-Z]$/.test(s.ev.l)) ev.l = s.ev.l;
    if (Number.isInteger(s.ev.n) && s.ev.n >= 0 && s.ev.n <= LIMITS.phrase) ev.n = s.ev.n;
  }

  return { v: 1, phrase, cat: cleanText(s.cat || '', LIMITS.cat), revealed, called, players, turn, ev };
}

// true se tutte le lettere della frase sono scoperte
export function isComplete(state) {
  if (!state) return false;
  const rev = new Set(state.revealed);
  let total = 0;
  for (let i = 0; i < state.phrase.length; i++) {
    if (isLetter(state.phrase[i])) {
      total++;
      if (!rev.has(i)) return false;
    }
  }
  return total > 0;
}

// Copia per lo schermo: le lettere ancora nascoste diventano "A", quindi la soluzione
// non esce mai dal server. La disposizione delle caselle resta identica.
export function maskState(state) {
  const rev = new Set(state.revealed);
  let phrase = '';
  for (let i = 0; i < state.phrase.length; i++) {
    const ch = state.phrase[i];
    phrase += isLetter(ch) && !rev.has(i) ? 'A' : ch;
  }
  return {
    v: 1, phrase, cat: state.cat, revealed: state.revealed,
    called: state.called, players: state.players, turn: state.turn, ev: state.ev,
  };
}
