// api/auth.js — auth using Vercel Blob (no external DB needed)
const { put, list } = require('@vercel/blob');
const crypto = require('crypto');

// ── JWT helpers (no npm) ───────────────────────────────────────────────────
const b64url = buf =>
  (Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
    .toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');

const secret = () => process.env.JWT_SECRET || 'change-me';

function signToken(payload) {
  const h = b64url(JSON.stringify({ alg:'HS256', typ:'JWT' }));
  const p = b64url(JSON.stringify(payload));
  const s = b64url(crypto.createHmac('sha256', secret()).update(`${h}.${p}`).digest());
  return `${h}.${p}.${s}`;
}

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

// ── Password hashing (scrypt, no npm) ─────────────────────────────────────
function hashPwd(pwd) {
  return new Promise((res, rej) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(pwd, salt, 64, (e, dk) =>
      e ? rej(e) : res(`${salt}:${dk.toString('hex')}`));
  });
}
function checkPwd(pwd, stored) {
  return new Promise((res, rej) => {
    const [salt, hash] = stored.split(':');
    crypto.scrypt(pwd, salt, 64, (e, dk) => {
      if (e) return rej(e);
      try {
        const a = Buffer.from(dk.toString('hex')), b = Buffer.from(hash);
        res(a.length === b.length && crypto.timingSafeEqual(a, b));
      } catch { res(false); }
    });
  });
}

// ── Vercel Blob helpers ────────────────────────────────────────────────────
const BLOB_OPTS = {
  access: 'public',
  addRandomSuffix: false,
  contentType: 'application/json'
};

async function blobGet(path) {
  const { blobs } = await list({ prefix: path, limit: 5 });
  const match = blobs.find(b => b.pathname === path);
  if (!match) return null;
  const res = await fetch(match.url + '?_t=' + Date.now());
  if (!res.ok) return null;
  return res.json();
}

async function blobPut(path, data) {
  await put(path, JSON.stringify(data), BLOB_OPTS);
}

// user helpers
const userPath    = u => `melodraft/users/${u.toLowerCase()}.json`;
const systemPath  = 'melodraft/system.json';

async function getUser(username)  { return blobGet(userPath(username)); }
async function saveUser(user)     { return blobPut(userPath(user.username), user); }

async function getSys() {
  return (await blobGet(systemPath)) || { admin_created: false, open_registration: false };
}
async function saveSys(cfg) { return blobPut(systemPath, cfg); }

// ── Main handler ───────────────────────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(200).end(); return; }

  const body   = req.body   || {};
  const query  = req.query  || {};
  const action = body.action || query.action;

  // ── verify ────────────────────────────────────────────────────
  if (action === 'verify') {
    try {
      const token = body.token || query.token;
      const payload = verifyToken(token);
      return res.json({ ok: true, user: { username: payload.username, role: payload.role } });
    } catch (e) {
      return res.status(401).json({ ok: false, error: e.message });
    }
  }

  // ── login ─────────────────────────────────────────────────────
  if (action === 'login') {
    const { username, password } = body;
    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'חסרים שם משתמש או סיסמה' });
    try {
      const user = await getUser(username);
      if (!user) return res.status(401).json({ ok: false, error: 'שם משתמש או סיסמה שגויים' });
      const ok = await checkPwd(password, user.passwordHash);
      if (!ok) return res.status(401).json({ ok: false, error: 'שם משתמש או סיסמה שגויים' });
      const isAdmin = user.role === 'admin';
      const token = signToken({
        username: user.username, role: user.role,
        iat: Math.floor(Date.now()/1000),
        ...(!isAdmin ? { exp: Math.floor(Date.now()/1000) + 30*24*60*60 } : {})
      });
      return res.json({ ok: true, token, username: user.username, role: user.role });
    } catch (e) {
      console.error('login:', e);
      return res.status(500).json({ ok: false, error: 'שגיאת שרת' });
    }
  }

  // ── register ──────────────────────────────────────────────────
  if (action === 'register') {
    const { username, password, email } = body;
    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'חסרים שם משתמש או סיסמה' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ ok: false, error: 'כתובת מייל לא תקינה' });
    if (username.length < 3)
      return res.status(400).json({ ok: false, error: 'שם משתמש קצר מדי (מינימום 3 תווים)' });
    if (password.length < 6)
      return res.status(400).json({ ok: false, error: 'סיסמה קצרה מדי (מינימום 6 תווים)' });
    if (!/^[a-zA-Z0-9_\u0590-\u05FF]+$/.test(username))
      return res.status(400).json({ ok: false, error: 'שם משתמש: רק אותיות, ספרות או קו תחתי' });

    const adminUsername = (process.env.ADMIN_USERNAME || '').toLowerCase();
    const isAdmin = adminUsername && username.toLowerCase() === adminUsername;

    try {
      const existing = await getUser(username);
      if (existing) return res.status(409).json({ ok: false, error: 'שם המשתמש תפוס' });

      const sys = await getSys();
      if (!isAdmin) {
        if (!sys.admin_created)
          return res.status(403).json({ ok: false, error: 'יש ליצור חשבון אדמין תחילה' });
        if (!sys.open_registration)
          return res.status(403).json({ ok: false, error: 'ההרשמה סגורה. פנה למנהל.' });
      }

      const passwordHash = await hashPwd(password);
      const user = {
        username,
        passwordHash,
        email: email.toLowerCase().trim(),
        role: isAdmin ? 'admin' : 'user',
        createdAt: Date.now()
      };
      await saveUser(user);
      if (isAdmin) await saveSys({ ...sys, admin_created: true });

      const token = signToken({
        username, role: user.role,
        iat: Math.floor(Date.now()/1000),
        ...(user.role !== 'admin' ? { exp: Math.floor(Date.now()/1000) + 30*24*60*60 } : {})
      });
      return res.json({ ok: true, token, username, role: user.role });
    } catch (e) {
      console.error('register:', e);
      return res.status(500).json({ ok: false, error: 'שגיאת שרת: ' + e.message });
    }
  }

  return res.status(400).json({ ok: false, error: 'פעולה לא מוכרת' });
};
