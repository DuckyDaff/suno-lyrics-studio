/**
 * Song structure in a form Suno follows: every section becomes a tag that carries its bar count,
 * its kind and an optional note — e.g. [Drop: instrumental, 16 bars, heavy bass] — and the number of
 * lyric lines matches the bars. After the writer answers, enforceStructure() puts the exact tags back,
 * strips lyrics from instrumental sections and re-inserts instrumental sections the writer skipped.
 */

export const KINDS = ['lyrics', 'rap', 'backing', 'instrumental'];

/** quick blocks: name, bars, kind */
export const QUICK = [
  ['Intro', 8, 'instrumental'], ['Verse', 8, 'lyrics'], ['Pre-Chorus', 4, 'lyrics'], ['Chorus', 8, 'lyrics'],
  ['Hook', 8, 'lyrics'], ['Build Up', 8, 'lyrics'], ['Drop', 16, 'instrumental'], ['Breakdown', 8, 'lyrics'],
  ['Bridge', 8, 'lyrics'], ['Solo', 8, 'instrumental'], ['Interlude', 4, 'instrumental'], ['Outro', 8, 'instrumental'],
];

/** default lines per bar for a time signature (what the writer uses on 'auto') */
export function autoLpb(sig) { return sig === '3/4' ? 0.5 : 1; }

/** target lyric lines for a row */
export function linesFor(row, sig, lpb) {
  if (row.kind === 'instrumental') return 0;
  const per = lpb && lpb !== 'auto' ? parseFloat(lpb) : autoLpb(sig);
  return Math.max(1, Math.round((parseInt(row.bars, 10) || 0) * per));
}

/** the words after the colon: kind, then extra descriptors (e.g. a blend's voice), then bars, then the note */
function descriptors(row, extra = []) {
  const kind = row.kind === 'instrumental' ? 'instrumental' : row.kind === 'rap' ? 'rap' : row.kind === 'backing' ? 'backing vocals only' : '';
  const bars = parseInt(row.bars, 10) ? `${parseInt(row.bars, 10)} bars` : '';
  const note = (row.note || '').trim();
  const own = [kind, bars, note].filter(Boolean).map(x => x.toLowerCase());
  const keep = extra.filter(x => x && !own.includes(x.toLowerCase()) && !/^\d+\s*bars?$/i.test(x) && !/^(instrumental|rap|backing vocals only)$/i.test(x));
  return [kind, ...keep, bars, note].filter(Boolean);
}

/** "Drop: instrumental, 16 bars, heavy bass" (no brackets) */
export function tagName(row, extra = []) {
  const d = descriptors(row, extra);
  return d.length ? `${row.name.trim()}: ${d.join(', ')}` : row.name.trim();
}
export const sunoTag = row => `[${tagName(row)}]`;

const base = s => String(s || '').split(/[:|–-]/)[0].trim().toLowerCase().replace(/\s+\d+$/, '').replace(/^(final|last)\s+/, '');
const TAG = /^\s*\[([^\]\n]+)\]\s*$/;

/**
 * Put the structure back into the writer's lyrics:
 * - each section matched (in order, by name) to its row gets the row's exact tag; descriptors the
 *   writer added (voices from a blend) are kept,
 * - instrumental sections keep only ad-libs in parentheses,
 * - instrumental rows the writer left out are inserted where they belong.
 */
export function enforceStructure(text, rows) {
  rows = (rows || []).filter(r => r && r.name && r.name.trim());
  if (!rows.length) return text;
  // split into [{ tag, lines }]
  const secs = []; let cur = null; const head = [];
  for (const raw of String(text || '').replace(/\r/g, '').split('\n')) {
    const m = raw.match(TAG);
    if (m) { cur = { tag: m[1].trim(), lines: [] }; secs.push(cur); continue; }
    (cur ? cur.lines : head).push(raw);
  }
  const out = []; let ri = 0;
  const emit = (row, extra) => `[${tagName(row, extra)}]`;
  for (const s of secs) {
    // find this section's row from the current position (skipping rows the writer left out)
    let j = -1;
    for (let k = ri; k < rows.length; k++) if (base(rows[k].name) === base(s.tag)) { j = k; break; }
    if (j < 0) { out.push({ tag: `[${s.tag}]`, lines: s.lines }); continue; }
    for (let k = ri; k < j; k++) if (rows[k].kind === 'instrumental') out.push({ tag: sunoTag(rows[k]), lines: [] });
    const row = rows[j]; ri = j + 1;
    const extra = s.tag.includes(':') ? s.tag.slice(s.tag.indexOf(':') + 1).split(',').map(x => x.trim()) : [];
    let lines = s.lines;
    if (row.kind === 'instrumental') {
      // only ad-lib lines in parentheses; none at all when the note says "no vocals"
      // (the first section keeps its lines: that is where the producer's intro tag lives)
      const silent = /no\s*(vocals?|vox|voice)|instrumental only/i.test(row.note || '') && out.length > 0;
      lines = silent ? [] : lines.filter(l => /^\s*\(.*\)\s*$/.test(l));
    }
    out.push({ tag: emit(row, extra), lines });
  }
  for (let k = ri; k < rows.length; k++) if (rows[k].kind === 'instrumental') out.push({ tag: sunoTag(rows[k]), lines: [] });
  const body = out.map(s => {
    const t = s.lines.join('\n').replace(/^\s*\n|\n\s*$/g, '').replace(/^\n+|\n+$/g, '');
    return t.trim() ? `${s.tag}\n${t}` : s.tag;
  }).join('\n\n');
  const pre = head.join('\n').trim();
  return (pre ? pre + '\n\n' : '') + body;
}
