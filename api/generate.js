// api/generate.js — AI lyrics / style generation for Suno, streamed as NDJSON.
// POST { mode, model?, ...fields }  → lines of {"t":"…"} then {"done":true,…}
const crypto = require('crypto');
const sdk = require('@anthropic-ai/sdk');
const Anthropic = sdk.Anthropic || sdk.default || sdk;

/* ── auth (same JWT scheme as api/auth.js) ─────────────────────────────── */
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

/* ── per-user daily rate limit (Upstash REST) ──────────────────────────── */
async function kv(cmd, ...args) {
  const url = (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/[/]+$/, '');
  const tok = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !tok) return null;                         // no store → no limit
  const r = await fetch(`${url}/${[cmd, ...args].map(encodeURIComponent).join('/')}`, { headers: { Authorization: `Bearer ${tok}` } });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
async function checkLimit(username) {
  const limit = parseInt(process.env.GEN_DAILY_LIMIT || '150', 10);
  const key = `gen:${username.toLowerCase()}:${new Date().toISOString().slice(0, 10)}`;
  const n = await kv('INCR', key);
  if (n === null) return { ok: true };
  if (n === 1) await kv('EXPIRE', key, 90000);
  return { ok: n <= limit, used: n, limit };
}

/* ── models ────────────────────────────────────────────────────────────── */
const MODELS = {
  quality: process.env.ANTHROPIC_MODEL_QUALITY || 'claude-opus-5',
  fast:    process.env.ANTHROPIC_MODEL_FAST    || 'claude-sonnet-5',
};

/* ── frozen system prompt (keep static so prompt caching can apply) ─────── */
const SYSTEM = `You are MeloDraft's songwriter: a world-class lyricist who writes for Suno AI music generation. You write in Hebrew and English (and other languages when asked) at the level of a professional songwriter, rapper, librettist and poet.

OUTPUT RULES (strict):
- Output ONLY the requested text. No explanations, no preamble, no markdown, no code fences, no notes.
- Use Suno formatting: section tags in square brackets on their own line, e.g. [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus], [Outro]. Tag names in English even when lyrics are Hebrew.
- Backing vocals, ad-libs and crowd parts go in parentheses on their own line or inline: (oh-oh), (yeah), (choir: ...). Use them sparingly and musically.
- One lyric line per text line. Blank line between sections. No line numbers, no bullet points.
- Never write a title line unless a title is explicitly requested.
- Respect the requested language exactly. Hebrew must be natural, modern and singable — not translated-sounding. Gender agreement must be consistent with the persona/speaker.
- Keep lines singable: roughly 5–12 syllables, natural stress. Prefer open vowels at line ends in Hebrew (ah/oh/ee) when the style is melodic.
- Rhyme with intent: when a rhyme scheme is given, follow it; otherwise use a musical scheme suited to the form. Avoid forced or cliché rhymes (אהבה/תקווה, love/above) unless the form is deliberately naive.
- Chorus must be memorable, repeatable and rhythmically identical across repeats. Verses develop the story; the bridge shifts perspective or intensity.
- Stay within the character limit given. Count spaces and tags.

FORM GUIDES:
- Pop/ballad: clear hook, concrete images, emotional arc, chorus repeats verbatim.
- Rap/hip-hop/trap/drill: write in bars (4 or 8 per stanza), internal and multi-syllable rhymes, wordplay, punchlines, a chantable hook; mark [Verse] / [Hook]; delivery cues like [Rapped] or (ad-lib) are welcome. Hebrew rap should use street-level modern Hebrew, not literary.
- Opera/operetta: [Recitative] and [Aria] sections, heightened diction, long vowels for sustained notes, a dramatic climax; Italian or Hebrew as requested.
- Musical theatre: character voice, storytelling verses, a "want" song structure, spoken interjections allowed [Spoken].
- Children's songs: simple words, repetition, playful sounds, a call-and-response chorus, nothing scary.
- Mizrahi / Mediterranean: emotional, direct address to the beloved, melisma-friendly vowels, refrain with a hook word repeated.
- Piyyut / religious / Hasidic: reverent register, biblical or liturgical echoes, refrain; can quote or paraphrase scripture appropriately.
- Metal/punk: aggressive imagery, short punchy lines, shouted gang lines in parentheses.
- Jazz/blues: conversational, AAB blues form when blues, wit and melancholy.
- Spoken word / poem: no forced rhyme, rhythm from breath, strong images, mark [Spoken word].
- Parody / comedy: real jokes with setups and punchlines, rhythm serves the punchline.

When asked for a single section or an edit, return only the new text for that section — no section tag unless explicitly requested — and preserve the established characters, tense, imagery and rhyme scheme of the song.`;

