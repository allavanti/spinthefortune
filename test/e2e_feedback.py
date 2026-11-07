import subprocess, re
from playwright.sync_api import sync_playwright
srv = subprocess.Popen(['node', '--no-warnings', 'test/dev-server.mjs', '8791'], stdout=subprocess.PIPE, text=True); srv.stdout.readline()
fails = []
def check(n, c):
    print(('ok  ' if c else 'FAIL'), n)
    if not c: fails.append(n)
B = 'http://localhost:8791'
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []
        # utente italiano
        ctx = b.new_context(viewport={'width': 390, 'height': 900}, locale='it-IT'); pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(B + '/feedback?lang=it')
        check('IT: titolo', 'Domande e suggerimenti' in pg.inner_text('h1'))
        txt = pg.inner_text('body')
        check('IT: niente inglese', not re.search(r'\b(Send|Question|Suggestion|Your message)\b', txt))
        pg.click('input[value=suggestion]')
        pg.fill('#text', 'Vorrei una modalita con piu giocatori')
        pg.click('#send')
        pg.wait_for_selector('#status code')
        code = pg.inner_text('#status code')
        check('codice di 10 caratteri', len(code) == 10)
        check('messaggio in elenco, aperto', 'piu giocatori' in pg.inner_text('#list'))
        # admin
        ap = ctx.new_page(); ap.on('pageerror', lambda e: errs.append(str(e)))
        ap.on('dialog', lambda d: d.accept())
        ap.goto(B + '/admin')
        check('admin: schede nascoste prima del login', ap.is_hidden('#panel'))
        ap.fill('#tok', 'sbagliato-sbagliato-sbagliato'); ap.click('#bLoad')
        ap.wait_for_function("document.getElementById('msg').textContent!==''")
        check('admin: token errato, pannello chiuso', ap.is_hidden('#panel') and 'non autorizzato' in ap.inner_text('#msg'))
        ap.fill('#tok', 'test-admin-token-1234'); ap.click('#bLoad')
        ap.wait_for_selector('.mi')
        check('admin: dopo il login si aprono i messaggi', ap.is_visible('#msgbox') and ap.is_hidden('#f'))
        check('admin: messaggio visibile', 'piu giocatori' in ap.inner_text('#mlist'))
        check('admin: contatore aperti', '(1)' in ap.inner_text('#tMsgs'))
        ap.fill('.mi textarea', 'Grazie, ci stiamo lavorando.')
        ap.click('.mi .row button')
        ap.wait_for_function("document.getElementById('ok').textContent!==''")
        # con filtro "da rispondere" il messaggio sparisce
        ap.wait_for_function("document.getElementById('mlist').textContent.includes('Nessun messaggio')")
        check('admin: sparisce dai da rispondere', True)
        ap.select_option('#mFilter', 'answered'); ap.wait_for_selector('.mi')
        check('admin: tra le risposte', 'ci stiamo lavorando' in ap.inner_text('#mlist'))
        # token errato
        ap.click('#bOut'); check('admin: Esci richiude', ap.is_hidden('#panel') and ap.is_visible('#f'))
        ap.fill('#tok', 'test-admin-token-1234'); ap.click('#bLoad'); ap.wait_for_selector('#tMsgs'); ap.click('#tMsgs'); ap.wait_for_selector('#msgbox', state='visible')
        # l'utente vede la risposta
        pg.reload(); pg.wait_for_selector('.answer')
        check('utente: vede la risposta', 'ci stiamo lavorando' in pg.inner_text('#list') and 'Risposto' in pg.inner_text('#list') or 'ci stiamo lavorando' in pg.inner_text('#list'))
        # riapri ed elimina
        ap.select_option('#mFilter', 'answered'); ap.wait_for_selector('.mi')
        ap.click('.mi .alt'); ap.select_option('#mFilter', 'open'); ap.wait_for_selector('.mi')
        check('admin: riaperto', 'piu giocatori' in ap.inner_text('#mlist'))
        ap.click('.mi .del'); ap.wait_for_function("document.getElementById('mlist').textContent.includes('Nessun messaggio')")
        check('admin: eliminato', True)
        # inglese + admin EN
        ctx2 = b.new_context(viewport={'width': 390, 'height': 900}, locale='en-US'); en = ctx2.new_page()
        en.goto(B + '/feedback?lang=en')
        check('EN: titolo', 'Questions and suggestions' in en.inner_text('h1'))
        check('EN: niente italiano', not re.search(r'\b(Invia|Domanda|Suggerimento|messaggio)\b', en.inner_text('body')))
        en.fill('#text', 'ab'); en.click('#send')
        check('EN: testo troppo corto', 'at least 5' in en.inner_text('#status'))
        # landing: link nel footer
        en.goto(B + '/'); check('landing EN: link feedback', en.locator('footer a[href^="/feedback"]').count() == 1)
        en.goto(B + '/it/'); check('landing IT: link feedback', 'Domande e suggerimenti' in en.inner_text('footer'))
        en.goto(B + '/privacy'); check('privacy EN', 'Your rights' in en.inner_text('main') and 'Diritti' not in en.inner_text('main'))
        en.goto(B + '/it/privacy'); t = en.inner_text('main'); check('privacy IT', 'I tuoi diritti' in t and 'Your rights' not in t)
        en.goto(B + '/it/'); en.click('footer a[href="/it/privacy"]'); check('footer IT -> privacy IT', en.url.endswith('/it/privacy'))
        en.goto(B + '/terms'); t = en.inner_text('main'); check('terms EN', 'Acceptable use' in t and 'Uso consentito' not in t)
        en.goto(B + '/it/terms'); t = en.inner_text('main'); check('terms IT', 'Uso consentito' in t and 'Acceptable use' not in t)
        en.goto(B + '/it/'); en.click('footer a[href="/it/terms"]'); check('footer IT -> termini IT', en.url.endswith('/it/terms'))
        en.goto(B + '/'); en.click('footer a[href="/terms"]'); check('footer EN -> terms EN', en.url.endswith('/terms'))
        en.click('.langs a[lang=it]'); check('terms: cambio lingua', en.url.endswith('/it/terms'))
        check('nessun errore JS', not errs)
        if errs: print(errs)
        b.close()
finally:
    srv.terminate()
raise SystemExit(1 if fails else 0)
