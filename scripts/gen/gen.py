import html, json
TPL = r'''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#120f3a">
<link rel="canonical" href="{canon}">
<link rel="alternate" hreflang="en" href="https://spinthefortune.com/">
<link rel="alternate" hreflang="it" href="https://spinthefortune.com/it/">
<link rel="alternate" hreflang="x-default" href="https://spinthefortune.com/">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{sitename}">
<meta property="og:locale" content="{ogloc}">
<meta property="og:url" content="{canon}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:image" content="https://spinthefortune.com/{ogimg}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{ogalt}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{title}">
<meta name="twitter:description" content="{desc}">
<meta name="twitter:image" content="https://spinthefortune.com/{ogimg}">
<script type="application/ld+json">{jsonld}</script>
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="/css/board.css">
<link rel="stylesheet" href="/css/site.css">
</head>
<body class="site">
<div class="hero">
 <div class="wrap">
  <div class="bar">
   <a class="logo" href="{home}">{logo}</a>
   <nav class="langs" aria-label="{langlabel}">
    <a href="/" hreflang="en" lang="en"{cur_en}>EN</a>
    <a href="/it/" hreflang="it" lang="it"{cur_it}>IT</a>
   </nav>
  </div>
  <h1>{h1}</h1>
  <p class="lead">{lead}</p>
  <div class="cta">
   <a class="btn-main" href="/play?lang={lang}">{cta}</a>
   <a class="more" href="#{howid}">{more}</a>
  </div>
  <div class="hero-board" id="heroWrap"><div class="board" id="heroBoard" role="img" aria-label="{boardlabel}"></div></div>
 </div>
</div>

<main class="wrap">
 <section id="{howid}">
  <h2>{how_h}</h2>
  <ol class="steps">
{steps}
  </ol>
 </section>

 <section id="{rulesid}">
  <h2>{rules_h}</h2>
  <ul class="tips">
{rules}
  </ul>
 </section>

 <section>
  <div class="two">
   <div>
    <h2>{tips_h}</h2>
    <ul class="tips">
{tips}
    </ul>
   </div>
   <div>
    <h2>{facts_h}</h2>
    <ul class="facts">
{facts}
    </ul>
   </div>
  </div>
 </section>

 <section>
  <h2>{faq_h}</h2>
{faq}
 </section>

 <section class="final">
  <h2>{final_h}</h2>
  <div class="cta"><a class="btn-main" href="/play?lang={lang}">{cta}</a></div>
 </section>

 <section class="support" id="support">
  <div class="support-card">
   <h2>{sbh}</h2>
   <p>{sbp}</p>
   <a class="btn-kofi" href="https://ko-fi.com/spinthefortune" target="_blank" rel="noopener noreferrer">{sbb}</a>
  </div>
 </section>
</main>

<footer>
 <div class="wrap">
  <span>{foot} <a href="/feedback?lang={lang}">{fbk}</a> &middot; <a href="{pv}">Privacy</a> &middot; <a href="{tm}">{tmt}</a> &middot;{guides} <a href="https://ko-fi.com/spinthefortune" target="_blank" rel="noopener noreferrer">{sup}</a></span>
  <span><a href="/" hreflang="en" lang="en">English</a> &middot; <a href="/it/" hreflang="it" lang="it">Italiano</a></span>
 </div>
</footer>

<script src="/js/board.js"></script>
<script>
(function(){
'use strict';
var R=window.RuotaBoard;
var PHRASE={phrase_js};
var board=document.getElementById('heroBoard');
var wrap=document.getElementById('heroWrap');
var host=document.querySelectorAll('[data-host]');
for(var h=0;h<host.length;h++)host[h].textContent=location.host+'/screen';

var idx=[];
for(var i=0;i<PHRASE.length;i++){if(R.isLetter(PHRASE.charAt(i)))idx.push(i);}
var rev={};
var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function draw(fresh){
  var W=Math.max(180,wrap.clientWidth-16);
  var H=Math.min(Math.round(W*0.42),300);
  R.renderBoard({board:board,phrase:PHRASE,revealed:rev,fresh:fresh,width:W,height:H,cap:84,minCols:6});
}
if(reduce){idx.forEach(function(i){rev[i]=true;});}
draw(null);

// un solo momento animato: le lettere si scoprono una alla volta, in ordine sparso
if(!reduce){
  var order=idx.slice();
  for(var a=order.length-1;a>0;a--){var b=Math.floor(Math.random()*(a+1));var tmp=order[a];order[a]=order[b];order[b]=tmp;}
  var n=0;
  var timer=setInterval(function(){
    if(n>=order.length){clearInterval(timer);return;}
    var f={};f[order[n]]=true;rev[order[n]]=true;n++;
    draw(f);
  },260);
}
window.addEventListener('resize',function(){draw(null);});
})();
</script>
</body>
</html>
'''

