// Server locale che simula Cloudflare Pages + D1 (SQLite in memoria). Uso: node test/dev-server.mjs [porta]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fakeD1 } from './d1shim.mjs';
import { onRequestPost as room } from '../functions/api/room.js';
import { onRequestPost as state } from '../functions/api/state.js';
import { onRequestGet as screen } from '../functions/api/screen.js';
import { onRequestGet as adminStats } from '../functions/api/admin/stats.js';
import { onRequestPost as fbPost, onRequestGet as fbGet } from '../functions/api/feedback.js';
import { onRequestPost as msgPost, onRequestGet as msgGet } from '../functions/api/admin/messages.js';
import { onRequestPost as phPost, onRequestGet as phGet } from '../functions/api/phrases.js';
import { onRequestPost as apPost, onRequestGet as apGet } from '../functions/api/admin/phrases.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const env = { DB: fakeD1(), ADMIN_TOKEN: 'test-admin-token-1234' };
const api = { '/api/room': ['POST', room], '/api/state': ['POST', state], '/api/screen': ['GET', screen], '/api/admin/stats': ['GET', adminStats] };
const multi = { '/api/feedback': { GET: fbGet, POST: fbPost }, '/api/admin/messages': { GET: msgGet, POST: msgPost },
  '/api/phrases': { GET: phGet, POST: phPost }, '/api/admin/phrases': { GET: apGet, POST: apPost } };
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.txt': 'text/plain', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.xml': 'application/xml' };

export function start(port = 8788) {
  const srv = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://localhost');
    const route = api[u.pathname] || (multi[u.pathname] && multi[u.pathname][req.method] ? [req.method, multi[u.pathname][req.method]] : null);
    if (route) {
      const chunks = []; for await (const c of req) chunks.push(c);
      const body = route[0] === 'POST' ? Buffer.concat(chunks) : undefined;
      const request = new Request(u, { method: req.method, headers: req.headers, body });
      const r = route[1] && req.method === route[0]
        ? await route[1]({ request, env }) : new Response('{"error":"metodo"}', { status: 405 });
      res.writeHead(r.status, Object.fromEntries(r.headers)); res.end(Buffer.from(await r.arrayBuffer())); return;
    }
    let p = path.join(root, decodeURIComponent(u.pathname));
    if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
    if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
    else if (!fs.existsSync(p) && fs.existsSync(p + '.html')) p += '.html';
    if (!fs.existsSync(p)) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
    res.end(fs.readFileSync(p));
  });
  return new Promise((ok) => srv.listen(port, () => ok(srv)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await start(Number(process.argv[2]) || 8788);
  console.log('http://localhost:' + (process.argv[2] || 8788));
}
