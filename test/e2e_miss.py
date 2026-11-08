import subprocess
from playwright.sync_api import sync_playwright
srv = subprocess.Popen(['node', '--no-warnings', 'test/dev-server.mjs', '8792'], stdout=subprocess.PIPE, text=True); srv.stdout.readline()
fails = []
def check(n, c):
    print(('ok  ' if c else 'FAIL'), n)
    if not c: fails.append(n)
B = 'http://localhost:8792'
def host(ctx):
    h = ctx.new_page(); h.on('dialog', lambda d: d.accept())
    h.goto(B + '/play'); h.wait_for_function("document.getElementById('status').textContent==='Screen is live'")
    return h, h.inner_text('#roomCode')
def setup(h, hide):
    h.click('#bSet'); h.fill('#txt', 'Cinema | CASA'); h.fill('#ptxt', 'Anna\nBen'); h.fill('#gWheel', '500\n500\n500\n500\n500\n500')
    h.set_checked('#gMiss', not hide); h.click('#dSave')
def spin(h):
    h.click('#bSpin'); h.wait_for_function("document.getElementById('bSpin').textContent==='STOP'"); h.click('#bSpin'); h.wait_for_function("document.getElementById('hint').textContent.includes('consonant')", timeout=9000)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []
        ctx = b.new_context(viewport={'width': 390, 'height': 900}, locale='en-US')
        tv = b.new_context(viewport={'width': 1280, 'height': 720}).new_page(); tv.on('pageerror', lambda e: errs.append(str(e)))
        h, code = host(ctx); h.on('pageerror', lambda e: errs.append(str(e)))
        # 1) predefinito: visibile e lettera sbagliata bloccata
        setup(h, hide=False)
        tv.goto(B + '/screen?c=' + code); tv.wait_for_selector('#lettersMiss')
        spin(h); h.click('.key[data-l=Z]')
        tv.wait_for_function("document.getElementById('lettersMiss').textContent.includes('Z')")
        check('visibile: Z sulla TV', tv.evaluate("getComputedStyle(document.getElementById('lettersMiss').parentNode).visibility")=='visible')
        spin(h)
        check('visibile: Z ancora premibile', not h.is_disabled('.key[data-l=Z]'))
        h.click('.key[data-l=Z]'); h.wait_for_function("document.getElementById('hint').textContent.includes('Anna')")
        check('visibile: ripetuta passa il turno', 'already called' in h.inner_text('#toast'))
        # 2) nascoste
        setup(h, hide=True)
        spin(h); h.click('.key[data-l=Z]')
        tv.wait_for_function("getComputedStyle(document.getElementById('lettersMiss').parentNode).visibility==='hidden'")
        check('nascoste: striscia nascosta sulla TV', True)
        check('nascoste: turno a Ben', 'Ben' in h.inner_text('#hint'))
        spin(h)
        check('nascoste: Z ancora premibile', not h.is_disabled('.key[data-l=Z]'))
        h.click('.key[data-l=Z]')
        h.wait_for_function("document.getElementById('hint').textContent.includes('Anna')")
        check('ripetuta: passa ad Anna', 'Anna' in h.inner_text('#hint'))
        check('ripetuta: avviso', 'already called' in h.inner_text('#toast'))
        # lettera trovata resta bloccata
        spin(h); h.click('.key[data-l=C]')
        check('trovata: resta bloccata', h.is_disabled('.key[data-l=C]'))
        check('nessun errore JS', not errs)
        if errs: print(errs)
        b.close()
finally:
    srv.terminate()
raise SystemExit(1 if fails else 0)