def li(items, tag='li'):
    return '\n'.join('     <li>%s</li>' % x for x in items)

def steps(items):
    out=[]
    for n,(h,p) in enumerate(items,1):
        out.append('   <li><div class="num" aria-hidden="true">%d</div><h3>%s</h3><p>%s</p></li>' % (n,h,p))
    return '\n'.join(out)

def faq(items):
    return '\n'.join('  <details><summary>%s</summary><p>%s</p></details>' % (q,a) for q,a in items)

EN = dict(
 rulesid='rules', rules_h='Game rules',
 rules=li([
  '<b>Goal.</b> Reveal the hidden phrase by calling letters. Whoever solves it keeps the points of the round.',
  '<b>Your turn.</b> Spin the wheel. If it lands on a value, call a consonant: every time it appears in the phrase you earn that value (a 300 and three letters found is 900).',
  '<b>Found one?</b> You keep the turn. Spin again, buy a vowel, or try to solve.',
  '<b>Vowels cost points.</b> 250 by default, and you need that many points in the round. You pay even if the vowel is not in the phrase. The vowels are A, E, I, O and U.',
  '<b>A miss passes the turn.</b> A consonant or a vowel that is not in the phrase sends the turn to the next player.',
  '<b>Bankrupt</b> wipes the points of your round and passes the turn. <b>Lose a turn</b> passes the turn and keeps your points.',
  '<b>Solving.</b> Say the phrase out loud. If it is right, tap Solved: the points of your round go into your total and the whole phrase is revealed. If it is wrong, tap Wrong and the turn passes.',
  '<b>Rounds and totals.</b> Round points restart with every new phrase; totals stay until you reset them in Settings.',
  '<b>Make your own rules.</b> In Settings change the wheel values, how many Bankrupt and Lose a turn it has, and the price of a vowel. With no player names you play without scores.',
 ]),
 lang='en', home='/', cur_en=' aria-current="page"', cur_it='', langlabel='Language',
 canon='https://spinthefortune.com/', ogimg='og.png', ogloc='en_US', sitename='Spin the Fortune', ogalt='Spin the Fortune logo: a colorful wheel with a letter tile', jsonld=json.dumps({'@context':'https://schema.org','@type':'WebApplication','name':'Spin the Fortune','url':'https://spinthefortune.com/','applicationCategory':'GameApplication','operatingSystem':'Any (web browser)','inLanguage':'en','isAccessibleForFree':True,'description':'Free word-puzzle game for family nights, parties and classrooms. Show the board on your TV and call letters from your phone.','offers':{'@type':'Offer','price':'0','priceCurrency':'EUR'}},ensure_ascii=False),
 title='Spin the Fortune: free word-puzzle board for your TV',
 desc='Free word-puzzle game for family nights, parties and classrooms. Show the board on your TV and call letters from your phone. No sign-up, no app.',
 logo='Spin the <span>Fortune</span>',
 h1='Word-puzzle night on your TV, run from your phone',
 lead='Spin the Fortune is a free guessing game for family nights, parties and classrooms. Show the board on a big screen, type your own phrases, and call letters from your phone. No account, no app to install.',
 cta='Start a game', more='See how it works', howid='how',
 boardlabel='A puzzle board spelling Spin the Fortune, letter by letter',
 how_h='How it works',
 steps=steps([
  ('Start a game on your phone','Tap Start a game. You get a screen code with 6 characters and a ready-made set of phrases to try.'),
  ('Open the screen on a TV or PC','Go to <code class="inl" data-host>this site/screen</code> and type the code. On a PC, cast the Chrome tab to your TV from the browser menu.'),
  ('Spin and call letters','Tap Spin: the wheel turns on the big screen. Then call a consonant: each one found scores the wheel value. Buy a vowel, solve, and the scores are kept for you.'),
 ]),
 tips_h='Tips for a good game',
 tips=li([
  '<b>Write 15 to 30 phrases first.</b> One per line, as <code class="inl">Category | PHRASE</code>. The category is shown on screen and helps players.',
  '<b>Keep phrases under about 40 letters.</b> The board stays readable from the sofa.',
  '<b>Accents are fine.</b> Players call E and it also finds È.',
  '<b>Add player names.</b> They switch on scores and the wheel. The current player is highlighted on screen. Up to 12 names.',
  '<b>Want sound?</b> Click once on the screen page, because browsers only allow audio after a click. Press M to mute.',
  '<b>Casting from a PC?</b> In Chrome open the menu, choose Cast, then Cast tab, and keep that tab open.',
  '<b>Playing with friends far away?</b> Send them the screen link from the host page. They see the same board on their own device.',
 ]),
 facts_h='Good to know',
 facts=li([
  'Free, with no sign-up. Works in current browsers on phones, tablets and computers.',
  'Scores follow the classic rules: spin, call a consonant for the wheel value, buy a vowel, bankrupt, lose a turn, solve. Wheel values and vowel cost are yours to change in Settings.',
  'Your phrases and players stay in your browser. The screen only receives the letters already revealed, so nobody can read the answer from the page.',
  'Rooms are anonymous and are deleted after 24 hours without activity.',
  'We count anonymous totals, such as rooms created and letters called, by language and country. We do not collect names or emails.',
 ]),
 faq_h='Questions',
 faq=faq([
  ('Is it really free?','Yes. There is nothing to pay and no account to create.'),
  ('Do I need a physical wheel?','No. The wheel is digital and spins on the screen, with sound. Without player names the game runs without scores.'),
  ('Which TVs work?','Any TV that can show a web page or receive a cast from Chrome: smart TVs with a browser, Chromecast, Google TV, or a laptop on an HDMI cable.'),
  ('Can players see the answer on the screen?','No. The screen is sent the phrase with the hidden letters replaced, so the answer stays on the host device.'),
  ('What happens if my phone locks or goes offline?','The board keeps its last state. When the phone is back online it sends the current state again.'),
  ('Can I use it in a classroom?','Yes. Use categories as topics, add the class as players, and project the board. Nothing personal is stored on our side.'),
 ]),
 final_h='Ready for the first puzzle?',
 foot='Spin the Fortune. A free word-puzzle game.',
 fbk='Questions and suggestions', pv='/privacy', tm='/terms', tmt='Terms of use', sup='Support us', guides=' <a href="/family-game-night">Family game night</a> &middot; <a href="/classroom-word-game">Classroom</a> &middot; <a href="/word-game-for-tv">Game for TV</a> &middot;', sbh='Enjoying the game?', sbp='Spin the Fortune is free, with no ads and no tracking. If you like it, a small donation helps keep it online and free for everyone.', sbb='Support us on Ko-fi',
 phrase='SPIN THE FORTUNE',
)

