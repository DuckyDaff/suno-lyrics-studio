// Suno Hebrew Lyrics Studio — local dev server with Dicta nikud proxy
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const STATIC_DIR = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url);

  // ── CORS headers for all responses ──────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // ── Nikud proxy  POST /api/nikud → Dicta ────────────────────────
  if (req.method === 'POST' && parsed.pathname === '/api/nikud') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const buf = Buffer.from(body, 'utf8');
      const dictaReq = https.request(
        {
          hostname: 'nakdan-u1-0.loadbalancer.dicta.org.il',
          path: '/api',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': buf.length,
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json',
          },
        },
        dictaRes => {
          let data = '';
          dictaRes.on('data', c => data += c);
          dictaRes.on('end', () => {
            res.writeHead(dictaRes.statusCode, { 'Content-Type': 'application/json' });
            res.end(data);
          });
        }
      );
      dictaReq.on('error', e => {
        console.error('[nikud proxy error]', e.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });
      dictaReq.write(buf);
      dictaReq.end();
    });
    return;
  }

  // ── Static files ─────────────────────────────────────────────────
  let filePath = path.join(STATIC_DIR,
    parsed.pathname === '/' ? 'index.html' : parsed.pathname
  );
  const ext = path.extname(filePath).toLowerCase();
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') { res.writeHead(404); res.end('404 Not Found'); }
      else { res.writeHead(500); res.end('500 Error'); }
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n  Suno Hebrew Lyrics Studio`);
  console.log(`  http://localhost:${PORT}\n`);
  console.log(`  [proxy] POST /api/nikud → nakdan.dicta.org.il\n`);
});
