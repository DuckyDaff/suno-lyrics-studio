// One-off: pull the tag/command/studio data out of legacy/index.html into src/lib/data/library.json
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'legacy', 'index.html'), 'utf8');

function sliceDecl(name) {
  const i = src.indexOf(`const ${name} =`);
  if (i < 0) throw new Error('not found: ' + name);
  const open = src.indexOf(src[src.indexOf('=', i) + 2] === '[' ? '[' : '{', i);
  const start = src.slice(i).search(/[\[{]/) + i;
  const openCh = src[start], closeCh = openCh === '[' ? ']' : '}';
  let depth = 0, inStr = null, j = start;
  for (; j < src.length; j++) {
    const ch = src[j];
    if (inStr) { if (ch === '\\') { j++; continue; } if (ch === inStr) inStr = null; continue; }
    if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; continue; }
    if (ch === '/' && src[j + 1] === '/') { j = src.indexOf('\n', j); continue; }
    if (ch === openCh) depth++;
    else if (ch === closeCh) { depth--; if (depth === 0) break; }
  }
  return vm.runInNewContext('(' + src.slice(start, j + 1) + ')');
}

const TAG_LIBRARY = sliceDecl('TAG_LIBRARY');
const SUNO_COMMANDS = sliceDecl('SUNO_COMMANDS');
const STUDIO_LIBRARY = sliceDecl('STUDIO_LIBRARY');
const STUDIO_GENRE_CHIPS = sliceDecl('STUDIO_GENRE_CHIPS');

const strip = s => s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}️\s]+/u, '').trim();
const out = {
  tags:   TAG_LIBRARY.map(c => ({ name: c.name, color: c.color, items: c.tags })),
  style:  SUNO_COMMANDS.style.map(c => ({ name: c.name, color: c.color, items: c.chips })),
  lyrics: SUNO_COMMANDS.lyrics.map(c => ({ name: c.name, color: c.color, items: c.chips })),
  studio: STUDIO_LIBRARY.map(c => ({ name: strip(c.name), color: c.color, items: c.chips })),
  studioGenres: STUDIO_GENRE_CHIPS,
};
const dest = path.join(__dirname, '..', 'src', 'lib', 'data', 'library.json');
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
const count = k => out[k].reduce((n, c) => n + c.items.length, 0);
console.log(`tags: ${out.tags.length} cats / ${count('tags')} items
style: ${out.style.length} groups / ${count('style')} chips
lyrics: ${out.lyrics.length} groups / ${count('lyrics')} chips
studio: ${out.studio.length} cats / ${count('studio')} chips
studioGenres: ${Object.keys(out.studioGenres).length}
→ ${path.relative(process.cwd(), dest)} (${(fs.statSync(dest).size / 1024).toFixed(1)} KB)`);
