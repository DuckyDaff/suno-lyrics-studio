// Pre-generate (and cache in Blob) the natural voice for every fixed phrase of the kid app,
// so the first tap on the iPad never waits for the speech model. Needs .env.local (vercel env pull).
import fs from 'fs';
import { createRequire } from 'module';
import { STEPS, CARDS } from '../src/kid/cards.js';
const require = createRequire(import.meta.url);

for (const l of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) { const i = l.indexOf('='); if (i > 0) process.env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^"|"$/g, ''); }
const { ttsBuffer, normalize } = require('../api/_tts.js');

const phrases = new Set();
for (const s of STEPS) phrases.add(s.q);
for (const list of Object.values(CARDS)) for (const c of list) phrases.add(c.he);
[
  'עכשיו ספרי לי את הרעיון בקול', 'ספרי לי את הרעיון בקול. אפשר גם לשיר!', 'רוצה לצייר את השיר?', 'רוצה לצלם משהו לשיר?',
  'שלוש, שתיים, אחת', 'מעולה! נשמר', 'הציור נשמר', 'התמונה נשמרה', 'לא הצלחתי לשמור', 'לא הצלחתי לשמור את התמונה',
  'צריך לאשר את המיקרופון', 'השירים שלך', 'עוד אין שירים מוכנים', 'אופס, לא הצלחתי לשלוח. ננסה שוב',
].forEach(p => phrases.add(p));

const voices = (process.argv[2] || 'nova').split(',');
let n = 0, hit = 0, t0 = Date.now();
for (const v of voices) for (const p of phrases) {
  const text = normalize(p); if (!text) continue;
  try { const r = await ttsBuffer(text, v); r.cached ? hit++ : n++; if (!r.cached) process.stdout.write('.'); }
  catch (e) { console.log('\nFAIL', v, text, e.message.slice(0, 120)); }
}
console.log(`\ndone: ${n} generated, ${hit} already cached, ${phrases.size} phrases × ${voices.length} voice(s), ${Math.round((Date.now() - t0) / 1000)}s`);
