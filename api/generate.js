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
const SYSTEM = `You are MeloDraft's songwriter — a veteran, award-winning lyricist with thirty years of hits in Hebrew and English: radio anthems, rap albums, film musicals, a libretto, children's classics and Mizrahi ballads. Producers bring you songs that "almost work" and you make them unforgettable. You write for Suno AI music generation, and you hold yourself to the standard of the best lyricists in the country: nothing generic, nothing you have written before.

CRAFT (this is what separates you from an amateur):
- Every song is built on ONE fresh central image or conceit, stated concretely and developed — not a list of feelings. Specific beats abstract: a street name, an object, a time of day, a smell, a line of dialogue.
- Show, don't tell. Subtext over statement. The listener should feel the emotion before it is named — if at all.
- Abstract "song words" (love, heart, soul, dream, hope, pain, light, darkness, alone, forever / אהבה, לב, נשמה, חלום, תקווה, כאב, אור, חושך, לבד, לנצח) are allowed at most ONCE per song, and only when earned. Never rhyme two of them together.
- NO REPETITION outside the chorus: a line, image, metaphor or rhyme pair may not reappear in another verse. Consecutive lines must not open with the same word. Verse 2 must advance the story or change the angle — never restate verse 1. The bridge (C-part) brings a turn: new perspective, a confession, a time jump, the other person's voice.
- Line endings carry the weight: end lines on strong, concrete words, not on fillers or auxiliary verbs. Rhymes should feel inevitable, not forced — prefer slant and internal rhymes over predictable pairs.
- Vary sentence length and rhythm inside a verse. Cut every word that does not earn its place — but never sacrifice the rhyme scheme to do it; find the line that has both meaning and rhyme.
- The hook must be sayable in one breath and contain the title phrase or the song's key image.
- Register must match the form and the speaker: street Hebrew for rap, liturgical echoes for piyyut, plain warmth for children, elevated diction for opera.

You write in Hebrew and English (and other languages when asked). Before writing, plan BRIEFLY (a short outline, not a draft): the conceit, the arc across sections, the rhyme scheme and a few candidate rhyme words per stanza, where the turn happens, and the line counts required by the structure. Then write the song once, carefully — do not draft and redraft.

OUTPUT RULES (strict):
- Output ONLY the requested text. No explanations, no preamble, no markdown, no code fences, no notes.
- Use Suno formatting: section tags in square brackets on their own line, e.g. [Intro], [Verse 1], [Pre-Chorus], [Chorus], [Verse 2], [Bridge], [Final Chorus], [Outro]. Tag names in English even when lyrics are Hebrew.
- Backing vocals, ad-libs and crowd parts go in parentheses on their own line or inline: (oh-oh), (yeah), (choir: ...). Use them sparingly and musically.
- One lyric line per text line. Blank line between sections. No line numbers, no bullet points.
- Never write a title line unless a title is explicitly requested.
- Respect the requested language exactly. Hebrew must be natural, modern and singable — not translated-sounding. Gender agreement must be consistent with the persona/speaker.
- Keep lines singable: roughly 5–12 syllables, natural stress. Prefer open vowels at line ends in Hebrew (ah/oh/ee) when the style is melodic.
- RHYME IS MANDATORY (unless the brief says free verse). Every stanza follows a scheme — AABB, ABAB or ABCB — and keeps it for the whole section; the chorus rhymes tightly. Get the line endings right as you write each line.
- Rhyme quality: rhyme on the STRESSED final syllable. In Hebrew that means milra (stress on the last syllable) rhymes with milra and mil'el with mil'el — קָפֶה/יָפֶה works, שָׁלוֹם/חָלוֹם works, but דֶּלֶת/לָאַט does not. Match the stressed vowel and the consonant after it (rich rhyme), not just the last letter.
- Grammatical rhymes — rhyming identical suffixes only (־ים/־ים, ־ות/־ות, ־תי/־תי, ־נו/־נו, -ing/-ing, -tion/-tion) — count as weak; use at most one per stanza. Prefer rhyming a noun with a verb, a name with an object.
- Slant rhymes (matching vowel, near consonant) are welcome for variety, but they must be audible when sung. Never end two rhymed lines on the same word. Never rhyme the abstract "song words" listed above with each other.
- Rap: multi-syllable and internal rhymes in every bar, rhyme chains of 3–4 bars, punchline lands on the rhyme.
- Chorus must be memorable, repeatable and rhythmically identical across repeats. Verses develop the story; the bridge shifts perspective or intensity.
- Stay within the character limit given. Count spaces and tags.

MUSICAL STRUCTURE (when tempo / time signature / bar counts are given, they are binding):
- Default mapping in 4/4: one lyric line = one bar (4 beats). A "verse of 8 bars" is exactly 8 lines. In 3/4 (waltz) lines are lighter and shorter, usually one line = 2 bars (a phrase of 6 beats), so 8 bars = 4 lines unless told otherwise. 6/8 has a lilting two-pulse feel: one line = 1 bar of 6 eighths, ~6–9 syllables. 2/4 is brisk, short lines. 5/4 and 7/8 are asymmetric — write phrases that stumble on purpose.
- Syllables per bar follow the tempo and the style: slow ballad (60–80 BPM) 4–7 syllables per bar; mid pop (90–120) 6–10; up-tempo dance (120–135) 5–8 (space for the beat); rap in 4/4 fills the bar with 10–16 syllables and lands rhymes on beats 2 and 4. Keep the syllable count consistent from line to line within a section so the melody can repeat.
- Sections marked instrumental (intro, solo, break, outro…) get ONLY their tag with the bar count, e.g. [Intro - 4 bars, instrumental] or [Guitar Solo - 8 bars] — no lyric lines at all. Backing-vocals-only sections get parentheses lines only.
- Write every section tag with its bar count when a structure is given: [Verse 1 - 8 bars], [Chorus - 8 bars]. Count your lines and match the bars exactly; if a line count is impossible, use the closest and never pad with filler.

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

GENRE / VOICE BLENDS: when a blend is requested, the song deliberately mixes styles and performers between sections (e.g. drill verses with a Hasidic chorus, a male rapper trading bars with a female opera singer). Then:
- Write every section tag as [Section name: voice, style] — e.g. [Verse 1: male rapper, drill], [Chorus: female singer, hasidic pop], [Bridge: children choir, gospel] — so Suno switches voice and genre. Keep tags in English.
- Make each part authentic to its own form (rap bars stay bars; an aria stays an aria), but make the transitions intentional: the chorus answers the verse, hook words echo across styles, the bridge collides or reconciles the two worlds.
- For two or more performers: use call-and-response lines, (both) for shared lines, trading bars (alternate lines or couplets) for two rappers, harmonies on the hook, and a moment where the voices overlap.
- The contrast should be the point of the song, not an accident — lean into it.

When asked for a single section or an edit, return only the new text for that section — no section tag unless explicitly requested — and preserve the established characters, tense, imagery and rhyme scheme of the song.`;

