"""Pagine guida in inglese (SEO): /family-game-night, /classroom-word-game, /word-game-for-tv."""
import os, json
import privacy as P
BASE = P.BASE
PAGES = {
 'family-game-night': dict(
  title='Family game night: a free word-puzzle game for your TV - Spin the Fortune',
  desc='A free word-puzzle game for family game night. Put the board on the TV, call letters from your phones, and make the phrases your own. No sign-up.',
  h1='A word-puzzle game for family game night',
  lead='Spin the Fortune turns the living-room TV into a puzzle board. Everyone calls letters from the sofa while one person runs the game from a phone. It is free, has no account and needs no app.',
  body='''
  <h2>Why it works for a whole family</h2>
  <ul>
   <li><b>Everyone can join in.</b> Kids call the easy letters, grandparents solve the proverbs. Pick the difficulty and category when you load ready-made phrases.</li>
   <li><b>Your own phrases.</b> Write inside jokes, family sayings, song lines or the names of your cousins. The category you type appears on screen as a hint.</li>
   <li><b>Real game rules.</b> Spin the wheel, call a consonant for its value, buy a vowel, avoid Bankrupt. Or switch scores off and just solve phrases together.</li>
   <li><b>Fair turns.</b> The current player is highlighted, and a letter that is not in the phrase passes the turn.</li>
  </ul>
  <h2>Set up in about a minute</h2>
  <ol>
   <li>On a phone, tap <b>Start a game</b> and note the 6-character screen code.</li>
   <li>On the TV (smart TV browser) or a laptop connected by HDMI, open <b>spinthefortune.com/screen</b> and type the code. On a PC you can also cast the Chrome tab to the TV.</li>
   <li>Add player names, pick or write phrases, and tap Spin.</li>
  </ol>
  <h2>Tips</h2>
  <ul>
   <li>Aim for 15 to 30 phrases, each under about 40 letters so the board stays readable from the sofa.</li>
   <li>Use the ready-made catalog to start, then mix in your own phrases for the personal touch.</li>
   <li>Keep names to first names or nicknames, especially for children.</li>
  </ul>'''),
 'classroom-word-game': dict(
  title='Classroom word game: free phrase puzzles on the board - Spin the Fortune',
  desc='A free classroom word game. Show the puzzle board on the projector or smart board, write your own phrases for vocabulary, idioms and proverbs, no accounts needed.',
  h1='A free word game for the classroom',
  lead='Spin the Fortune shows a phrase puzzle board on your projector or interactive whiteboard while you run the game from a phone or tablet. Write your own phrases for the lesson. Students need no accounts and nothing is installed.',
  body='''
  <h2>What teachers use it for</h2>
  <ul>
   <li><b>Vocabulary and idioms.</b> Turn this week's words into puzzles. Categories on screen give students a hint.</li>
   <li><b>Spelling and letter patterns.</b> Students call letters and see where they fall, which is good practice for spelling and word shape.</li>
   <li><b>Language learners.</b> Proverbs, idioms and everyday sentences work well for ESL and for foreign-language classes. The ready-made catalog is available in English and Italian, separately.</li>
   <li><b>Revision games.</b> Split the class into teams. Use the scoring wheel, or turn scores off and just race to solve.</li>
  </ul>
  <h2>Why it suits a school setting</h2>
  <ul>
   <li>No student accounts, no emails, no app to install.</li>
   <li>The screen only receives the letters already revealed, so no one can read the answer from the page.</li>
   <li>No advertising and no tracking. Only anonymous totals are counted.</li>
   <li>Your phrases and team names stay in your own browser.</li>
  </ul>
  <h2>Quick start</h2>
  <ol>
   <li>On your phone or tablet tap <b>Start a game</b> and note the screen code.</li>
   <li>On the classroom computer open <b>spinthefortune.com/screen</b>, type the code and put the tab on the projector.</li>
   <li>Paste your phrases, one per line as <code class="inl">Category | PHRASE</code>, add team names and start.</li>
  </ol>'''),
 'word-game-for-tv': dict(
  title='A word game for your TV: board on the screen, letters from your phone - Spin the Fortune',
  desc='Play a free word-puzzle game on your TV. Open the board on a smart TV, Chromecast or laptop and run the game from your phone. No account, no app.',
  h1='A word game for your TV',
  lead='Spin the Fortune is a free puzzle game made for the big screen: the board and the wheel appear on the TV, and the host controls everything from a phone. There is nothing to install and no account to create.',
  body='''
  <h2>Ways to get the board on the TV</h2>
  <ul>
   <li><b>Smart TV with a browser:</b> open spinthefortune.com/screen and type the code.</li>
   <li><b>Chromecast or Google TV:</b> in Chrome on a PC choose Cast, then Cast tab, and keep the screen tab open.</li>
   <li><b>Laptop on an HDMI cable:</b> open the screen page and put the browser in full screen.</li>
  </ul>
  <h2>What you get on screen</h2>
  <ul>
   <li>A large puzzle board that reveals letters as they are called, with the category as a hint.</li>
   <li>A spinning wheel with sound, current player highlighted, and running scores.</li>
   <li>Optional strip of missed letters, which you can hide in Settings.</li>
   <li>The phrase is masked on the server, so the answer never reaches the TV.</li>
  </ul>
  <h2>Run it from the phone</h2>
  <p>Tap Start a game, enter the code on the TV, then spin, call letters, buy vowels and mark the phrase as solved. You can change the wheel values and the vowel price in Settings, or use ready-made phrases by category and difficulty.</p>'''),
}
ORDER = list(PAGES)
T2 = '''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#120f3a">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="/css/site.css">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:site_name" content="Spin the Fortune">
<style>.pv{{max-width:720px;padding-bottom:50px}}.pv h1{{margin:10px 0 8px;font:800 clamp(1.9rem,5vw,2.8rem)/1.1 var(--display)}}.pv h2{{margin:34px 0 10px;font-size:1.35rem}}.pv p,.pv li{{max-width:none}}.pv ul,.pv ol{{padding-left:1.2em}}.pv .cta{{margin:22px 0 6px}}</style>
{json}
</head>
<body class="site">
<div class="wrap pv">
  <div class="bar">
    <a class="logo" href="/">Spin the <span>Fortune</span></a>
  </div>
  <main>
  <h1>{h1}</h1>
  <p class="lead">{lead}</p>
  <div class="cta"><a class="btn-main" href="/play?lang=en">Start a game</a></div>
{body}
  <h2>More guides</h2>
  <ul>
{more}
  </ul>
  <div class="cta"><a class="btn-main" href="/play?lang=en">Start a game, it is free</a></div>
  </main>
  <p style="margin-top:30px"><a href="/">Spin the Fortune</a> &middot; <a href="/feedback?lang=en">Questions and suggestions</a> &middot; <a href="/privacy">Privacy</a> &middot; <a href="/terms">Terms of use</a></p>
</div>
</body>
</html>
'''
def head_extra(slug):
    u = BASE + '/' + slug
    return ('<link rel="canonical" href="%s">\n<link rel="icon" href="/favicon.svg" type="image/svg+xml">\n<link rel="apple-touch-icon" href="/apple-touch-icon.png">\n'
            '<meta property="og:type" content="article">\n<meta property="og:url" content="%s">\n<meta property="og:locale" content="en_US">\n<meta property="og:image" content="%s/og.png">\n') % (u, u, BASE)
def write():
    for slug, d in PAGES.items():
        more = '\n'.join('   <li><a href="/%s">%s</a></li>' % (s, PAGES[s]['h1']) for s in ORDER if s != slug)
        ld = json.dumps({'@context': 'https://schema.org', '@type': 'WebPage', 'name': d['h1'], 'url': BASE + '/' + slug,
                         'inLanguage': 'en', 'isPartOf': {'@type': 'WebSite', 'name': 'Spin the Fortune', 'url': BASE + '/'}}, ensure_ascii=False)
        s = T2.format(title=d['title'], desc=d['desc'], h1=d['h1'], lead=d['lead'], body=d['body'], more=more,
                      json='<script type="application/ld+json">' + ld + '</script>')
        s = s.replace('<link rel="stylesheet" href="/css/site.css">', '<link rel="stylesheet" href="/css/site.css">\n' + head_extra(slug), 1)
        open(os.path.join(P.ROOT, slug + '.html'), 'w', encoding='utf-8').write(s)
if __name__ == '__main__':
    write(); print('ok', ORDER)
