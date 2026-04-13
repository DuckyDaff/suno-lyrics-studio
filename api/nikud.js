// Vercel serverless function — proxies to Dicta nakdan API
const https = require('https');

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')   { res.status(405).end(); return; }

  const buf = Buffer.from(JSON.stringify(req.body), 'utf8');

  const proxyReq = https.request({
    hostname: 'nakdan-u1-0.loadbalancer.dicta.org.il',
    path: '/api',
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Content-Length': buf.length,
      'User-Agent':    'Mozilla/5.0',
      'Accept':        'application/json',
    }
  }, proxyRes => {
    let data = '';
    proxyRes.on('data', c => data += c);
    proxyRes.on('end', () => {
      res.setHeader('Content-Type', 'application/json');
      res.status(proxyRes.statusCode).end(data);
    });
  });

  proxyReq.on('error', e => res.status(502).json({ error: e.message }));
  proxyReq.write(buf);
  proxyReq.end();
};
