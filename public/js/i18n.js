/* i18n.js - inglese (predefinito) e italiano per le pagine dell'app (play, screen). */
(function (g) {
'use strict';

var D = {
  en: {
    appName: 'Spin the Fortune',
    play_title: 'Host - Spin the Fortune',
    screen_title: 'Screen - Spin the Fortune',
    connecting: 'Connecting…',
    connected: 'Screen is live',
    offline: 'Offline. Retrying…',
    limit: 'Too many updates. Wait a moment.',
    server_error: 'Server problem. Retrying…',
    new_room_made: 'New room created. The screen code changed.',
    screen_code: 'Screen code',
    open_screen: 'On the TV or a PC, open {url} and type the code.',
    copy_link: 'Copy screen link',
    link_copied: 'Link copied',
    settings: 'Settings',
    settings_title: 'Settings',
    phrases_label: 'Phrases: one per line, as Category | PHRASE',
    players_label: 'Players: one name per line',
    players_ph: 'Anna\nBen\nCleo',
    save: 'Save',
    cancel: 'Cancel',
    no_valid_phrase: 'No valid phrase. Add at least one line with letters.',
    new_room: 'New room and code',
    new_room_confirm: 'Create a new room? The screen will need the new code.',
    prev: 'Prev.',
    rand: 'Random',
    next: 'Next',
    reveal: 'Reveal all',
    reset: 'Reset phrase',
    turn: 'Next turn',
    no_letter: 'No {l}',
    letter_count: '{n} × {l}',
    help: 'How it works',
    default_phrases: [
      'Proverb | A penny saved is a penny earned',
      'Saying | Better late than never',
      'Food | Spaghetti with meatballs',
      'Place | The Eiffel Tower in Paris',
      'Movie | The Lion King'
    ].join('\n'),
    s_enter_title: 'Connect this screen',
    s_enter_hint: 'Type the code shown on the host device.',
    s_connect: 'Connect',
    s_unknown: 'Unknown code. Check it on the host device.',
    s_too_many: 'Too many wrong codes. Try again in a few minutes.',
    s_waiting: 'Waiting for the host…',
    s_change: 'Change code',
    s_error: 'Connection problem. Retrying…'
  },
  it: {
    appName: 'Gira la Fortuna',
    play_title: 'Conduttore - Gira la Fortuna',
    screen_title: 'Schermo - Gira la Fortuna',
    connecting: 'Connessione…',
    connected: 'Schermo collegato',
    offline: 'Offline. Riprovo…',
    limit: 'Troppi aggiornamenti. Aspetta un attimo.',
    server_error: 'Problema del server. Riprovo…',
    new_room_made: 'Nuova stanza creata. Il codice dello schermo è cambiato.',
    screen_code: 'Codice schermo',
    open_screen: 'Sulla TV o su un PC apri {url} e scrivi il codice.',
    copy_link: 'Copia link dello schermo',
    link_copied: 'Link copiato',
    settings: 'Impostazioni',
    settings_title: 'Impostazioni',
    phrases_label: 'Frasi: una per riga, nel formato Categoria | FRASE',
    players_label: 'Concorrenti: un nome per riga',
    players_ph: 'Anna\nBeppe\nCarla',
    save: 'Salva',
    cancel: 'Annulla',
    no_valid_phrase: 'Nessuna frase valida. Inserisci almeno una riga con delle lettere.',
    new_room: 'Nuova stanza e codice',
    new_room_confirm: 'Creare una nuova stanza? Lo schermo dovrà usare il nuovo codice.',
    prev: 'Prec.',
    rand: 'Casuale',
    next: 'Succ.',
    reveal: 'Rivela tutto',
    reset: 'Reset frase',
    turn: 'Prossimo turno',
    no_letter: 'Nessuna {l}',
    letter_count: '{n} × {l}',
    help: 'Come funziona',
    default_phrases: [
      'Proverbio | Chi dorme non piglia pesci',
      'Frase famosa | Penso quindi sono',
      'Cibo | Spaghetti alla carbonara',
      'Luogo | Il Colosseo di Roma',
      'Film | La vita è bella'
    ].join('\n'),
    s_enter_title: 'Collega questo schermo',
    s_enter_hint: 'Scrivi il codice mostrato sul dispositivo del conduttore.',
    s_connect: 'Collega',
    s_unknown: 'Codice sconosciuto. Controllalo sul dispositivo del conduttore.',
    s_too_many: 'Troppi codici sbagliati. Riprova tra qualche minuto.',
    s_waiting: 'In attesa del conduttore…',
    s_change: 'Cambia codice',
    s_error: 'Problema di connessione. Riprovo…'
  }
};

function store(k, v) {
  try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v); } catch (e) {}
  return '';
}

function detect() {
  var m = /[?&]lang=(en|it)\b/.exec(location.search);
  if (m) { store('stf-lang', m[1]); return m[1]; }
  if (/^\/it(\/|$)/.test(location.pathname)) return 'it';
  var saved = store('stf-lang');
  if (saved === 'en' || saved === 'it') return saved;
  return /^it\b/i.test(navigator.language || '') ? 'it' : 'en';
}

var lang = detect();

function t(key, vars) {
  var s = (D[lang] && D[lang][key]);
  if (s === undefined) s = D.en[key];
  if (s === undefined) return key;
  if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] === undefined ? '' : vars[k]; });
  return s;
}

function apply(root) {
  root = root || document;
  document.documentElement.lang = lang;
  var list = root.querySelectorAll('[data-i18n]');
  for (var i = 0; i < list.length; i++) list[i].textContent = t(list[i].getAttribute('data-i18n'));
  list = root.querySelectorAll('[data-i18n-ph]');
  for (i = 0; i < list.length; i++) list[i].setAttribute('placeholder', t(list[i].getAttribute('data-i18n-ph')));
  list = root.querySelectorAll('[data-i18n-aria]');
  for (i = 0; i < list.length; i++) list[i].setAttribute('aria-label', t(list[i].getAttribute('data-i18n-aria')));
}

// Cambia lingua e ricarica la stessa pagina.
function setLang(l) {
  store('stf-lang', l);
  var u = new URL(location.href);
  u.searchParams.set('lang', l);
  location.href = u.toString();
}

g.I18N = { lang: lang, t: t, apply: apply, setLang: setLang };
})(window);
