"""Genera public/qr.svg (QR del sito) senza librerie. Versione 2, livello M, modalita' byte."""
import sys, os
URL = sys.argv[1] if len(sys.argv) > 1 else 'https://spinthefortune.com'
V, N, DATA_CW, EC_CW = 2, 25, 28, 16
# GF(256)
EXP = [0]*512; LOG = [0]*256; x = 1
for i in range(255):
    EXP[i] = x; LOG[x] = i; x <<= 1
    if x & 256: x ^= 0x11d
for i in range(255, 512): EXP[i] = EXP[i-255]
def gmul(a, b): return 0 if not a or not b else EXP[LOG[a]+LOG[b]]
def rs(data, n):
    g = [1]
    for i in range(n):
        ng = [0]*(len(g)+1)
        for j, c in enumerate(g):
            ng[j] ^= c; ng[j+1] ^= gmul(c, EXP[i])
        g = ng
    r = [0]*n
    for b in data:
        f = b ^ r[0]; r = r[1:]+[0]
        for i in range(n): r[i] ^= gmul(g[i+1], f)
    return r
b = URL.encode()
bits = '0100' + format(len(b), '08b') + ''.join(format(c, '08b') for c in b)
assert len(bits) <= DATA_CW*8, 'troppo lungo'
bits += '0'*min(4, DATA_CW*8-len(bits))
bits += '0'*(-len(bits) % 8)
cw = [int(bits[i:i+8], 2) for i in range(0, len(bits), 8)]
pad = [0xEC, 0x11]
while len(cw) < DATA_CW: cw.append(pad[(len(cw)-len(bits)//8) % 2])
cw += rs(cw, EC_CW)
stream = ''.join(format(c, '08b') for c in cw)
def build(mask):
    M = [[None]*N for _ in range(N)]; F = [[False]*N for _ in range(N)]
    def put(r, c, v, fn=True):
        M[r][c] = v; F[r][c] = fn
    def finder(r0, c0):
        for dr in range(-1, 8):
            for dc in range(-1, 8):
                r, c = r0+dr, c0+dc
                if 0 <= r < N and 0 <= c < N:
                    v = 0 <= dr <= 6 and 0 <= dc <= 6 and (dr in (0, 6) or dc in (0, 6) or (2 <= dr <= 4 and 2 <= dc <= 4))
                    put(r, c, v)
    finder(0, 0); finder(0, N-7); finder(N-7, 0)
    for i in range(8, N-8):
        put(6, i, i % 2 == 0); put(i, 6, i % 2 == 0)
    for dr in range(-2, 3):
        for dc in range(-2, 3):
            put(18+dr, 18+dc, max(abs(dr), abs(dc)) != 1)
    put(N-8, 8, True)
    # format info (livello M = 00)
    fmt = (0b00 << 3) | mask; rem = fmt
    for _ in range(10): rem = (rem << 1) ^ ((rem >> 9) * 0x537)
    fb = ((fmt << 10) | rem) ^ 0x5412
    bit = lambda i: bool((fb >> i) & 1)
    for i in range(6): put(i, 8, bit(i))
    put(7, 8, bit(6)); put(8, 8, bit(7)); put(8, 7, bit(8))
    for i in range(9, 15): put(8, 14-i, bit(i))
    for i in range(8): put(8, N-1-i, bit(i))
    for i in range(8, 15): put(N-15+i, 8, bit(i))
    put(N-8, 8, True)
    # dati
    k = 0; up = True; c = N-1
    while c > 0:
        if c == 6: c -= 1
        rows = range(N-1, -1, -1) if up else range(N)
        for r in rows:
            for cc in (c, c-1):
                if not F[r][cc]:
                    v = k < len(stream) and stream[k] == '1'; k += 1
                    m = [(r+cc) % 2 == 0, r % 2 == 0, cc % 3 == 0, (r+cc) % 3 == 0, (r//2+cc//3) % 2 == 0,
                         (r*cc) % 2+(r*cc) % 3 == 0, ((r*cc) % 2+(r*cc) % 3) % 2 == 0, ((r+cc) % 2+(r*cc) % 3) % 2 == 0][mask]
                    M[r][cc] = v ^ m
        up = not up; c -= 2
    return [[bool(x) for x in row] for row in M]
def penalty(M):
    p = 0
    for g in (M, list(zip(*M))):
        for row in g:
            run = 1
            for i in range(1, N):
                if row[i] == row[i-1]:
                    run += 1
                    if run == 5: p += 3
                    elif run > 5: p += 1
                else: run = 1
    for r in range(N-1):
        for c in range(N-1):
            if M[r][c] == M[r][c+1] == M[r+1][c] == M[r+1][c+1]: p += 3
    pat = [1,0,1,1,1,0,1,0,0,0,0]
    for g in (M, list(zip(*M))):
        for row in g:
            row = [int(x) for x in row]
            for i in range(N-10):
                if row[i:i+11] == pat or row[i:i+11] == pat[::-1]: p += 40
    d = sum(map(sum, M)); p += abs(d*100//(N*N)-50)//5*10
    return p
best = min(range(8), key=lambda m: penalty(build(m)))
M = build(best)
Q = 4; S = N+2*Q
rects = ''.join(f'<rect x="{c+Q}" y="{r+Q}" width="1" height="1"/>' for r in range(N) for c in range(N) if M[r][c])
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" shape-rendering="crispEdges"><rect width="{S}" height="{S}" fill="#fff"/><g fill="#000">{rects}</g></svg>\n'
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public', 'qr.svg')
open(out, 'w').write(svg); print('mask', best, out)
