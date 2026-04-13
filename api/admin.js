// api/admin.js — admin-only user management (requires valid admin JWT)
const crypto = require('crypto');

const b64url = buf =>
  (Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
    .toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');

const secret = () => process.env.JWT_SECRET || 'change-me';

function verifyToken(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed');
  const [h, p, s] = parts;
  const expected = b64url(crypto.createHmac('sha256', secret()).update(`${h}.${p}`).digest());
  if (s.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected)))
    throw new Error('invalid signature');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) throw new Error('expired');
  return payload;
}

async function kv(cmd, ...args) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const tok = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url) throw new Error('UPSTASH_REDIS_REST_URL is not set');
  const path = [cmd, ...args].map(encodeURIComponent).join('/');
  const r = await fetch(`${url}/${path}`, {
    headers: { Authorization: `Bearer ${tok}` }
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  // Auth check — token via query or Authorization header
  const authHeader = (req.headers.authorization || '').replace('Bearer ', '');
  const token = authHeader || (req.query && req.query.token) || (req.body && req.body.token);
  let payload;
  try {
    payload = verifyToken(token);
  } catch (e) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({ ok: false, error: 'Admin only' });
  }

  const body   = req.body   || {};
  const query  = req.query  || {};
  const action = body.action || query.action;

  // ── list users ────────────────────────────────────────────────
  if (action === 'users') {
    try {
      const keys = await kv('KEYS', 'user:*');
      if (!keys || keys.length === 0) return res.json({ ok: true, users: [] });
      const users = [];
      for (const key of keys) {
        const raw = await kv('GET', key);
        if (raw) {
          const u = JSON.parse(raw);
          users.push({
            username:  u.username,
            email:     u.email || null,
            role:      u.role,
            createdAt: u.createdAt
          });
        }
      }
      users.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      return res.json({ ok: true, users });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── delete user ───────────────────────────────────────────────
  if (action === 'delete') {
    const { username } = body;
    if (!username) return res.status(400).json({ ok: false, error: 'Missing username' });
    if (username.toLowerCase() === payload.username.toLowerCase())
      return res.status(400).json({ ok: false, error: 'אי אפשר למחוק את עצמך' });
    try {
      await kv('DEL', `user:${username.toLowerCase()}`);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  // ── toggle open registration ──────────────────────────────────
  if (action === 'set_registration') {
    const { open } = body;
    try {
      await kv('SET', 'system:open_registration', open ? '1' : '0');
      return res.json({ ok: true, open });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  if (action === 'get_registration') {
    try {
      const val = await kv('GET', 'system:open_registration');
      return res.json({ ok: true, open: val === '1' });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  }

  return res.status(400).json({ ok: false, error: 'Unknown action' });
};
