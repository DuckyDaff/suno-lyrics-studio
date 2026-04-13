// api/auth.js — JWT auth with Upstash Redis (no npm deps, only Node built-ins + fetch)
const crypto = require('crypto');

// ── helpers ────────────────────────────────────────────────────────────────
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
        const a = Buffer.from(dk.toString('hex'));
        const b = Buffer.from(hash);
        res(a.length === b.length && crypto.timingSafeEqual(a, b));
      } catch { res(false); }
    });
  });
}

// ── Upstash Redis REST (GET/SET only) ──────────────────────────────────────
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

// ── main handler ───────────────────────────────────────────────────────────
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
    const token = body.token || query.token;
    try {
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
      const raw = await kv('GET', `user:${username.toLowerCase()}`);
      if (!raw) return res.status(401).json({ ok: false, error: 'שם משתמש או סיסמה שגויים' });
      const user = JSON.parse(raw);
      const ok = await checkPwd(password, user.passwordHash);
      if (!ok) return res.status(401).json({ ok: false, error: 'שם משתמש או סיסמה שגויים' });
      const isAdmin = user.role === 'admin';
      const token = signToken({
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now()/1000),
        ...(!isAdmin ? { exp: Math.floor(Date.now()/1000) + 30*24*60*60 } : {})
      });
      return res.json({ ok: true, token, username: user.username, role: user.role });
    } catch (e) {
      console.error('login error', e);
      return res.status(500).json({ ok: false, error: 'שגיאת שרת' });
    }
  }

  // ── register ──────────────────────────────────────────────────
  if (action === 'register') {
    const { username, password } = body;
    if (!username || !password)
      return res.status(400).json({ ok: false, error: 'חסרים שם משתמש או סיסמה' });
    if (username.length < 3)
      return res.status(400).json({ ok: false, error: 'שם משתמש קצר מדי (מינימום 3 תווים)' });
    if (password.length < 6)
      return res.status(400).json({ ok: false, error: 'סיסמה קצרה מדי (מינימום 6 תווים)' });
    if (!/^[a-zA-Z0-9_\u0590-\u05FF]+$/.test(username))
      return res.status(400).json({ ok: false, error: 'שם משתמש: רק אותיות, ספרות או קו תחתי' });

    const adminUsername = (process.env.ADMIN_USERNAME || '').toLowerCase();
    const isAdmin = adminUsername && username.toLowerCase() === adminUsername;

    try {
      // Block duplicate usernames
      const existing = await kv('GET', `user:${username.toLowerCase()}`);
      if (existing) return res.status(409).json({ ok: false, error: 'שם המשתמש תפוס' });

      // Non-admin can only register after admin exists AND open registration is on
      if (!isAdmin) {
        const adminCreated = await kv('GET', 'system:admin_created');
        if (!adminCreated)
          return res.status(403).json({ ok: false, error: 'יש ליצור חשבון אדמין תחילה' });
        const openReg = await kv('GET', 'system:open_registration');
        if (openReg !== '1')
          return res.status(403).json({ ok: false, error: 'ההרשמה סגורה. פנה למנהל.' });
      }

      const passwordHash = await hashPwd(password);
      const user = { username, passwordHash, role: isAdmin ? 'admin' : 'user', createdAt: Date.now() };
      await kv('SET', `user:${username.toLowerCase()}`, JSON.stringify(user));
      if (isAdmin) await kv('SET', 'system:admin_created', '1');

      const token = signToken({
        username,
        role: user.role,
        iat: Math.floor(Date.now()/1000),
        ...(user.role !== 'admin' ? { exp: Math.floor(Date.now()/1000) + 30*24*60*60 } : {})
      });
      return res.json({ ok: true, token, username, role: user.role });
    } catch (e) {
      console.error('register error', e);
      return res.status(500).json({ ok: false, error: 'שגיאת שרת: ' + e.message });
    }
  }

  return res.status(400).json({ ok: false, error: 'פעולה לא מוכרת' });
};
