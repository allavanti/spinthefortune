// Codici casuali leggibili (senza I, L, O, 0, 1) per stanze e richieste.
export const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function casuale(n, alfabeto = ALFABETO) {
  const out = [];
  const limite = 256 - (256 % alfabeto.length); // scarta i valori che sbilancerebbero la scelta
  while (out.length < n) {
    const buf = crypto.getRandomValues(new Uint8Array(n * 2));
    for (const b of buf) {
      if (b < limite && out.length < n) out.push(alfabeto[b % alfabeto.length]);
    }
  }
  return out.join('');
}
