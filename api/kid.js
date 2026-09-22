// api/kid.js — "Gala mode": a child composes song ideas on an iPad (picture cards, voice takes,
// drawings, photos); the parent sees them in the app and turns them into songs.
//
//   POST ?action=link                       parent → { token, url }   (kid token, 2 years)
//   GET  ?action=list                       parent: all ideas · kid: own ideas (not deleted)
//   POST ?action=idea   {idea}              kid/parent: upsert an idea
//   POST ?action=upload {name,type,data}    kid/parent: base64 → private blob → { path }
//   GET  ?action=file&p=<path>&t=<token>    kid/parent: stream a blob (audio/img src)
//   POST ?action=delete-file {path}         kid/parent: delete a blob
//   POST ?action=status {id,status}         parent: new | used | archived | deleted
//   POST ?action=transcribe {path}          parent: audio → text (needs OPENAI_API_KEY)
//   POST ?action=describe   {path}          parent: drawing/photo → Hebrew description (Claude)
//   POST ?action=song   {id,songUrl,title}  parent: attach the finished song for the kid
const crypto = require('crypto');
const { put, get, del } = require('@vercel/blob');

const b64url = buf => (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
const secret = () => process.env.JWT_SECRET || 'change-me';
function signToken(payload) {
  const h = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64url(JSON.stringify(payload));
  return `${h}.${p}.${b64url(crypto.createHmac('sha256', secret()).update(`${h}.${p}`).digest())}`;
}
function verifyToken(token) {
  const parts = (token || '').split('.');
  if (parts.length !== 3) throw new Error('malformed');
  const [h, p, s] = parts;
  const expected = b64url(crypto.createHmac('sha256', secret()).update(`${h}.${p}`).digest());
  if (s.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expected))) throw new Error('invalid');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('expired');
  return payload;
}
async function kv(...cmd) {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/[/]+$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !tok) throw new Error('no_store');
  const r = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}

