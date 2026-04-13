// api/admin.js — admin user management, backed by Vercel Blob
const { put, list, del } = require('@vercel/blob');
const crypto = require('crypto');

// ── JWT verify (same as auth.js) ───────────────────────────────────────────
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

// ── Blob helpers ───────────────────────────────────────────────────────────
const BLOB_OPTS = { access: 'public', addRandomSuffix: false, contentType: 'application/json' };
const userPath   = u => `melodraft/users/${u.toLowerCase()}.json`;
const systemPath = 'melodraft/system.json';

async function blobGet(path) {
  const { blobs } = await list({ prefix: path, limit: 5 });
  const match = blobs.find(b => b.pathname === path);
  if (!match) return null;
  const res = await fetch(match.url + '?_t=' + Date.now());
  return res.ok ? res.json() : null;
}
async function blobPut(path, data) { await put(path, JSON.stringify(data), BLOB_OPTS); }
async function blobDel(path) {
  const { blobs } = await list({ prefix: path, limit: 5 });
  const match = blobs.find(b => b.pathname === path);
  if (match) await del(match.url);
}

async function getSys() {
  return (await blobGet(systemPath)) || { admin_created: false, open_registration: false };
}
async function saveSys(cfg) { return blobPut(systemPath, cfg); }

async function listUsers() {
  const { blobs } = await list({ prefix: 'melodraft/users/' });
  const all = await Promise.all(
    blobs
      .filter(b => b.pathname.endsWith('.json'))
      .map(async b => {
        const res = await fetch(b.url + '?_t=' + Date.now());
        return res.ok ? res.json() : null;
      })
  );
  return all
    .filter(Boolean)
    .map(u => ({ username: u.username, email: u.email || null, role: u.role, createdAt: u.createdAt }))
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

// ── Handler ────────────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const authHeader = (req.headers.authorization || '').replace('Bearer ', '');
  const token = authHeader || (req.query && req.query.token) || (req.body && req.body.token);
  let payload;
  try { payload = verifyToken(token); }
  catch { return res.status(401).json({ ok: false, error: 'Unauthorized' }); }
  if (payload.role !== 'admin')
    return res.status(403).json({ ok: false, error: 'Admin only' });

  const body   = req.body  || {};
  const query  = req.query || {};
  const action = body.action || query.action;

  if (action === 'users') {
    try { return res.json({ ok: true, users: await listUsers() }); }
    catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
  }

  if (action === 'delete') {
    const { username } = body;
    if (!username) return res.status(400).json({ ok: false, error: 'Missing username' });
    if (username.toLowerCase() === payload.username.toLowerCase())
      return res.status(400).json({ ok: false, error: 'אי אפשר למחוק את עצמך' });
    try {
      await blobDel(userPath(username));
      return res.json({ ok: true });
    } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
  }

  if (action === 'set_registration') {
    try {
      const sys = await getSys();
      await saveSys({ ...sys, open_registration: !!body.open });
      return res.json({ ok: true, open: !!body.open });
    } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
  }

  if (action === 'get_registration') {
    try {
      const sys = await getSys();
      return res.json({ ok: true, open: !!sys.open_registration });
    } catch (e) { return res.status(500).json({ ok: false, error: e.message }); }
  }

  return res.status(400).json({ ok: false, error: 'Unknown action' });
};
