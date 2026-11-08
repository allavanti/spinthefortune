import { readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
const r = f => readFileSync(new URL('../public/' + f, import.meta.url), 'utf8');
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const B = 'https://spinthefortune.com';
for (const [f, url, lang] of [['index.html', '/', 'en'], ['it/index.html', '/it/', 'it'], ['privacy.html', '/privacy', 'en'], ['it/privacy.html', '/it/privacy', 'it'], ['terms.html', '/terms', 'en'], ['it/terms.html', '/it/terms', 'it']]) {
  const h = r(f);
  ok(h.includes(`<link rel="canonical" href="${B}${url}">`), f + ' canonical');
  ok(/hreflang="en"/.test(h) && /hreflang="it"/.test(h) && /hreflang="x-default"/.test(h), f + ' hreflang');
  ok(h.includes('og:image') && h.includes('favicon.svg'), f + ' og/favicon');
  ok(!/noindex/.test(h), f + ' indexable');
  ok(!/ruota della fortuna|wheel of fortune/i.test(h), f + ' no trademark phrase');
  ok(h.includes(`<html lang="${lang}"`), f + ' lang');
}
for (const f of ['index.html', 'it/index.html']) {
  const m = r(f).match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  ok(m && JSON.parse(m[1])['@type'] === 'WebApplication', f + ' json-ld');
}
for (const f of ['play.html', 'screen.html', 'admin.html', 'feedback.html']) ok(/name="robots" content="noindex"/.test(r(f)), f + ' noindex');
const hd = r('_headers'); ok(!/\/\*[\s\S]*?X-Robots-Tag/.test(hd.split('/api/*')[0]), 'no global noindex'); ok(/\/api\/\*[\s\S]*noindex/.test(hd), 'api noindex');
const rb = r('robots.txt'); ok(/Allow: \//.test(rb) && /Disallow: \/api\//.test(rb) && rb.includes(B + '/sitemap.xml'), 'robots');
const sm = r('sitemap.xml'); for (const u of ['/', '/it/', '/privacy', '/it/privacy', '/terms', '/it/terms']) ok(sm.includes(`<loc>${B}${u}</loc>`), 'sitemap ' + u);
for (const f of ['og.png', 'og-it.png', 'apple-touch-icon.png', 'favicon.svg']) ok(existsSync(new URL('../public/' + f, import.meta.url)), f);
console.log('seo ok', n);
// pagine guida EN
{
  let m = 0; const ok2 = (c, s) => { assert.ok(c, s); m++; };
  for (const s of ['family-game-night', 'classroom-word-game', 'word-game-for-tv']) {
    const h = r(s + '.html');
    ok2(h.includes(`<link rel="canonical" href="${B}/${s}">`), s + ' canonical');
    ok2(/<title>[^<]{20,}<\/title>/.test(h) && /name="description"/.test(h), s + ' title/desc');
    ok2(!/noindex/.test(h) && !/ruota della fortuna|wheel of fortune/i.test(h), s + ' indexable, no trademark');
    ok2(r('sitemap.xml').includes(`<loc>${B}/${s}</loc>`), s + ' in sitemap');
    ok2(r('index.html').includes(`href="/${s}"`), s + ' linked from home');
  }
  ok2(existsSync(new URL('../public/qr.svg', import.meta.url)), 'qr.svg');
  console.log('seo guide pages ok', m);
}