const MAX_UPLOAD = 30 * 1024 * 1024;   // 30 MB (a 3-minute m4a is ~1.5 MB; a Suno MP3 4–8 MB)
const ALLOWED = { 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/wav': 'wav', 'audio/mpeg': 'mp3', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const SAFE_ID = /^[A-Za-z0-9_-]{4,40}$/;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const json = (status, obj) => { res.setHeader('Content-Type', 'application/json'); res.status(status).end(JSON.stringify(obj)); };
  const q = req.query || {};
  const action = q.action;

  // auth: Bearer header, or ?t= for media <src> URLs
  let who;
  try { who = verifyToken((req.headers.authorization || '').replace(/^Bearer\s+/i, '') || q.t); }
  catch { return json(401, { ok: false, error: 'unauthorized' }); }
  const isKid = who.role === 'kid';
  const owner = String(isKid ? who.owner : who.username).toLowerCase();   // the parent account
  if (!owner) return json(401, { ok: false, error: 'unauthorized' });
  const key = `kid:${owner}`;
  const prefix = `kid/${owner}/`;
  const parentOnly = () => { if (isKid) { json(403, { ok: false, error: 'forbidden' }); return true; } return false; };

  try {
    if (action === 'tts' && req.method === 'GET') {
      // natural voice for the kid app (kid or parent token); cached per phrase
      const { ttsBuffer } = require('./_tts.js');
      const text = String(q.text || '');
      if (!text.trim()) return json(400, { ok: false, error: 'empty' });
      try {
        const { buf, cached } = await ttsBuffer(text, String(q.v || 'nova'));
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', String(buf.length));
        res.setHeader('Cache-Control', 'private, max-age=31536000, immutable');
        res.setHeader('X-TTS-Cache', cached ? 'hit' : 'miss');
        return res.status(200).end(buf);
      } catch (e) {
        console.error('tts:', e && e.message);
        return json(502, { ok: false, error: 'tts_failed', detail: String(e && e.message || '').slice(0, 200) });
      }
    }

    if (action === 'link' && req.method === 'POST') {
      if (parentOnly()) return;
      const name = String((req.body && req.body.name) || 'גאלה').slice(0, 40);
      const token = signToken({ role: 'kid', owner, name, exp: Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 3600 });
      return json(200, { ok: true, token, name });
    }

    if (action === 'list' && req.method === 'GET') {
      const h = await kv('HGETALL', key);
      const ideas = [];
      for (let i = 0; i + 1 < (h || []).length; i += 2) { try { ideas.push(JSON.parse(h[i + 1])); } catch {} }
      const out = ideas.filter(x => x.status !== 'deleted' && (!isKid || x.status !== 'archived' || x.songPath || x.songUrl))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      return json(200, { ok: true, ideas: isKid ? out.map(x => ({ ...x, transcript: undefined, description: undefined })) : out });
    }

    if (action === 'idea' && req.method === 'POST') {
      const idea = req.body && req.body.idea;
      if (!idea || !SAFE_ID.test(String(idea.id || ''))) return json(400, { ok: false, error: 'bad_idea' });
      const existing = await kv('HGET', key, idea.id);
      let prev = null; try { prev = existing ? JSON.parse(existing) : null; } catch {}
      // the kid may only touch her own side of an idea: never overwrite parent fields
      const merged = { ...(prev || { createdAt: Date.now(), status: 'new' }), ...idea, updatedAt: Date.now() };
      if (isKid && prev) { for (const k of ['status', 'transcript', 'description', 'songUrl', 'songTitle', 'note']) if (prev[k] !== undefined) merged[k] = prev[k]; }
      if (isKid) merged.by = who.name || 'kid';
      const raw = JSON.stringify(merged);
      if (Buffer.byteLength(raw) > 200 * 1024) return json(413, { ok: false, error: 'too_large' });
      await kv('HSET', key, idea.id, raw);
      return json(200, { ok: true, idea: merged });
    }

    if (action === 'upload' && req.method === 'POST') {
      const { type, data, kind } = req.body || {};
      const ext = ALLOWED[type];
      if (!ext || typeof data !== 'string') return json(400, { ok: false, error: 'bad_file' });
      const buf = Buffer.from(data, 'base64');
      if (!buf.length || buf.length > MAX_UPLOAD) return json(413, { ok: false, error: 'too_large' });
      if ((kind === 'song' || kind === 'cover') && isKid) return json(403, { ok: false, error: 'forbidden' });
      const path = `${prefix}${kind === 'img' ? 'img' : kind === 'song' ? 'songs' : kind === 'cover' ? 'covers' : 'audio'}/${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
      const r = await put(path, buf, { access: 'private', contentType: type, addRandomSuffix: false });
      return json(200, { ok: true, path: r.pathname, size: buf.length });
    }

    if (action === 'file' && req.method === 'GET') {
      const p = String(q.p || '');
      if (!p.startsWith(prefix)) return json(403, { ok: false, error: 'forbidden' });
      const r = await get(p, { access: 'private' });
      if (!r || r.statusCode !== 200 || !r.stream) return json(404, { ok: false, error: 'not_found' });
      // buffer the whole file (they are small) so Safari's Range requests for <audio> work
      const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
      res.setHeader('Content-Type', r.blob.contentType || 'application/octet-stream');
      res.setHeader('Cache-Control', 'private, max-age=3600');
      res.setHeader('Accept-Ranges', 'bytes');
      const range = String(req.headers.range || '').match(/^bytes=(\d*)-(\d*)$/);
      if (range && buf.length) {
        const start = range[1] ? parseInt(range[1], 10) : 0;
        const end = range[2] ? Math.min(parseInt(range[2], 10), buf.length - 1) : buf.length - 1;
        if (start >= buf.length || start > end) { res.setHeader('Content-Range', `bytes */${buf.length}`); return res.status(416).end(); }
        res.setHeader('Content-Range', `bytes ${start}-${end}/${buf.length}`);
        res.setHeader('Content-Length', String(end - start + 1));
        return res.status(206).end(buf.subarray(start, end + 1));
      }
      res.setHeader('Content-Length', String(buf.length));
      return res.status(200).end(buf);
    }

    if (action === 'delete-file' && req.method === 'POST') {
      const p = String((req.body && req.body.path) || '');
      if (!p.startsWith(prefix)) return json(403, { ok: false, error: 'forbidden' });
      try { await del(p); } catch {}
      return json(200, { ok: true });
    }

    if (action === 'status' && req.method === 'POST') {
      if (parentOnly()) return;
      const { id, status, note } = req.body || {};
      if (!SAFE_ID.test(String(id || ''))) return json(400, { ok: false, error: 'bad_id' });
      const existing = await kv('HGET', key, id);
      if (!existing) return json(404, { ok: false, error: 'not_found' });
      const idea = JSON.parse(existing);
      if (status === 'deleted') {
        const paths = [...(idea.takes || []).map(t => t.path), idea.drawing, idea.photo, idea.songPath].filter(Boolean);
        for (const p of paths) { try { await del(p); } catch {} }
        await kv('HDEL', key, id);
        return json(200, { ok: true });
      }
      if (status) idea.status = ['new', 'used', 'archived'].includes(status) ? status : idea.status;
      if (note !== undefined) idea.note = String(note).slice(0, 2000);
      idea.updatedAt = Date.now();
      await kv('HSET', key, id, JSON.stringify(idea));
      return json(200, { ok: true, idea });
    }

    if (action === 'song' && req.method === 'POST') {
      if (parentOnly()) return;
      const { id, songUrl, songPath, title } = req.body || {};
      if (!SAFE_ID.test(String(id || ''))) return json(400, { ok: false, error: 'bad_id' });
      const existing = await kv('HGET', key, id);
      if (!existing) return json(404, { ok: false, error: 'not_found' });
      const idea = JSON.parse(existing);
      if (songPath !== undefined) {
        const p = String(songPath || '');
        if (p && !p.startsWith(prefix + 'songs/')) return json(403, { ok: false, error: 'forbidden' });
        if (idea.songPath && idea.songPath !== p) { try { await del(idea.songPath); } catch {} }
        idea.songPath = p;
      }
      if (songUrl !== undefined) idea.songUrl = String(songUrl || '').slice(0, 500);
      idea.songTitle = String(title || idea.songTitle || '').slice(0, 120);
      idea.songAt = Date.now(); idea.status = 'used'; idea.updatedAt = Date.now();
      await kv('HSET', key, id, JSON.stringify(idea));
      return json(200, { ok: true, idea });
    }

    if (action === 'transcribe' && req.method === 'POST') {
      if (parentOnly()) return;
      const p = String((req.body && req.body.path) || '');
      if (!p.startsWith(prefix)) return json(403, { ok: false, error: 'forbidden' });
      const r = await get(p, { access: 'private' });
      if (!r || r.statusCode !== 200) return json(404, { ok: false, error: 'not_found' });
      const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
      const ctype = r.blob.contentType || 'audio/mp4';
      // 1) Vercel AI Gateway (billed to the Vercel account; OIDC on Vercel, or AI_GATEWAY_API_KEY)
      const viaGateway = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN || process.env.VERCEL;
      if (viaGateway && !process.env.STT_FORCE_OPENAI) {
        try {
          const { experimental_transcribe } = await import('ai');
          const { gateway } = await import('@ai-sdk/gateway');
          const out = await experimental_transcribe({
            model: gateway.transcriptionModel(process.env.STT_MODEL || 'openai/whisper-1'),
            audio: buf, mediaType: ctype,
            providerOptions: { openai: { language: 'he', prompt: 'ילדה בת שבע מספרת רעיון לשיר בעברית, בקול חופשי.' } },
          });
          return json(200, { ok: true, text: String(out.text || '').trim(), via: 'gateway', seconds: out.durationInSeconds });
        } catch (e) {
          console.error('stt gateway:', e && e.name, e && e.message && e.message.slice(0, 300));
          if (!process.env.OPENAI_API_KEY) return json(502, { ok: false, error: e && /auth|credit|402|401/i.test(e.message || '') ? 'stt_gateway_auth' : 'stt_failed', detail: String(e && e.message || '').slice(0, 200) });
        }
      }
      // 2) direct OpenAI key
      if (!process.env.OPENAI_API_KEY) return json(503, { ok: false, error: 'no_stt' });
      const fd = new FormData();
      fd.append('file', new Blob([buf], { type: ctype }), 'take.' + (ALLOWED[ctype] || 'm4a'));
      fd.append('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe');
      fd.append('language', 'he');
      fd.append('prompt', 'ילדה בת שבע מספרת רעיון לשיר בעברית, בקול חופשי.');
      const o = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: fd });
      const j = await o.json().catch(() => ({}));
      if (!o.ok) { console.error('stt:', o.status, JSON.stringify(j).slice(0, 300)); return json(502, { ok: false, error: 'stt_failed', detail: (j.error && j.error.message) || o.status }); }
      return json(200, { ok: true, text: String(j.text || '').trim(), via: 'openai' });
    }

    if (action === 'describe' && req.method === 'POST') {
      if (parentOnly()) return;
      if (!process.env.ANTHROPIC_API_KEY) return json(503, { ok: false, error: 'no_api_key' });
      const p = String((req.body && req.body.path) || '');
      if (!p.startsWith(prefix)) return json(403, { ok: false, error: 'forbidden' });
      const r = await get(p, { access: 'private' });
      if (!r || r.statusCode !== 200) return json(404, { ok: false, error: 'not_found' });
      const buf = Buffer.from(await new Response(r.stream).arrayBuffer());
      const media_type = r.blob.contentType && r.blob.contentType.startsWith('image/') ? r.blob.contentType : 'image/png';
      const Anthropic = require('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const kind = req.body.kind === 'photo' ? 'photo' : 'drawing';
      const msg = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL_FAST || 'claude-sonnet-5', max_tokens: 600, thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: [
          { type: 'image', source: { type: 'base64', media_type, data: buf.toString('base64') } },
          { type: 'text', text: kind === 'drawing'
            ? 'זהו ציור של ילדה בת שבע שמתארת רעיון לשיר. תאר בעברית, ב-3-5 משפטים קצרים, מה מצויר: דמויות, מקום, מה קורה, צבעים ומצב רוח. אל תשפוט את איכות הציור. סיים במשפט אחד שמתחיל ב"רעיון לשיר:" שמסכם את הרעיון כמו שילדה הייתה מספרת אותו.'
            : 'זו תמונה שילדה בת שבע צילמה כדי להסביר רעיון לשיר. תאר בעברית, ב-3-5 משפטים קצרים, מה יש בתמונה ומה יכול לעניין ילדה בה. סיים במשפט אחד שמתחיל ב"רעיון לשיר:".' },
        ] }],
      });
      const text = (msg.content || []).filter(c => c.type === 'text').map(c => c.text).join('').trim();
      return json(200, { ok: true, text });
    }

    return json(404, { ok: false, error: 'unknown_action' });
  } catch (e) {
    console.error('kid:', action, e && e.message);
    return json(e.message === 'no_store' ? 503 : 500, { ok: false, error: e.message === 'no_store' ? 'no_store' : 'server', detail: String(e && e.message || '').slice(0, 200) });
  }
};