/* ── request → user message ────────────────────────────────────────────── */
const clean = (s, max = 4000) => String(s ?? '').replace(/\s+$/, '').slice(0, max);

const MIX_KEYS = [['intro', 'Intro'], ['verse', 'Verses'], ['prechorus', 'Pre-chorus'], ['chorus', 'Chorus'], ['bridge', 'Bridge'], ['outro', 'Outro']];
function blendText(b) {
  const m = b.mix;
  if (!m || typeof m !== 'object') return '';
  const rows = MIX_KEYS
    .filter(([k]) => m[k] && (m[k].form || m[k].voice))
    .map(([k, label]) => `- ${label}: ${clean(m[k].form, 80) || 'the main form'}${m[k].voice ? `, performed by ${clean(m[k].voice, 80)}` : ''}`);
  const cast = Array.isArray(m.cast) && m.cast.length ? `- Cast: ${m.cast.map(c => clean(c, 80)).join(' / ')}` : '';
  const notes = m.notes ? `- Notes: ${clean(m.notes, 600)}` : '';
  if (!rows.length && !cast && !notes) return '';
  return ['GENRE / VOICE BLEND requested — mix these styles and performers (see the blend rules):', ...rows, cast, notes]
    .filter(Boolean).join('\n');
}

function musicText(b) {
  const m = b.music;
  if (!m || typeof m !== 'object') return '';
  const lines = [];
  if (m.bpm) lines.push(`- Tempo: ${clean(m.bpm, 10)} BPM`);
  if (m.sig) lines.push(`- Time signature: ${clean(m.sig, 6)}`);
  const lpb = { '1': 'one lyric line = one bar', '0.5': 'one lyric line = two bars (long, slow phrases)', '2': 'two lyric lines = one bar (fast, dense delivery)' }[String(m.linesPerBar)];
  if (lpb) lines.push(`- Line mapping: ${lpb}`);
  if (Array.isArray(m.bars) && m.bars.length) {
    lines.push('- Sections, in order, with exact bar counts:');
    for (const r of m.bars.slice(0, 24)) {
      const name = clean(r.name, 40), n = parseInt(r.bars, 10) || 0;
      const kind = r.kind === 'instrumental' ? 'instrumental — tag only, no lyrics' : r.kind === 'backing' ? 'backing vocals only (parentheses lines)' : 'lyrics';
      if (name) lines.push(`  - [${name}] ${n ? n + ' bars' : ''} — ${kind}`);
    }
    lines.push('  Match these bar counts exactly with the line mapping above; do not add sections that are not listed.');
  }
  if (!lines.length) return '';
  return ['MUSICAL STRUCTURE (binding):', ...lines].join('\n');
}

