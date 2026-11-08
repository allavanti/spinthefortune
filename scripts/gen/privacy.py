import os
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','public')
T='''<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#120f3a">
<title>{title}</title>
<link rel="stylesheet" href="/css/site.css">
<style>.pv{{max-width:720px;padding-bottom:50px}}.pv h1{{margin:10px 0 8px;font:800 clamp(1.9rem,5vw,2.8rem)/1.1 var(--display)}}.pv h2{{margin:34px 0 10px;font-size:1.35rem}}.pv p,.pv li{{max-width:none}}.pv ul{{padding-left:1.2em}}.pv .upd{{color:var(--mute)}}</style>
</head>
<body class="site">
<div class="wrap pv">
  <div class="bar">
    <a class="logo" href="{home}">{logo}</a>
    <nav class="langs" aria-label="Language">
      <a href="{pen}" hreflang="en" lang="en"{ae}>EN</a>
      <a href="{pit}" hreflang="it" lang="it"{ai}>IT</a>
    </nav>
  </div>
  <main>
  <h1>{h1}</h1>
  <p class="upd">{upd}</p>
{body}
  </main>
  <p style="margin-top:30px"><a href="{home}">{back}</a> &middot; <a href="/feedback?lang={lang}">{fb}</a> &middot; <a href="{xl}">{xt}</a></p>
</div>
</body>
</html>
'''
EN=dict(pen='/privacy',pit='/it/privacy',xl='/terms',xt='Terms of use',lang='en',title='Privacy - Spin the Fortune',home='/',logo='Spin the <span>Fortune</span>',ae=' aria-current="page"',ai='',
h1='Privacy',upd='Last updated: 7 November 2026',back='Back to the game',fb='Questions and suggestions',
body='''  <p>Spin the Fortune is a free game. It needs no account, no password and no email address, and it uses no advertising or tracking.</p>
  <h2>What we store</h2>
  <ul>
   <li><b>Rooms.</b> When you start a game we store the room code, the puzzle phrase, the category, the player names and scores you typed, and a one-way hash of your room key (never the key itself). A room is deleted automatically after 24 hours without use.</li>
   <li><b>Anonymous statistics.</b> Counters such as "rooms created" or "puzzles solved", grouped by day, language and country. They contain no personal data and cannot be traced back to you.</li>
   <li><b>Abuse protection.</b> To limit spam we keep a short-lived hash of your IP address, never the address itself. It is deleted automatically after a short time.</li>
   <li><b>Shared phrases (optional).</b> Only if you tick "Share my new phrases with the community" (off by default), the phrases you wrote are sent anonymously, together with their category and the page language, with no link to you, your room or your device. After review by us they may appear in the ready-made phrases offered to other players, and you can ask us to remove one using the questions page. Do not include personal names, song lyrics or long quotes.</li>
   <li><b>Questions and suggestions.</b> If you write to us we store your message, its type, the language and country, and your email address only if you choose to give it. Your email is never shown publicly and we do not send emails at the moment. Messages and answers are kept until we delete them; you can ask us to delete yours using your ticket code.</li>
  </ul>
  <h2>On your device</h2>
  <p>We use no cookies. The page saves a few settings in your browser (local storage): language, sound on/off, the key of your current room, the codes of your messages and the settings you chose. You can erase them from your browser settings at any time.</p>
  <h2>Donations</h2>
  <p>The game is free and donations are voluntary. If you choose to donate, you are taken to Ko-fi (ko-fi.com), an external service with its own privacy policy: payment details are handled by Ko-fi and its payment providers, never by this site, and we do not receive them on this site. Donating gives no extra features.</p>
  <h2>Who processes the data</h2>
  <p>The site runs on Cloudflare (hosting, database and delivery), which processes technical data such as IP addresses to deliver the pages and protect them from attacks. We do not sell data and do not share it with anyone else.</p>
  <h2>Your rights</h2>
  <p>You can ask to see, correct or delete the data linked to a message you sent, by writing to us from the questions page with your ticket code. Room data disappears on its own after 24 hours. If you are in the EU you may also complain to your national data protection authority.</p>
  <h2>Children</h2>
  <p>The game is meant for families. Do not type full names or other personal details of children as player names: first names or nicknames are enough.</p>
  <h2>Contact</h2>
  <p>The data controller is the individual who runs this site. Write to <a href="mailto:info@spinthefortune.com">info@spinthefortune.com</a> or use the <a href="/feedback?lang=en">Questions and suggestions</a> page.</p>
  <p class="upd">Spin the Fortune is an independent fan project and is not affiliated with, or endorsed by, any television programme or its owners.</p>''')
