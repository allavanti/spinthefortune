import sys, os
sys.path.insert(0, os.path.dirname(__file__))
import privacy as P
EN=dict(P.EN, pen='/terms', pit='/it/terms', xl='/privacy', xt='Privacy', title='Terms of use - Spin the Fortune', h1='Terms of use', upd='Last updated: 8 November 2026',
body='''  <p>By using Spin the Fortune you accept these terms. If you do not agree, please do not use the site.</p>
  <h2>The service</h2>
  <p>Spin the Fortune is a free word-puzzle game for family and friends: a board shown on a TV or screen and controlled from a phone. It is offered &ldquo;as is&rdquo;. We do not guarantee that it will always be available or free of errors, and we may change or stop it at any time.</p>
  <h2>Acceptable use</h2>
  <ul>
   <li>Use the game for personal, family or other non-commercial purposes.</li>
   <li>You are responsible for the phrases, names and messages you type. Do not write anything unlawful, hateful, offensive, or that violates the rights of others, and do not include personal data of other people.</li>
   <li>Do not attack, overload or try to get around the limits of the service, and do not use bots or automated tools against it.</li>
   <li>We may remove content, rooms or messages, and block abuse, without notice.</li>
  </ul>
  <h2>Phrases you share</h2>
  <p>Sharing is optional and off by default. If you choose to share phrases, you confirm that they are your own or that you are free to share them, and you give us a free, non-exclusive, worldwide licence to review, edit, publish and offer them to other players in the ready-made phrases. We may reject or remove any phrase at our discretion. See the <a href="/privacy">privacy page</a> for how this data is handled.</p>
  <h2>Donations</h2>
  <p>Donations are voluntary, made through the external service Ko-fi under its own terms, and give no right to features, support or any other return.</p>
  <h2>Intellectual property</h2>
  <p>The code, design and texts of the site belong to their authors. Spin the Fortune is an independent project and is not affiliated with, or endorsed by, any television programme or its owners. Names, titles and trademarks that appear in the ready-made phrases belong to their respective owners and are used only as puzzle answers.</p>
  <h2>Liability</h2>
  <p>To the maximum extent permitted by law, we are not liable for losses arising from the use of, or the impossibility of using, the service. Nothing in these terms limits rights that cannot be excluded by law, including those of consumers.</p>
  <h2>Changes and governing law</h2>
  <p>We may update these terms; the date above shows the latest version, and continuing to use the site means you accept the changes. These terms are governed by Italian law, without prejudice to the mandatory rights you have as a consumer in your country.</p>
  <h2>Contact</h2>
  <p>Write to <a href="mailto:info@spinthefortune.com">info@spinthefortune.com</a> or use the <a href="/feedback?lang=en">Questions and suggestions</a> page.</p>''')
IT=dict(P.IT, pen='/terms', pit='/it/terms', xl='/it/privacy', xt='Privacy', title="Termini d'uso - Gira la Fortuna", h1="Termini d'uso", upd='Ultimo aggiornamento: 8 novembre 2026',
body='''  <p>Usando Gira la Fortuna accetti questi termini. Se non sei d&rsquo;accordo, non usare il sito.</p>
  <h2>Il servizio</h2>
  <p>Gira la Fortuna è un gioco di parole gratuito per famiglia e amici: un tabellone che si vede su una TV o uno schermo e si controlla dal telefono. Viene offerto &ldquo;così com&rsquo;è&rdquo;. Non garantiamo che sia sempre disponibile o privo di errori e possiamo modificarlo o sospenderlo in qualsiasi momento.</p>
  <h2>Uso consentito</h2>
  <ul>
   <li>Usa il gioco per scopi personali, familiari o comunque non commerciali.</li>
   <li>Sei responsabile delle frasi, dei nomi e dei messaggi che scrivi. Non scrivere nulla di illecito, offensivo o che violi i diritti altrui e non inserire dati personali di altre persone.</li>
   <li>Non attaccare, sovraccaricare o aggirare i limiti del servizio e non usare bot o strumenti automatici contro di esso.</li>
   <li>Possiamo rimuovere contenuti, stanze o messaggi e bloccare gli abusi senza preavviso.</li>
  </ul>
  <h2>Frasi che condividi</h2>
  <p>La condivisione è facoltativa e spenta di default. Se scegli di condividere delle frasi, confermi che sono tue o che sei libero di condividerle e ci concedi una licenza gratuita, non esclusiva e valida in tutto il mondo per esaminarle, modificarle, pubblicarle e proporle agli altri giocatori tra le frasi pronte. Possiamo rifiutare o rimuovere qualsiasi frase a nostra discrezione. Nella <a href="/it/privacy">pagina privacy</a> trovi come vengono trattati questi dati.</p>
  <h2>Donazioni</h2>
  <p>Le donazioni sono volontarie, avvengono tramite il servizio esterno Ko-fi secondo le sue condizioni e non danno diritto a funzioni, assistenza o altre contropartite.</p>
  <h2>Proprietà intellettuale</h2>
  <p>Il codice, la grafica e i testi del sito appartengono ai rispettivi autori. Gira la Fortuna è un progetto indipendente e non è affiliato né approvato da alcun programma televisivo o dai suoi titolari. Nomi, titoli e marchi che compaiono nelle frasi pronte appartengono ai rispettivi titolari e sono usati solo come risposte dei giochi.</p>
  <h2>Responsabilità</h2>
  <p>Nei limiti massimi consentiti dalla legge, non rispondiamo di danni derivanti dall&rsquo;uso o dall&rsquo;impossibilità di usare il servizio. Nulla in questi termini limita i diritti che per legge non si possono escludere, compresi quelli dei consumatori.</p>
  <h2>Modifiche e legge applicabile</h2>
  <p>Possiamo aggiornare questi termini: la data in alto indica l&rsquo;ultima versione e continuare a usare il sito significa accettare le modifiche. I termini sono regolati dalla legge italiana, salvi i diritti inderogabili che hai come consumatore nel tuo paese.</p>
  <h2>Contatti</h2>
  <p>Scrivi a <a href="mailto:info@spinthefortune.com">info@spinthefortune.com</a> oppure usa la pagina <a href="/feedback?lang=it">Domande e suggerimenti</a>.</p>''')
for d,p in ((EN,'terms.html'),(IT,'it/terms.html')):
    open(os.path.join(P.ROOT,p),'w',encoding='utf-8').write(P.render(P.T,d,'terms'))