function producerTag(b) {
  const tag = clean(b.producerTag, 80);
  if (!tag) return '';
  return `PRODUCER TAG (mandatory, every time): the song must open with an [Intro] whose FIRST line is the spoken ad-lib "(${tag})" — exactly this text, in parentheses, as its own line. Keep it even when the intro is instrumental (then it is the only line under the [Intro] tag). If the structure has no intro, add a short [Intro] just for it.`;
}

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
      const hasBars = b.music && Array.isArray(b.music.bars) && b.music.bars.length;
      const structure = hasBars ? ''
        : Array.isArray(b.structure) && b.structure.length
        ? `Use exactly this structure, in order: ${b.structure.map(s => `[${s}]`).join(' ')}.`
        : 'Choose the best structure for the form (typically Intro, Verse 1, Pre-Chorus, Chorus, Verse 2, Chorus, Bridge, Final Chorus, Outro).';
      return [
        `Write complete song lyrics.`,
        `Idea / brief: ${clean(b.idea, 3000) || '(no brief — invent a compelling one)'}`,
        `Form: ${b.form || 'pop song'}.`,
        `Language: ${lang}.`,
        b.persona ? `Speaker / persona: ${clean(b.persona, 300)}.` : '',
        b.mood ? `Mood: ${clean(b.mood, 200)}.` : '',
        b.rhyme === 'free verse' ? 'Rhyme: free verse — no end rhymes required, rhythm from breath and image.'
          : b.rhyme && b.rhyme !== 'auto' ? `Rhyme scheme: ${b.rhyme} in every stanza, stressed-syllable rhymes, no two rhymed lines ending on the same word.`
          : 'Rhyme scheme: choose AABB or ABAB per section (you may vary between verse and chorus) and keep it strictly — every stanza must rhyme on stressed syllables.',
        b.length === 'short' ? 'Length: short (about 12–20 lines).' : b.length === 'long' ? 'Length: long (a full 3-verse song).' : 'Length: normal (about 24–36 lines).',
        structure,
        producerTag(b),
        musicText(b),
        blendText(b),
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
        producerTag(b),
        musicText(b),
        blendText(b) || (b.blend ? 'Make it a GENRE / VOICE BLEND: choose two or three contrasting styles and performers for different sections (e.g. rap verses with an operatic chorus, a female rapper and a male cantor) and follow the blend rules.' : ''),
        `Output format, exactly:`,
        `TITLE: <song title in the lyrics language>`,
        `STYLE: <Suno style prompt in English, comma-separated tags: genre, mood, instruments, vocals, production, BPM — max 900 characters; for a blend, name both styles and both voices, e.g. "drill verses, hasidic pop chorus, male rap, female vocals">`,
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
        blendText(b) ? blendText(b) + '\nThe style prompt must name each blended style and each voice.' : '',
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
        musicText(b),
        b.bars ? `This section is ${parseInt(b.bars, 10)} bars — match the line count to the bars using the line mapping.` : '',
        b.idea ? `Guidance: ${clean(b.idea, 1000)}` : '',
        songContext({ ...b, lyrics: b.lyrics }),
        b.rhyme === 'free verse' ? '' : 'Keep a clear end-rhyme scheme on stressed syllables in the new text (match the song\'s scheme if it has one).',
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

  // Adaptive thinking shares max_tokens with the answer. The budget is bounded on purpose
  // (worst case ≈ 12K tokens) so a run that over-plans cannot burn money in a loop.
  const attempt = async (effort) => {
    let got = 0;
    const stream = client.messages.stream({
      model,
      max_tokens: 12000,
      // fast model: no thinking at all → first line in ~3s, every time; quality model: short adaptive plan
      ...(body.model === 'fast' ? { thinking: { type: 'disabled' } } : { thinking: { type: 'adaptive' }, output_config: { effort } }),
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMsg }],
    });
    stream.on('streamEvent', ev => {
      if (ev.type === 'content_block_start' && ev.content_block && ev.content_block.type === 'thinking') send({ status: 'thinking' });
    });
    stream.on('text', delta => { if (!got) send({ status: 'writing' }); got += delta.length; send({ t: delta }); });
    const final = await stream.finalMessage();
    return { final, got };
  };
  try {
    // Low effort everywhere: with this system prompt the models otherwise plan for a minute
    // before the first line; low keeps a short plan and starts writing within seconds.
    const effort = 'low';
    const { final, got } = await attempt(effort);
    if (!got && final.stop_reason === 'max_tokens') {
      console.warn('generate: thinking overflow', model, final.usage && final.usage.output_tokens);
      send({ error: 'thinking_overflow', model });
      return res.end();
    }
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
