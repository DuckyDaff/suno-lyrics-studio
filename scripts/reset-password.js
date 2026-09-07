#!/usr/bin/env node
// Reset a MeloDraft user's password directly in Upstash Redis.
//
// Usage (from the project root):
//   npx vercel env pull .env.local --environment=production
//   node scripts/reset-password.js <username> "<new password>"
//
// Password rules (same as /api/auth register): ≥6 chars, one uppercase letter, one symbol.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const [,, username, password] = process.argv;
if (!username || !password) {
  console.error('usage: node scripts/reset-password.js <username> "<new password>"');
  process.exit(1);
}
if (password.length < 6 || !/[A-Z]/.test(password) || !/[^a-zA-Z0-9֐-׿]/.test(password)) {
  console.error('password must be ≥6 chars and contain an uppercase letter and a symbol');
  process.exit(1);
}

// load .env.local (written by `vercel env pull`) without printing anything
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
const url = process.env.UPSTASH_REDIS_REST_URL;
const tok = process.env.UPSTASH_REDIS_REST_TOKEN;
if (!url || !tok) {
  console.error('UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — run: npx vercel env pull .env.local --environment=production');
  process.exit(1);
}

async function kv(cmd, ...args) {
  const r = await fetch(`${url}/${[cmd, ...args].map(encodeURIComponent).join('/')}`, {
    headers: { Authorization: `Bearer ${tok}` },
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

function hashPwd(pwd) {
  return new Promise((res, rej) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(pwd, salt, 64, (e, dk) => (e ? rej(e) : res(`${salt}:${dk.toString('hex')}`)));
  });
}

(async () => {
  const key = `user:${username.toLowerCase()}`;
  const raw = await kv('GET', key);
  if (!raw) {
    const keys = await kv('KEYS', 'user:*');
    console.error(`user "${username}" not found. existing users: ${keys.map(k => k.slice(5)).join(', ')}`);
    process.exit(1);
  }
  const user = JSON.parse(raw);
  user.passwordHash = await hashPwd(password);
  await kv('SET', key, JSON.stringify(user));
  console.log(`password for "${user.username}" (${user.role}) updated.`);
})().catch(e => { console.error(e.message); process.exit(1); });
