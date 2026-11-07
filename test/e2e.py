import subprocess, time, sys, os
from playwright.sync_api import sync_playwright

srv = subprocess.Popen(['node', '--no-warnings', 'test/dev-server.mjs', '8788'], stdout=subprocess.PIPE, text=True)
srv.stdout.readline()
fails = []
def check(name, cond):
    print(('ok  ' if cond else 'FAIL'), name)
    if not cond: fails.append(name)

try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        host_ctx = b.new_context(viewport={'width': 390, 'height': 844}, locale='en-US')
        tv_ctx = b.new_context(viewport={'width': 1280, 'height': 720})
        errs = []
        host = host_ctx.new_page(); host.on('pageerror', lambda e: errs.append(str(e)))
        tv = tv_ctx.new_page(); tv.on('pageerror', lambda e: errs.append(str(e)))

        host.goto('http://localhost:8788/play')
        host.wait_for_function("document.getElementById('roomCode').textContent.length==6 && document.getElementById('roomCode').textContent!=='------'")
        code = host.inner_text('#roomCode')
        check('host: codice di 6 caratteri ' + code, len(code) == 6)
        host.wait_for_function("document.getElementById('status').textContent==='Screen is live'")
        check('host: stato collegato', True)

        tv.goto('http://localhost:8788/screen')
        check('schermo: chiede il codice', tv.is_visible('#codeIn'))
        tv.fill('#codeIn', 'ZZZZZZ'); tv.press('#codeIn', 'Enter')
        tv.wait_for_selector('#err:not(:empty)')
        check('schermo: codice sbagliato -> messaggio', 'Unknown' in tv.inner_text('#err'))
        tv.fill('#codeIn', code.lower()); tv.press('#codeIn', 'Enter')
        tv.wait_for_selector('#board .tile', timeout=8000)
        check('schermo: mostra il tabellone', tv.locator('#board .tile').count() > 5)

        # nessuna lettera nascosta nel DOM
        def hidden_letters():
            return tv.evaluate("""()=>[...document.querySelectorAll('#board .tile[data-k]:not(.show)')].map(t=>t.textContent).join('')""")
        h = hidden_letters()
        check('schermo: lettere nascoste sono solo segnaposto A', set(h) <= {'A'} and len(h) > 5)
        check('schermo: la frase non e\' nel testo della pagina', 'PENNY' not in tv.content() and 'EARNED' not in tv.content())

        # il host chiama una lettera (frase di default EN: la prima)
        phrase = host.evaluate("""()=>document.getElementById('board').textContent""")
        host.click('.key[data-l="E"]')
        tv.wait_for_selector('#board .tile.show[data-k="E"]', timeout=6000)
        check('schermo: lettera E scoperta', tv.locator('#board .tile.show[data-k="E"]').count() > 0)
        check('schermo: pannello lettere', 'E' in tv.inner_text('#lettersHit'))
        host.click('.key[data-l="Z"]')
        tv.wait_for_function("document.getElementById('lettersMiss').textContent.includes('Z')", timeout=6000)
        check('schermo: lettera sbagliata nel pannello', True)

        # ricarica schermo: ricorda il codice
        tv.reload(); tv.wait_for_selector('#board .tile', timeout=8000)
        check('schermo: dopo ricarica resta collegato', True)

        # italiano
        host.goto('http://localhost:8788/play?lang=it')
        host.wait_for_timeout(300)
        check('host: italiano', 'Codice schermo' in host.inner_text('.room'))
        check('host: stesso codice dopo ricarica', host.inner_text('#roomCode') == code)

        adm = host_ctx.new_page(); adm.goto('http://localhost:8788/admin.html')
        adm.fill('#tok', 'test-admin-token-1234'); adm.click('button[type=submit]')
        adm.wait_for_selector('#out table', timeout=5000)
        txt = adm.inner_text('#out')
        check('admin: mostra contatori', 'room_created' in txt and 'letter_hit' in txt and 'screen_connected' in txt)
        check('admin: italiano di default', 'utilizzo' in adm.inner_text('h1') and 'Totali' in txt)
        adm.click('.lg button[data-l=en]')
        check('admin: passa all\'inglese', 'usage' in adm.inner_text('h1') and 'Totals' in adm.inner_text('#out'))
        adm.reload(); check('admin: ricorda la lingua', 'usage' in adm.inner_text('h1'))
        adm.click('.lg button[data-l=it]')
        adm.fill('#tok', 'sbagliato-sbagliato-1'); adm.click('button[type=submit]')
        adm.wait_for_function("document.getElementById('msg').textContent.length>0")
        check('admin: token errato rifiutato', True)

        tv.screenshot(path='/tmp/claude-0/-home-claude/6a1c637f-70df-54b9-aee2-ae921ccd0ab4/scratchpad/e2e_tv.png')
        host.screenshot(path='/tmp/claude-0/-home-claude/6a1c637f-70df-54b9-aee2-ae921ccd0ab4/scratchpad/e2e_host.png')
        check('nessun errore JS', not errs)
        if errs: print(errs)
        b.close()
finally:
    srv.terminate()
print('FALLITI:', fails if fails else 'nessuno')
sys.exit(1 if fails else 0)
