import subprocess
from playwright.sync_api import sync_playwright
srv = subprocess.Popen(['node', '--no-warnings', 'test/dev-server.mjs', '8796'], stdout=subprocess.PIPE, text=True); srv.stdout.readline()
fails = []
def check(n, c):
    print(('ok  ' if c else 'FAIL'), n)
    if not c: fails.append(n)
def spin_stop(h):
    h.click('#bSpin'); h.wait_for_function("document.getElementById('bSpin').textContent==='STOP'"); h.wait_for_timeout(300); h.click('#bSpin')
def settings(h, wheel):
    h.click('#bSet'); h.fill('#gWheel', wheel); h.click('#dSave'); h.wait_for_timeout(300)
try:
    with sync_playwright() as p:
        b = p.chromium.launch(); errs = []
        h = b.new_context(viewport={'width': 390, 'height': 900}, locale='en-US').new_page(); h.on('dialog', lambda d: d.accept()); h.on('pageerror', lambda e: errs.append(str(e)))
        h.goto('http://localhost:8796/play'); h.wait_for_function("document.getElementById('status').textContent==='Screen is live'")
        code = h.inner_text('#roomCode')
        h.click('#bSet'); h.fill('#ptxt', 'Anna\nBen'); h.fill('#gWheel', 'JOKER\nJOKER\nJOKER\nJOKER\nJOKER\nJOKER'); h.click('#dSave')
        tv = b.new_context(viewport={'width': 1280, 'height': 720}).new_page(); tv.on('pageerror', lambda e: errs.append(str(e)))
        tv.goto('http://localhost:8796/screen?c=' + code); tv.wait_for_selector('#board .tile', timeout=8000)
        check('telefono: tasti Jolly nascosti all\'inizio', h.is_hidden('#jollyBtns'))
        spin_stop(h)
        tv.wait_for_function("document.querySelectorAll('#players .jl').length===1", timeout=15000)
        check('schermo: etichetta JOLLY accanto ad Anna', 'JOKER' in tv.inner_text('#players .pl:nth-child(1)').upper())
        h.wait_for_function("document.getElementById('hint').textContent.includes('spin the wheel')", timeout=12000)
        check('telefono: dopo il Jolly gira ancora lo stesso giocatore', 'Anna' in h.inner_text('#hint') and h.inner_text('#chips .chip.on').startswith('Anna'))
        check('telefono: il Jolly compare accanto al punteggio', '\U0001F0CF' in h.inner_text('#chips'))
        # ora la ruota ha solo bancarotte: il Jolly viene offerto
        settings(h, 'BANKRUPT\nBANKRUPT\nBANKRUPT\nBANKRUPT\nBANKRUPT\nBANKRUPT')
        check('telefono: Jolly conservato dopo il cambio impostazioni', '\U0001F0CF' in h.inner_text('#chips'))
        spin_stop(h)
        h.wait_for_function("document.getElementById('hint').textContent.includes('Joker')", timeout=12000)
        check('telefono: bancarotta con Jolly chiede la scelta', 'Joker' in h.inner_text('#hint'))
        h.wait_for_function("!document.getElementById('bJollyUse').disabled", timeout=12000)
        check('telefono: tasti Usa / No visibili', h.is_visible('#bJollyUse') and h.is_visible('#bJollyNo'))
        check('telefono: Gira, Risolta e lettere bloccate', h.is_disabled('#bSpin') and h.is_disabled('#bSolved') and h.is_disabled('.key[data-l=T]'))
        tv.wait_for_function("document.querySelector('#players .pl.ask')!==null", timeout=8000)
        check('schermo: il giocatore con il Jolly lampeggia', True)
        h.click('#bTurn'); check('telefono: Next turn ignorato durante la scelta', h.inner_text('#chips .chip.on').startswith('Anna'))
        h.click('#bJollyUse'); h.wait_for_function("document.getElementById('hint').textContent.includes('spin the wheel')")
        check('telefono: usato il Jolly, Anna mantiene il turno', h.inner_text('#chips .chip.on').startswith('Anna') and '\U0001F0CF' not in h.inner_text('#chips'))
        tv.wait_for_function("document.querySelectorAll('#players .jl').length===0", timeout=8000)
        check('schermo: etichetta Jolly sparita', True)
        # ora senza Jolly: la bancarotta si applica subito
        spin_stop(h); h.wait_for_function("document.getElementById('hint').textContent.includes('Ben')", timeout=12000)
        check('telefono: senza Jolly la bancarotta passa il turno', h.inner_text('#chips .chip.on').startswith('Ben'))
        check('nessun errore JS', not errs)
        print(errs)
finally:
    srv.kill()
print('FALLITI:', fails or 'nessuno'); raise SystemExit(1 if fails else 0)
