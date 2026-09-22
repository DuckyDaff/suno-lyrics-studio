// Generate sticker illustrations for every Gala card on the local ComfyUI (Qwen-Image).
// Usage: node scripts/gen-card-art.mjs [--only who,where] [--force]
// Output: public/kid/cards/<step>-<id>.jpg (256px) + src/kid/cardArt.json (list of ids that have art)
import fs from 'fs';
import path from 'path';
import { CARDS } from '../src/kid/cards.js';
import { buildQwen, DEFAULTS } from '../src/lib/comfy.js';

const U = process.env.COMFY_URL || 'http://127.0.0.1:8188';
const OUT = 'public/kid/cards';
const LIST = 'src/kid/cardArt.json';
const args = process.argv.slice(2);
const only = (args.find(a => a.startsWith('--only'))?.split('=')[1] || '').split(',').filter(Boolean);
const force = args.includes('--force');
fs.mkdirSync(OUT, { recursive: true });

const BG = { who: 'soft pastel pink', world: 'soft pastel lavender', where: 'soft pastel sky blue', what: 'soft pastel mint green', mood: 'soft pastel yellow', style: 'soft pastel peach' };
const SUFFIX = ', flat vector sticker illustration, thick soft white outline, cute kawaii, rounded friendly shapes, soft pastel colors, clean edges, glossy, centered, square 1:1, no text, no letters';
const NEG = 'text, letters, words, watermark, logo, blurry, realistic, photo, scary, creepy, extra limbs, deformed, dark, gore';

function promptFor(step, c) {
  const en = c.en || c.he;
  const bg = `on a solid ${BG[step]} rounded square background`;
  switch (step) {
    case 'who':   return `cute cartoon character portrait of ${en}, friendly smiling, child-friendly, ${bg}`;
    case 'world': return `cute cartoon illustration inspired by ${en}, the most recognizable character or symbol of it, friendly, child-friendly, ${bg}`;
    case 'where': return `cute cartoon scene: ${en}, simple friendly landscape or place, ${bg}`;
    case 'what':  return `cute cartoon scene of a happy little girl: ${en}, playful, ${bg}`;
    case 'mood':  return `cute round cartoon face of a little girl feeling ${en}, expressive, big eyes, ${bg}`;
    case 'style': return `cute cartoon icon for the music style ${en}: instruments, outfit and colors typical of it, playful, ${bg}`;
  }
}

async function queue(prompt, seed) {
  const wf = buildQwen({ ...DEFAULTS.qwen, steps: 10 }, prompt + SUFFIX, NEG, seed, 640);
  const q = await (await fetch(`${U}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: wf, client_id: 'mdcards' }) })).json();
  if (!q.prompt_id) throw new Error('queue failed ' + JSON.stringify(q).slice(0, 200));
  for (let i = 0; i < 400; i++) {
    await new Promise(r => setTimeout(r, 1200));
    const h = await (await fetch(`${U}/history/${q.prompt_id}`)).json();
    const rec = h[q.prompt_id];
    if (rec?.status?.status_str === 'error') throw new Error('exec error');
    if (rec?.outputs) {
      const im = Object.values(rec.outputs).flatMap(o => o.images || [])[0];
      const r = await fetch(`${U}/view?filename=${encodeURIComponent(im.filename)}&subfolder=${encodeURIComponent(im.subfolder || '')}&type=${im.type}`);
      return Buffer.from(await r.arrayBuffer());
    }
  }
  throw new Error('timeout');
}

const have = new Set(fs.existsSync(LIST) ? JSON.parse(fs.readFileSync(LIST, 'utf8')) : []);
let n = 0, t0 = Date.now();
for (const [step, list] of Object.entries(CARDS)) {
  if (only.length && !only.includes(step)) continue;
  for (const c of list) {
    if (c.id === 'none') continue;
    const key = `${step}-${c.id}`, png = path.join(OUT, key + '.png');
    if (!force && fs.existsSync(path.join(OUT, key + '.jpg'))) { have.add(key); continue; }
    try {
      const buf = await queue(promptFor(step, c), 1000 + n);
      fs.writeFileSync(png, buf);
      have.add(key); n++;
      fs.writeFileSync(LIST, JSON.stringify([...have].sort(), null, 0));
      console.log(`${key} ok (${n}, ${Math.round((Date.now() - t0) / 1000)}s)`);
    } catch (e) { console.log(`${key} FAILED ${e.message}`); }
  }
}
console.log('done', n, 'generated;', have.size, 'total with art. Now run: python scripts/shrink-card-art.py');
