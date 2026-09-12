// api/songs.js — per-user song library in Redis (Upstash REST).
//   GET    /api/songs            → { ok, songs: [ {id, ...song, updatedAt, deleted?} ] }
//   PUT    /api/songs  {song}     → upsert (last-writer-wins by updatedAt)
//   DELETE /api/songs?id=…        → tombstone
const crypto = require('crypto');

const b64url = buf => (Buffer.isBuffer(buf) ? buf : Buffer.from(buf))
  .toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
function verifyToken(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed');
  const [h, p, s] = parts;
  const expected = b64url(crypto.createHmac('sha256', process.env.JWT_SECRET || 'change-me').update(`${h}.${p}`).digest());
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) throw new Error('invalid');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('expired');
  return payload;
}

// Upstash REST with the command in the POST body (values can be large)
async function kv(...cmd) {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/[/]+$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !tok) throw new Error('no_store');
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const MAX_SONG_BYTES = 120 * 1024;
const MAX_SONGS = 1000;

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const json = (status, obj) => res.status(status).end(JSON.stringify(obj));

  let user;
  try { user = verifyToken((req.headers.authorization || '').replace(/^Bearer\s+/i, '')); }
  catch { return json(401, { ok: false, error: 'unauthorized' }); }
  const key = `songs:${String(user.username).toLowerCase()}`;

  try {
    if (req.method === 'GET') {
      const h = await kv('HGETALL', key);          // flat [field, value, field, value, …]
      const songs = [];
      for (let i = 0; i + 1 < (h || []).length; i += 2) {
        try { songs.push(JSON.parse(h[i + 1])); } catch {}
      }
      return json(200, { ok: true, songs, ts: Date.now() });
    }

    if (req.method === 'PUT') {
      const s = req.body && req.body.song;
      if (!s || typeof s.id !== 'string' || !/^[A-Za-z0-9_-]{4,40}$/.test(s.id)) return json(400, { ok: false, error: 'bad_song' });
      const raw = JSON.stringify(s);
      if (Buffer.byteLength(raw) > MAX_SONG_BYTES) return json(413, { ok: false, error: 'too_large' });
      const existing = await kv('HGET', key, s.id);
      if (existing) {
        try { const e = JSON.parse(existing); if ((e.updatedAt || 0) > (s.updatedAt || 0)) return json(200, { ok: true, kept: 'remote', song: e }); } catch {}
      } else {
        const n = await kv('HLEN', key);
        if (n >= MAX_SONGS) return json(429, { ok: false, error: 'too_many' });
      }
      await kv('HSET', key, s.id, raw);
      return json(200, { ok: true, kept: 'local' });
    }

    if (req.method === 'DELETE') {
      const id = (req.query || {}).id;
      if (!id) return json(400, { ok: false, error: 'bad_id' });
      const existing = await kv('HGET', key, id);
      let e = {}; try { e = existing ? JSON.parse(existing) : {}; } catch {}
      const tomb = { id, deleted: true, updatedAt: Date.now(), title: e.title || '' };
      await kv('HSET', key, id, JSON.stringify(tomb));
      return json(200, { ok: true });
    }

    return json(405, { ok: false, error: 'method' });
  } catch (e) {
    console.error('songs:', e && e.message);
    return json(e.message === 'no_store' ? 503 : 500, { ok: false, error: e.message === 'no_store' ? 'no_store' : 'server' });
  }
};