IT = dict(
 rulesid='regole', rules_h='Regole del gioco',
 rules=li([
  '<b>Obiettivo.</b> Scoprire la frase nascosta chiamando le lettere. Chi la risolve tiene i punti della manche.',
  '<b>Il tuo turno.</b> Gira la ruota. Se si ferma su un valore, chiama una consonante: ogni volta che compare nella frase guadagni quel valore (un 300 con tre lettere trovate fa 900).',
  '<b>Trovata?</b> Il turno resta tuo. Gira ancora, compra una vocale o prova a risolvere.',
  '<b>Le vocali costano punti.</b> 250 di base, e servono altrettanti punti nella manche. Paghi anche se la vocale non c\u2019\u00e8 nella frase. Le vocali sono A, E, I, O e U.',
  '<b>Un errore passa il turno.</b> Una consonante o una vocale che non c\u2019\u00e8 nella frase manda il turno al concorrente successivo.',
  '<b>Bancarotta</b> azzera i punti della tua manche e passa il turno. <b>Passa</b> cede il turno e ti lascia i punti.',
  '<b>Risolvere.</b> Di\u2019 la frase ad alta voce. Se \u00e8 giusta, tocca Risolta: i punti della manche vanno nel tuo totale e la frase si scopre tutta. Se \u00e8 sbagliata, tocca Sbagliata e il turno passa.',
  '<b>Manche e totali.</b> I punti della manche ripartono a ogni frase nuova; i totali restano finch\u00e9 non li azzeri nelle Impostazioni.',
  '<b>Regole tue.</b> Nelle Impostazioni cambi i valori della ruota, quante Bancarotte e Passa ha e il prezzo della vocale. Senza nomi dei concorrenti si gioca senza punteggi.',
 ]),
 lang='it', home='/it/', cur_en='', cur_it=' aria-current="page"', langlabel='Lingua',
 canon='https://spinthefortune.com/it/', ogimg='og-it.png', ogloc='it_IT', sitename='Gira la Fortuna', ogalt='Logo di Gira la Fortuna: una ruota colorata con una tessera con la lettera S', jsonld=json.dumps({'@context':'https://schema.org','@type':'WebApplication','name':'Gira la Fortuna','url':'https://spinthefortune.com/it/','applicationCategory':'GameApplication','operatingSystem':'Qualsiasi (browser web)','inLanguage':'it','isAccessibleForFree':True,'description':'Gioco di parole gratuito per serate in famiglia, feste e classi. Il tabellone sulla TV, la ruota e le lettere dal telefono.','offers':{'@type':'Offer','price':'0','priceCurrency':'EUR'}},ensure_ascii=False),
 title='Gira la Fortuna: gioco di parole gratuito col tabellone sulla TV',
 desc='Gioco di parole gratuito per serate in famiglia, feste e classi. Il tabellone sulla TV, la ruota e le lettere dal telefono. Senza registrazione né app.',
 logo='Gira la <span>Fortuna</span>',
 h1='Serata di indovinelli sulla TV, guidata dal telefono',
 lead='Gira la Fortuna è un gioco di parole gratuito con tabellone, ruota e punteggi, per serate in famiglia, feste e classi. Mostri il tabellone su uno schermo grande, scrivi le tue frasi e chiami le lettere dal telefono. Niente account, niente app da installare.',
 cta='Inizia una partita', more='Come funziona', howid='come-funziona',
 boardlabel='Un tabellone che scrive Gira la Fortuna, lettera per lettera',
 how_h='Come funziona',
 steps=steps([
  ('Avvia la partita dal telefono','Tocca Inizia una partita. Ricevi un codice schermo di 6 caratteri e un gruppo di frasi pronte per provare.'),
  ('Apri lo schermo su TV o PC','Vai su <code class="inl" data-host>questo sito/screen</code> e scrivi il codice. Dal PC, trasmetti la scheda di Chrome alla TV dal menu del browser.'),
  ('Gira e chiama le lettere','Tocca Gira: la ruota gira sul grande schermo. Poi chiama una consonante: ogni lettera trovata vale quanto lo spicchio. Compra una vocale, risolvi, e i punteggi li tiene il gioco.'),
 ]),
 tips_h='Consigli per giocare bene',
 tips=li([
  '<b>Scrivi prima da 15 a 30 frasi.</b> Una per riga, nel formato <code class="inl">Categoria | FRASE</code>. La categoria compare sullo schermo e aiuta chi gioca.',
  '<b>Frasi sotto le 40 lettere circa.</b> Il tabellone resta leggibile dal divano.',
  '<b>Gli accenti vanno bene.</b> Chi chiama la E trova anche la È.',
  '<b>Aggiungi i nomi dei concorrenti.</b> Attivano punteggi e ruota. Quello di turno è evidenziato sullo schermo. Fino a 12 nomi.',
  '<b>Vuoi l’audio?</b> Fai un click sulla pagina dello schermo: i browser permettono i suoni solo dopo un click. Premi M per silenziare.',
  '<b>Trasmetti da PC?</b> In Chrome apri il menu, scegli Trasmetti, poi Trasmetti scheda, e tieni aperta quella scheda.',
  '<b>Amici lontani?</b> Manda loro il link dello schermo dalla pagina del conduttore: vedono lo stesso tabellone sul proprio dispositivo.',
 ]),
 facts_h='Da sapere',
 facts=li([
  'Gratuito e senza registrazione. Funziona con i browser aggiornati su telefoni, tablet e computer.',
  'I punteggi seguono le regole classiche: gira, chiama una consonante per il valore dello spicchio, compra una vocale, bancarotta, passa, risolvi. Valori della ruota e costo della vocale si cambiano nelle Impostazioni.',
  'Frasi e concorrenti restano nel tuo browser. Lo schermo riceve solo le lettere già scoperte, quindi nessuno può leggere la soluzione dalla pagina.',
  'Le stanze sono anonime e vengono eliminate dopo 24 ore senza attività.',
  'Contiamo totali anonimi, come stanze create e lettere chiamate, per lingua e paese. Non raccogliamo nomi né email.',
 ]),
 faq_h='Domande',
 faq=faq([
  ('È davvero gratis?','Sì. Non c’è nulla da pagare e nessun account da creare.'),
  ('Mi serve una ruota fisica?','No. La ruota è digitale e gira sullo schermo, con i suoni. Senza nomi dei concorrenti il gioco funziona senza punteggi.'),
  ('Quali TV funzionano?','Qualsiasi TV che mostra una pagina web o riceve una trasmissione da Chrome: smart TV con browser, Chromecast, Google TV, oppure un portatile collegato con cavo HDMI.'),
  ('I giocatori possono vedere la soluzione sullo schermo?','No. Lo schermo riceve la frase con le lettere nascoste sostituite, quindi la soluzione resta sul dispositivo del conduttore.'),
  ('Cosa succede se il telefono si blocca o va offline?','Il tabellone mantiene l’ultimo stato. Quando il telefono torna online reinvia quello attuale.'),
  ('Posso usarlo in classe?','Sì. Usa le categorie come argomenti, inserisci la classe come concorrenti e proietta il tabellone. Da parte nostra non viene salvato nulla di personale.'),
 ]),
 final_h='Pronti per il primo indovinello?',
 foot='Gira la Fortuna. Un gioco di parole gratuito.',
 fbk='Domande e suggerimenti', pv='/it/privacy', tm='/it/terms', tmt="Termini d'uso", sup='Sostienici', guides='', sbh='Ti piace il gioco?', sbp='Gira la Fortuna è gratuita, senza pubblicità e senza tracciamento. Se ti piace, una piccola donazione aiuta a tenerla online e gratuita per tutti.', sbb='Sostienici su Ko-fi',
 phrase='GIRA LA FORTUNA',
)

def build(d, path):
    d = dict(d)
    d['phrase_js'] = json.dumps(d.pop('phrase'))
    out = TPL
    for k, v in d.items():
        out = out.replace('{%s}' % k, v)
    open(path, 'w', encoding='utf-8').write(out)

import os
PUB=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','public')
build(EN, os.path.join(PUB,'index.html'))
build(IT, os.path.join(PUB,'it','index.html'))
print('generate')