/* ── request → user message ────────────────────────────────────────────── */
const clean = (s, max = 4000) => String(s ?? '').replace(/\s+$/, '').slice(0, max);

function songContext(b) {
  const lines = [];
  if (b.title) lines.push(`Song title: ${clean(b.title, 200)}`);
  if (b.style) lines.push(`Suno style prompt (the music): ${clean(b.style, 1200)}`);
  if (b.lyrics) lines.push(`Current lyrics of the song:\n${clean(b.lyrics, 8000)}`);
  return lines.join('\n');
}

function buildUser(b) {
  const lang = b.language || 'Hebrew';
  const limit = b.limit ? `Character limit for the whole lyrics: ${b.limit}.` : '';
  switch (b.mode) {
    case 'song': {
      const structure = Array.isArray(b.structure) && b.structure.length
        ? `Use exactly this structure, in order: ${b.structure.map(s => `[${s}]`).join(' ')}.`
        : 'Choose the best structure for the form (typically Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Chorus, Bridge, Final Chorus, Outro).';
      return [
        `Write complete song lyrics.`,
        `Idea / brief: ${clean(b.idea, 3000) || '(no brief — invent a compelling one)'}`,
        `Form: ${b.form || 'pop song'}.`,
        `Language: ${lang}.`,
        b.persona ? `Speaker / persona: ${clean(b.persona, 300)}.` : '',
        b.mood ? `Mood: ${clean(b.mood, 200)}.` : '',
        b.rhyme && b.rhyme !== 'auto' ? `Rhyme scheme: ${b.rhyme}.` : '',
        b.length === 'short' ? 'Length: short (about 12–20 lines).' : b.length === 'long' ? 'Length: long (a full 3-verse song).' : 'Length: normal (about 24–36 lines).',
        structure,
        b.style ? `Match the lyrics to this Suno style prompt: ${clean(b.style, 1200)}` : '',
        b.extra ? `Additional instructions: ${clean(b.extra, 1000)}` : '',
        limit,
      ].filter(Boolean).join('\n');
    }
    case 'wild': {
      return [
        `Invent a complete, original, surprising song concept and write it. Be bold and specific — unexpected premise, vivid world, a twist.`,
        b.idea ? `Seed (optional, riff on it freely): ${clean(b.idea, 1000)}` : 'No seed — surprise me.',
        `Language for lyrics: ${lang}.`,
        b.form && b.form !== 'auto' ? `Form: ${b.form}.` : 'Pick whichever form fits the concept best (pop, rap, opera, musical, ballad, mizrahi, punk, children…).',
        `Output format, exactly:`,
        `TITLE: <song title in the lyrics language>`,
        `STYLE: <Suno style prompt in English, comma-separated tags: genre, mood, instruments, vocals, production, BPM — max 900 characters>`,
        `(blank line)`,
        `<full lyrics with Suno section tags>`,
        limit,
      ].filter(Boolean).join('\n');
    }
    case 'style': {
      return [
        `Write a Suno "Style of Music" prompt for this song: comma-separated English tags only (genre, sub-genre, mood, 2–4 instruments, vocal description, production feel, BPM). No sentences, no lyrics.`,
        `Maximum ${b.limit || 900} characters.`,
        `Brief: ${clean(b.idea, 2000) || '(infer from the lyrics)'}`,
        songContext(b),
      ].filter(Boolean).join('\n');
    }
    case 'titles': {
      return [
        `Suggest 8 song titles, one per line, no numbering, no quotes. Language: ${lang}. Mix literal, poetic and hook-based titles.`,
        `Brief: ${clean(b.idea, 2000)}`,
        songContext(b),
      ].filter(Boolean).join('\n');
    }
    case 'section': {
      const ops = {
        write:    `Write the lyrics for the section [${b.section}] from scratch.`,
        continue: `Continue the section [${b.section}] from where it stops — add the next lines, do not repeat existing ones. Return ONLY the new lines.`,
        rewrite:  `Rewrite the section [${b.section}] — same meaning and length, fresher language and stronger images.`,
        rhyme:    `Rewrite the section [${b.section}] keeping the meaning but with a tighter, more musical rhyme scheme and better line endings.`,
        shorter:  `Shorten the section [${b.section}] to about half its lines, keeping the strongest ones.`,
        longer:   `Extend the section [${b.section}] to about double its lines, developing the same idea.`,
        rap:      `Turn the section [${b.section}] into rap bars: same content, 8 bars, internal rhymes, punchlines, rhythmic flow.`,
        translate:`Translate the section [${b.section}] into ${b.targetLanguage || (lang === 'Hebrew' ? 'English' : 'Hebrew')} as singable lyrics (adapt rhyme and syllable count, do not translate literally).`,
        backing:  `Add backing vocals / ad-libs to the section [${b.section}] in parentheses at the musically right spots. Return the full section with the additions.`,
        polish:   `Polish the section [${b.section}]: fix awkward phrasing, meter and rhyme; keep the meaning and line count.`,
      };
      return [
        ops[b.op] || ops.rewrite,
        `Language: ${lang}.`,
        b.section_text ? `Current text of [${b.section}]:\n${clean(b.section_text, 3000)}` : `The section is currently empty.`,
        b.idea ? `Guidance: ${clean(b.idea, 1000)}` : '',
        songContext({ ...b, lyrics: b.lyrics }),
        `Return only the section text (no tag).`,
      ].filter(Boolean).join('\n');
    }
    default:
      throw Object.assign(new Error('unknown mode'), { status: 400 });
  }
}

