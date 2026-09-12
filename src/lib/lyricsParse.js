const TAG_RE = /^\s*\[([^\]]{1,60})\]\s*$/;

/**
 * Split Suno-formatted lyrics into [{ name, text }] sections.
 * Text before the first tag becomes a "Verse" section; tags with a colon keep
 * everything ("Chorus: big") as the section name so it round-trips as written.
 */
export function parseLyrics(text) {
  const out = [];
  let cur = null;
  for (const raw of String(text || '').replace(/\r/g, '').split('\n')) {
    const m = raw.match(TAG_RE);
    if (m) { cur = { name: m[1].trim(), lines: [] }; out.push(cur); continue; }
    if (!cur) { if (!raw.trim()) continue; cur = { name: 'Verse', lines: [] }; out.push(cur); }
    cur.lines.push(raw);
  }
  return out.map(s => ({ name: s.name, text: s.lines.join('\n').replace(/^\n+|\n+$/g, '') }))
            .filter(s => s.text || out.length === 1);
}

/** Wild-mode output: "TITLE: …\nSTYLE: …\n\n<lyrics>" → { title, style, lyrics } */
export function parseWild(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  let title = '', style = '';
  let i = 0;
  for (; i < Math.min(lines.length, 6); i++) {
    const l = lines[i].trim();
    const mt = l.match(/^TITLE:\s*(.+)$/i), ms = l.match(/^STYLE:\s*(.+)$/i);
    if (mt) title = mt[1].trim();
    else if (ms) style = ms[1].trim();
    else if (l && (title || style)) break;
  }
  return { title, style, lyrics: lines.slice(i).join('\n').trim() };
}

/** "line\nline" → ["line", …] non-empty, for title suggestions */
export function parseLines(text) {
  return String(text || '').split('\n').map(l => l.replace(/^\s*[\d]+[.)]\s*/, '').replace(/^["“”']+|["“”']+$/g, '').trim()).filter(Boolean);
}
