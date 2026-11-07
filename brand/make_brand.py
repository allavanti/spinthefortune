# Genera logo.svg, banner.svg e cover.svg (poi i PNG con Playwright). Uso: python3 make_brand.py
import math
def wheel(cx,cy,R,rot=0):
    cols=['#ffc83d','#ff4f8b','#2b63e6','#fbf7ec','#ff4f8b','#ffc83d','#fbf7ec','#2b63e6']
    n=len(cols); out=[]
    for i,c in enumerate(cols):
        a0=math.radians(i*360/n-90+rot); a1=math.radians((i+1)*360/n-90+rot)
        x0,y0=cx+R*math.cos(a0),cy+R*math.sin(a0); x1,y1=cx+R*math.cos(a1),cy+R*math.sin(a1)
        out.append(f'<path d="M{cx} {cy} L{x0:.1f} {y0:.1f} A{R} {R} 0 0 1 {x1:.1f} {y1:.1f} Z" fill="{c}"/>')
    for i in range(n):
        a=math.radians(i*360/n-90+rot)
        out.append(f'<line x1="{cx}" y1="{cy}" x2="{cx+R*math.cos(a):.1f}" y2="{cy+R*math.sin(a):.1f}" stroke="#120f3a" stroke-width="{R*0.022:.1f}"/>')
    return ''.join(out)
def mark(cx,cy,R):
    s=R/190
    pegs=''.join(f'<circle cx="{cx+(R+10*s)*math.cos(math.radians(i*45-90+22.5)):.1f}" cy="{cy+(R+10*s)*math.sin(math.radians(i*45-90+22.5)):.1f}" r="{5*s:.1f}" fill="#fbf7ec"/>' for i in range(8))
    return f'''<circle cx="{cx}" cy="{cy}" r="{R+22*s}" fill="#1b1760"/>
<circle cx="{cx}" cy="{cy}" r="{R+22*s}" fill="none" stroke="#ffc83d" stroke-width="{6*s:.1f}"/>
{wheel(cx,cy,R,12)}{pegs}
<g transform="rotate(-8 {cx} {cy})"><rect x="{cx-52*s}" y="{cy-60*s}" width="{104*s}" height="{120*s}" rx="{16*s}" fill="#fbf7ec" stroke="#120f3a" stroke-width="{7*s}"/>
<text x="{cx}" y="{cy+34*s}" text-anchor="middle" font-family="Arial Rounded MT Bold,Trebuchet MS,Arial,sans-serif" font-weight="900" font-size="{98*s}" fill="#2b63e6">S</text></g>
<path d="M{cx-18*s} {cy-R-34*s} L{cx+18*s} {cy-R-34*s} L{cx} {cy-R+6*s} Z" fill="#ff4f8b" stroke="#120f3a" stroke-width="{5*s}" stroke-linejoin="round"/>'''
FONT='Arial Rounded MT Bold,Trebuchet MS,Arial,sans-serif'
def banner(w,h,cx,R,tx,fs,sub):
    cy=h/2+10
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><rect width="{w}" height="{h}" fill="#120f3a"/>
{mark(cx,cy,R)}
<text x="{tx}" y="{cy-8}" font-family="{FONT}" font-weight="900" font-size="{fs}" fill="#f3f0ff">Spin the <tspan fill="#ffc83d">Fortune</tspan></text>
<text x="{tx+4}" y="{cy+52}" font-family="system-ui,Arial,sans-serif" font-size="{sub}" fill="#b9b3e6">A free word-puzzle game for your TV</text></svg>'''
open('logo.svg','w').write(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#120f3a"/>{mark(256,268,170)}</svg>')
open('banner.svg','w').write(banner(1600,400,260,130,480,120,40))
open('cover.svg','w').write(banner(1200,400,215,105,395,80,30))