/* ── handler ───────────────────────────────────────────────────────────── */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  const json = (status, obj) => { res.setHeader('Content-Type', 'application/json'); res.status(status).end(JSON.stringify(obj)); };

  if (req.method === 'GET' && (req.query || {}).action === 'health') {
    return json(200, { ok: true, hasKey: !!process.env.ANTHROPIC_API_KEY, models: MODELS });
  }
  if (req.method !== 'POST') return json(405, { ok: false, error: 'method' });

  let user;
  try {
    const auth = req.headers.authorization || '';
    user = verifyToken(auth.replace(/^Bearer\s+/i, '') || (req.body || {}).token);
  } catch (e) { return json(401, { ok: false, error: 'unauthorized' }); }

  if (!process.env.ANTHROPIC_API_KEY) return json(503, { ok: false, error: 'no_api_key' });

  const body = req.body || {};
  let userMsg;
  try { userMsg = buildUser(body); } catch (e) { return json(e.status || 400, { ok: false, error: e.message }); }

  try {
    const lim = await checkLimit(user.username || 'anon');
    if (!lim.ok) return json(429, { ok: false, error: 'daily_limit', used: lim.used, limit: lim.limit });
  } catch (e) { /* store hiccup → don't block generation */ }

  const model = body.model === 'fast' ? MODELS.fast : MODELS.quality;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.status(200);
  if (typeof res.flushHeaders === 'function') res.flushHeaders();
  const send = obj => res.write(JSON.stringify(obj) + '\n');

  try {
    const stream = client.messages.stream({
      model,
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: { effort: body.mode === 'wild' ? 'high' : 'medium' },
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    });
    stream.on('text', delta => send({ t: delta }));
    const final = await stream.finalMessage();
    send({ done: true, model, stop: final.stop_reason, usage: {
      in: final.usage.input_tokens, out: final.usage.output_tokens,
      cacheRead: final.usage.cache_read_input_tokens || 0, cacheWrite: final.usage.cache_creation_input_tokens || 0,
    } });
  } catch (e) {
    const status = e && e.status;
    const code = status === 401 ? 'bad_api_key' : status === 429 ? 'anthropic_rate_limit' : status === 404 ? 'model_not_found' : 'api_error';
    console.error('generate:', code, e && e.message);
    send({ error: code, message: (e && e.message || '').slice(0, 300), model });
  }
  res.end();
};
