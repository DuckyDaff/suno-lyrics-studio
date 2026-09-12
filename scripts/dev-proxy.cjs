// Local dev helper: the Vite dev server proxies /api → :3000. This serves the Dicta nikud
// proxy so Hebrew tools work locally without `vercel dev`. Other /api routes answer 404.
const http = require('http');
const https = require('https');

const PORT = 3000;
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  if (req.method === 'POST' && req.url.split('?')[0] === '/api/nikud') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      const buf = Buffer.from(body, 'utf8');
      const up = https.request({
        hostname: 'nakdan-u1-0.loadbalancer.dicta.org.il', path: '/api', method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length, 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' },
      }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { res.writeHead(r.statusCode, { 'Content-Type': 'application/json' }); res.end(d); }); });
      up.on('error', e => { res.writeHead(502, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ error: e.message })); });
      up.write(buf); up.end();
    });
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'not_available_locally' }));
}).listen(PORT, () => console.log(`dev proxy on http://localhost:${PORT} (POST /api/nikud → Dicta)`));
