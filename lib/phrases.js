// Frasi proposte dagli utenti: pulizia, chiave di confronto, filtri di base.
// I filtri sono solo una prima barriera: ogni frase passa comunque dall'approvazione dell'amministratore.
import { norm } from './game.js';

export const PH = { min: 4, max: 60, cat: 30, perPost: 30 };

// parole che non devono finire sulla TV di famiglie (prima barriera, in minuscolo e senza accenti)
const BLOCK = new Set([
  'cazzo', 'merda', 'vaffanculo', 'puttana', 'troia', 'stronzo', 'stronza', 'figa', 'minchia', 'negro', 'frocio',
  'fuck', 'fucking', 'shit', 'bitch', 'cunt', 'dick', 'asshole', 'nigger', 'faggot', 'whore', 'porn', 'porno', 'sex', 'nazi',
]);

function limpia(s, max) {
  return String(s || '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Ritorna {text, cat, k} oppure null. text e' maiuscolo; k e' la chiave per scoprire i doppioni (solo lettere, senza accenti).
export function cleanPhrase(text, cat) {
  const t = limpia(text, 200).toUpperCase();
  if (t.length < PH.min || t.length > PH.max) return null;
  if (/https?:|www\.|\.(com|it|net|org|io)\b|@/i.test(t)) return null;       // link ed email
  if (/\d/.test(t)) return null;                                             // si gioca solo con le lettere: niente cifre
  if (!/^[\p{L}\p{N}\s'’.,;:!?\-&()"«»]+$/u.test(t)) return null;            // niente simboli strani
  const letters = [...t].filter((ch) => /^[A-Z]$/.test(norm(ch)));
  if (letters.length < 3) return null;
  const words = t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.some((w) => BLOCK.has(w))) return null;
  // una lettera sola ripetuta ("AAAAAA") non e' una frase
  if (new Set(letters.map(norm)).size < 3) return null;
  const k = letters.map(norm).join('');
  let c = limpia(cat, PH.cat);
  const cw = c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (/https?:|www\.|@/i.test(c) || cw.some((w) => BLOCK.has(w))) c = '';
  return { text: t, cat: c, k };
}