IT=dict(pen='/privacy',pit='/it/privacy',xl='/it/terms',xt="Termini d'uso",lang='it',title='Privacy - Gira la Fortuna',home='/it/',logo='Gira la <span>Fortuna</span>',ae='',ai=' aria-current="page"',
h1='Privacy',upd='Ultimo aggiornamento: 7 novembre 2026',back='Torna al gioco',fb='Domande e suggerimenti',
body='''  <p>Gira la Fortuna è un gioco gratuito. Non servono account, password o indirizzo email e non usa pubblicità né tracciamento.</p>
  <h2>Cosa conserviamo</h2>
  <ul>
   <li><b>Stanze.</b> Quando avvii una partita conserviamo il codice della stanza, la frase da indovinare, la categoria, i nomi dei giocatori e i punteggi che hai scritto, e un&rsquo;impronta irreversibile della chiave della stanza (mai la chiave stessa). La stanza si cancella da sola dopo 24 ore senza uso.</li>
   <li><b>Statistiche anonime.</b> Contatori come &ldquo;stanze create&rdquo; o &ldquo;frasi risolte&rdquo;, divisi per giorno, lingua e paese. Non contengono dati personali e non si possono ricondurre a te.</li>
   <li><b>Protezione dagli abusi.</b> Per limitare lo spam teniamo per poco tempo un&rsquo;impronta del tuo indirizzo IP, mai l&rsquo;indirizzo stesso. Si cancella da sola dopo poco.</li>
   <li><b>Frasi condivise (facoltativo).</b> Solo se spunti &ldquo;Condividi le mie frasi nuove con la community&rdquo; (spenta di default), le frasi che hai scritto vengono inviate in forma anonima, con la categoria e la lingua della pagina, senza alcun legame con te, la tua stanza o il tuo dispositivo. Dopo la nostra revisione possono comparire tra le frasi pronte offerte agli altri giocatori, e puoi chiederci di rimuoverne una dalla pagina delle domande. Non scrivere nomi di persone, versi di canzoni o citazioni lunghe.</li>
   <li><b>Domande e suggerimenti.</b> Se ci scrivi conserviamo il messaggio, il tipo, la lingua e il paese, e l&rsquo;indirizzo email solo se decidi di indicarlo. L&rsquo;email non è mai mostrata pubblicamente e per ora non inviamo email. Messaggi e risposte restano finché non li cancelliamo; puoi chiedere di cancellare il tuo usando il codice del messaggio.</li>
  </ul>
  <h2>Sul tuo dispositivo</h2>
  <p>Non usiamo cookie. La pagina salva alcune impostazioni nel browser (archivio locale): lingua, suoni attivi o no, la chiave della stanza in corso, i codici dei tuoi messaggi e le impostazioni di gioco scelte. Puoi cancellarle in qualsiasi momento dalle impostazioni del browser.</p>
  <h2>Donazioni</h2>
  <p>Il gioco è gratuito e le donazioni sono volontarie. Se scegli di donare vieni portato su Ko-fi (ko-fi.com), un servizio esterno con una propria informativa sulla privacy: i dati di pagamento sono gestiti da Ko-fi e dai suoi fornitori di pagamento, non da questo sito, che non li riceve. Donare non dà funzioni in più.</p>
  <h2>Chi tratta i dati</h2>
  <p>Il sito funziona su Cloudflare (hosting, database e consegna delle pagine), che tratta dati tecnici come gli indirizzi IP per fornire le pagine e proteggerle dagli attacchi. Non vendiamo i dati e non li condividiamo con altri.</p>
  <h2>I tuoi diritti</h2>
  <p>Puoi chiedere di vedere, correggere o cancellare i dati legati a un messaggio che hai inviato, scrivendoci dalla pagina delle domande con il codice del messaggio. I dati delle stanze spariscono da soli dopo 24 ore. Puoi anche presentare reclamo al Garante per la protezione dei dati personali.</p>
  <h2>Minori</h2>
  <p>Il gioco è pensato per le famiglie. Non scrivere nome e cognome o altri dati personali dei bambini come nomi dei giocatori: bastano il nome di battesimo o un soprannome.</p>
  <h2>Contatti</h2>
  <p>Il titolare del trattamento è la persona che gestisce questo sito. Scrivi a <a href="mailto:info@spinthefortune.com">info@spinthefortune.com</a> oppure usa la pagina <a href="/feedback?lang=it">Domande e suggerimenti</a>.</p>
  <p class="upd">Gira la Fortuna è un progetto indipendente di appassionati e non è affiliato né approvato da alcun programma televisivo o dai suoi titolari.</p>''')
BASE='https://spinthefortune.com'
def seo_head(page, lang):
  en=BASE+'/'+page; it=BASE+'/it/'+page
  me,loc,img=(en,'en_US','og.png') if lang=='en' else (it,'it_IT','og-it.png')
  L=['<link rel="canonical" href="%s">'%me,
     '<link rel="alternate" hreflang="en" href="%s">'%en,
     '<link rel="alternate" hreflang="it" href="%s">'%it,
     '<link rel="alternate" hreflang="x-default" href="%s">'%en,
     '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
     '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
     '<meta property="og:type" content="website">',
     '<meta property="og:url" content="%s">'%me,
     '<meta property="og:locale" content="%s">'%loc,
     '<meta property="og:image" content="%s/%s">'%(BASE,img)]
  return '\n'.join(L)+'\n'
def render(T_,d,page):
  s=T_.format(**d)
  k='<link rel="stylesheet" href="/css/site.css">'
  return s.replace(k,k+'\n'+seo_head(page,d['lang']),1)
def write_privacy():
  for d,p,pg in ((EN,'privacy.html','privacy'),(IT,'it/privacy.html','privacy')):
    open(os.path.join(ROOT,p),'w',encoding='utf-8').write(render(T,d,pg))
if __name__=='__main__':
    write_privacy()
