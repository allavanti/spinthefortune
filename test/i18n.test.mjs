// Controlla che inglese e italiano abbiano le stesse chiavi e che i testi italiani non siano rimasti in inglese.
import assert from 'node:assert/strict';
globalThis.window = globalThis;
globalThis.location = { search: '', pathname: '/', href: 'http://x/' };
globalThis.document = { documentElement: {}, querySelectorAll: () => [] };
Object.defineProperty(globalThis, 'navigator', { value: { language: 'en' }, configurable: true });
globalThis.localStorage = { getItem: () => '', setItem() {} };
await import('../public/js/i18n.js');
const { en, it } = globalThis.I18N.dict;
const missingIt = Object.keys(en).filter((k) => !(k in it));
const missingEn = Object.keys(it).filter((k) => !(k in en));
assert.deepEqual(missingIt, [], 'chiavi senza traduzione italiana: ' + missingIt);
assert.deepEqual(missingEn, [], 'chiavi italiane senza inglese: ' + missingEn);
// stesse variabili {x} in entrambe le lingue
for (const k of Object.keys(en)) {
  const vars = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();
  assert.equal(vars(en[k]), vars(it[k]), 'variabili diverse in ' + k);
}
// parole inglesi che non devono comparire nei testi italiani
const banned = /\b(the|and|your|with|spin|wheel|bankrupt|pass|solved|wrong|settings|players|phrases|screen|code|host|score|total)\b/i;
const allowed = new Set(['appName']);
const bad = Object.entries(it).filter(([k, v]) => !allowed.has(k) && banned.test(String(v).replace(/Spin the Fortune/g, ''))).map(([k, v]) => k + ': ' + v);
assert.deepEqual(bad, [], 'testi italiani con parole inglesi:\n' + bad.join('\n'));
// valori identici (probabile traduzione dimenticata), esclusi i nomi propri e i formati
const same = Object.keys(en).filter((k) => en[k] === it[k] && /[a-z]{4,}/i.test(String(en[k]).replace(/\{\w+\}/g, '')) && !['players_ph', 'appName'].includes(k));
assert.deepEqual(same, [], 'testi identici nelle due lingue: ' + same);
console.log('ok i18n:', Object.keys(en).length, 'chiavi');
