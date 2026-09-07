// shared: load .env.local + tiny Upstash REST client (never prints secrets)
const fs = require('fs'), path = require('path');
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const i = line.indexOf('=');
    if (i < 0 || line.startsWith('#')) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
    if (!(k in process.env)) process.env[k] = v;
  }
}
const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/[/]+$/, '');
const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !tok) { console.error('missing KV_REST_API_* / UPSTASH_REDIS_REST_* — run: npx vercel env pull .env.local --environment=production'); process.exit(1); }
module.exports = async function kv(cmd, ...args) {
  const r = await fetch(`${url}/${[cmd, ...args].map(encodeURIComponent).join('/')}`, { headers: { Authorization: `Bearer ${tok}` } });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
};
