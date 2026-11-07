import subprocess, sys
from playwright.sync_api import sync_playwright
SHOT='/tmp/claude-0/-home-claude/6a1c637f-70df-54b9-aee2-ae921ccd0ab4/scratchpad'
srv = subprocess.Popen(['node', '--no-warnings', 'test/dev-server.mjs', '8791'], stdout=subprocess.PIPE, text=True); srv.stdout.readline()
fails = []
def check(n, c):
    print(('ok  ' if c else 'FAIL'), n)
    if not c: fails.append(n)
COUNT = """
window.__osc = 0;
(function(){ var AC = window.AudioContext || window.webkitAudioContext; if(!AC) return;
  var o = AC.prototype.createOscillator; AC.prototype.createOscillator = function(){ window.__osc++; return o.apply(this, arguments); }; })();
"""
def setup_host(ctx, wheel):
    h = ctx.new_page(); h.on('dialog', lambda d: d.accept())
    h.goto('http://localhost:8791/play')
    h.wait_for_function("document.getElementById('status').textContent==='Screen is live'")
    code = h.inner_text('#roomCode')
    h.click('#bSet'); h.fill('#ptxt', 'Anna\nBen'); h.fill('#gWheel', wheel); h.click('#dSave')
    return h, code
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']); errs = []
        hctx = b.new_context(viewport={'width': 390, 'height': 900}, locale='en-US')
        tctx = b.new_context(viewport={'width': 1280, 'height': 720}); tctx.add_init_script(COUNT)
        host, code = setup_host(hctx, '500\n500\n500\n500\n500\n500')
        tv = tctx.new_page(); tv.on('pageerror', lambda e: errs.append(str(e))); host.on('pageerror', lambda e: errs.append(str(e)))
        tv.goto('http://localhost:8791/screen?c=' + code)
        tv.wait_for_selector('#board .tile', timeout=8000)
        tv.keyboard.press('x')   # gesto: abilita l'audio
        tv.wait_for_function("document.getElementById('snd').textContent==='Sound on'", timeout=3000)
        check('schermo: audio attivato dal primo tasto', True)
        check('schermo: punteggi con 2 concorrenti', tv.locator('#players .pl.game').count() == 2)
        check('schermo: ruota nascosta all\'inizio', tv.is_hidden('#wheelWrap'))

        host.click('#bSpin')
        tv.wait_for_selector('#wheelWrap:not([hidden])', timeout=6000)
        check('schermo: la ruota compare', True)
        osc0 = tv.evaluate('window.__osc')
        tv.wait_for_timeout(1500)
        tv.screenshot(path=SHOT+'/e2e_wheel.png')
        tv.wait_for_function("document.getElementById('wheelRes').textContent.includes('500')", timeout=9000)
        check('schermo: la ruota si ferma su 500', True)
        check('schermo: suoni della ruota', tv.evaluate('window.__osc') > osc0 + 5)
        tv.screenshot(path=SHOT+'/e2e_wheel_res.png')
        tv.wait_for_selector('#wheelWrap[hidden]', state='attached', timeout=6000)
        check('schermo: la ruota si chiude da sola', True)

        host.wait_for_function("document.getElementById('hint').textContent.includes('consonant')", timeout=9000)
        host.click('.key[data-l=N]')
        tv.wait_for_selector('#board .tile.show[data-k="N"]', timeout=6000)
        n_anim = tv.locator('#board .tile.show.anim').count()
        tv.wait_for_function("document.getElementById('players').textContent.includes('2500')", timeout=6000)
        check('schermo: punteggio 2500 per Anna', True)
        check('schermo: annuncio punti', 'Anna' in tv.inner_text('#banner') and '2500' in tv.inner_text('#banner'))
        print('tessere animate:', n_anim); check('schermo: tessere con animazione e lampo', n_anim == 5)
        tv.screenshot(path=SHOT+'/e2e_score.png')

        host.click('#bSolved')
        tv.wait_for_function("document.getElementById('banner').textContent.includes('solved')", timeout=6000)
        check('schermo: annuncio risolta', True)
        tv.wait_for_timeout(1200)
        tv.screenshot(path=SHOT+'/e2e_confetti.png')
        check('schermo: totale di Anna', 'total 2500' in tv.inner_text('#players').lower())

        # bancarotta forzata
        host.click('#bSet'); host.fill('#gWheel', 'bankrupt\nbankrupt\nbankrupt\nbankrupt\nbankrupt\nbankrupt'); host.click('#dSave')
        host.click('#bSpin')
        tv.wait_for_function("document.getElementById('wheelRes').textContent.toUpperCase().includes('BANKRUPT')", timeout=12000)
        check('schermo: bancarotta mostrata', 'bad' in (tv.get_attribute('#wheelRes', 'class') or ''))
        tv.wait_for_selector('#wheelWrap[hidden]', state='attached', timeout=6000)
        check('schermo: turno passato a Ben', 'on' in (tv.locator('#players .pl').nth(1).get_attribute('class') or ''))

        # ricarica schermo: nessuna animazione, punteggi presenti
        tv.reload(); tv.wait_for_selector('#board .tile', timeout=8000)
        check('ricarica schermo: niente ruota', tv.is_hidden('#wheelWrap'))
        check('ricarica schermo: totale ancora visibile', 'total 2500' in tv.inner_text('#players').lower())

        # muto con M
        tv.keyboard.press('m'); tv.keyboard.press('m'); check('schermo: M silenzia', tv.inner_text('#snd') == 'Muted')
        check('nessun errore JS', not errs)
        if errs: print(errs)
        b.close()
finally:
    srv.terminate()
print('FALLITI:', fails or 'nessuno'); sys.exit(1 if fails else 0)
