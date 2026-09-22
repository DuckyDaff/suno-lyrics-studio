// Shared: natural-voice text-to-speech through Vercel AI Gateway (openai/tts-1-hd), cached forever
// in the private Blob store under tts/<sha1>.mp3 so every phrase is paid for once.
const crypto = require('crypto');
const { put, get } = require('@vercel/blob');

const VOICES = new Set(['nova', 'shimmer', 'coral', 'sage', 'alloy', 'fable', 'echo', 'onyx', 'ash', 'ballad', 'verse']);
const MODEL = process.env.TTS_MODEL || 'openai/tts-1-hd';

function normalize(text) {
  return String(text || '').replace(/[ְ-ׇֽֿׁׂ]/g, '').replace(/\s+/g, ' ').trim().slice(0, 300);
}
function keyFor(text, voice) {
  return 'tts/' + crypto.createHash('sha1').update(`${MODEL}|${voice}|${text}`).digest('hex') + '.mp3';
}

/** returns { buf, cached } */
async function ttsBuffer(rawText, voice = 'nova') {
  const text = normalize(rawText);
  if (!text) throw new Error('empty');
  if (!VOICES.has(voice)) voice = 'nova';
  const path = keyFor(text, voice);
  try {
    const r = await get(path, { access: 'private' });
    if (r && r.statusCode === 200 && r.stream) return { buf: Buffer.from(await new Response(r.stream).arrayBuffer()), cached: true, path };
  } catch {}
  const { experimental_generateSpeech } = await import('ai');
  const { gateway } = await import('@ai-sdk/gateway');
  const r = await experimental_generateSpeech({
    model: gateway.speechModel(MODEL), text, voice, outputFormat: 'mp3',
    instructions: 'Speak Hebrew warmly, clearly and a little slowly, like a kind kindergarten teacher talking to a 7-year-old girl.',
  });
  const buf = Buffer.from(r.audio.uint8Array);
  try { await put(path, buf, { access: 'private', contentType: 'audio/mpeg', addRandomSuffix: false }); } catch (e) { console.warn('tts cache put failed', e && e.message); }
  return { buf, cached: false, path };
}

module.exports = { ttsBuffer, normalize, VOICES };
