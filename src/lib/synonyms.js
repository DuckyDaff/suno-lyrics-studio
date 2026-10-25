/**
 * "Fresh words": Claude picks words across the song and swaps them for synonyms that keep
 * rhyme and meter (api/generate.js mode 'synonyms'). The swapped words are found by a word
 * diff (not by trusting the model's list), so the editor can highlight exactly what changed.
 */
import { writable } from 'svelte/store';
import { generate } from './ai.js';

/** { [sectionId]: { text, ranges: [[start, end]] } } — a section shows its marks only while its text is still `text` */
export const synMarks = writable({});

/** parse the model answer: LYRICS: … CHANGES: - before | after | why */
export function parseSyn(text) {
  const t = String(text || '').replace(/\r/g, '');
  const li = t.search(/^\s*LYRICS:\s*$/mi);
  const ci = t.search(/^\s*CHANGES:\s*$/mi);
  if (li < 0) return null;
  const lyrics = t.slice(t.indexOf('\n', li) + 1, ci > li ? ci : undefined).trim();
  const changes = [];
  if (ci > li) {
    for (const raw of t.slice(ci).split('\n').slice(1)) {
      const l = raw.replace(/^\s*[-•*]\s*/, '').trim();
      if (!l || /^none$/i.test(l)) continue;
      const [before, after, why] = l.split('|').map(x => (x || '').trim());
      if (before && after) changes.push({ before, after, why: why || '' });
    }
  }
  return { lyrics, changes };
}

const tags = s => (String(s).match(/^\s*\[[^\]\n]+\]\s*$/gm) || []).length;
const lines = s => String(s).split('\n').filter(l => l.trim() && !/^\s*\[/.test(l)).length;

/** Run the pass (style and voice come from the open song). Resolves to { lyrics, changes }; throws (with .code) on failure. */
export async function runSynonyms(lyricsText, { language = '' } = {}, { signal } = {}) {
  const r = await generate({
    mode: 'synonyms', fixText: lyricsText, language,
    artist: null, producerTag: '',
  }, null, { signal });
  const p = parseSyn(r.text);
  // safety: the pass swaps words only, so the tags and the line count must survive
  if (!p || !p.lyrics || tags(p.lyrics) !== tags(lyricsText) || lines(p.lyrics) !== lines(lyricsText)) {
    throw Object.assign(new Error('bad_syn'), { code: 'bad_syn' });
  }
  const g = keepRhymes(lyricsText, syncRepeats(lyricsText, p.lyrics));
  const text = syncRepeats(lyricsText, g.text);
  // a "change" that only re-spelled or re-vocalized a word, or one the rhyme guard undid, is not a swap;
  // a swap listed once per chorus repetition is one swap
  const seen = new Set();
  const changes = p.changes.filter(c => {
    const k = base(c.before) + '|' + base(c.after);
    if (base(c.before) === base(c.after) || g.undone.has(base(c.after)) || seen.has(k)) return false;
    seen.add(k); return true;
  });
  return { lyrics: text, changes };
}

/**
 * Repeated parts stay identical: every group of lines that were the same in `before` (each
 * chorus repetition, a refrain line) gets one version in `after` — the first one that was swapped.
 */
export function syncRepeats(before, after) {
  const A = before.split('\n'), B = after.split('\n');
  if (A.length !== B.length) return after;
  const key = l => l.split(/\s+/).map(base).filter(Boolean).join(' ');
  const groups = new Map();
  A.forEach((l, i) => {
    if (/^\s*\[[^\]]+\]\s*$/.test(l) || !key(l)) return;
    const k = key(l);
    groups.has(k) ? groups.get(k).push(i) : groups.set(k, [i]);
  });
  for (const [k, at] of groups) {
    if (at.length < 2) continue;
    const pick = at.find(i => key(B[i]) !== k) ?? at[0];
    for (const i of at) B[i] = B[pick];
  }
  return B.join('\n');
}

/* ── word diff ─────────────────────────────────────────────────────────── */
/** a word without nikud and punctuation, so re-vocalizing a word does not count as a change */
const base = w => w.replace(/[֑-ׇ]/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();

/* ── rhyme guard ───────────────────────────────────────────────────────── */
const FINALS = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
/** rough rhyme key: the last two letters of the bare word (final letters normalized) */
const ending = w => base(w).replace(/[ךםןףץ]/g, c => FINALS[c]).slice(-2);
const lastWord = l => (l.replace(/\([^)]*\)/g, ' ').match(/(\S+)\s*$/) || [])[1] || '';

/**
 * The model sometimes swaps a rhyming line-end word anyway. Line by line: when the old last word
 * rhymed with another line-end of its section and the new one no longer does, put the old word back.
 * Returns { text, undone: Set of the bare new words that were reverted }.
 */
export function keepRhymes(before, after) {
  const A = before.split('\n'), B = after.split('\n'), undone = new Set();
  if (A.length !== B.length) return { text: after, undone };
  const isTag = l => /^\s*\[[^\]]+\]\s*$/.test(l);
  for (let i = 0; i < B.length; i++) {
    if (isTag(A[i]) || !A[i].trim()) continue;
    const ow = lastWord(A[i]), nw = lastWord(B[i]);
    if (!ow || !nw || base(ow) === base(nw)) continue;
    // the other line-ends of the same section (as they read after the pass)
    let s = i, e = i;
    while (s > 0 && !isTag(A[s - 1])) s--;
    while (e < A.length - 1 && !isTag(A[e + 1])) e++;
    const partners = [];
    for (let j = s; j <= e; j++) if (j !== i && A[j].trim()) partners.push(ending(lastWord(B[j])));
    if (partners.includes(ending(ow)) && !partners.includes(ending(nw))) {
      const k = B[i].lastIndexOf(nw);
      B[i] = B[i].slice(0, k) + ow + B[i].slice(k + nw.length);
      undone.add(base(nw));
    }
  }
  return { text: B.join('\n'), undone };
}
const words = s => [...String(s).matchAll(/\S+/g)].map(m => ({ i: m.index, end: m.index + m[0].length, b: base(m[0]) }));

/** character ranges in `after` holding words that are not in `before` (adjacent words on one line merge) */
export function changedRanges(before, after) {
  const a = words(before), b = words(after);
  const n = a.length, m = b.length;
  const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    L[i][j] = a[i].b === b[j].b ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  }
  const kept = new Set();
  for (let i = 0, j = 0; i < n && j < m;) {
    if (a[i].b === b[j].b) { kept.add(j); i++; j++; }
    else if (L[i + 1][j] >= L[i][j + 1]) i++;
    else j++;
  }
  const out = [];
  b.forEach((w, j) => {
    if (kept.has(j) || !w.b) return;
    const last = out[out.length - 1];
    if (last && !kept.has(j - 1) && j > 0 && !/\n/.test(after.slice(last[1], w.i))) last[1] = w.end;
    else out.push([w.i, w.end]);
  });
  return out;
}

/** split a section's text into [{ s, hit }] runs for the highlight layer */
export function markRuns(text, ranges) {
  const out = []; let at = 0;
  for (const [s, e] of ranges) {
    if (s > at) out.push({ s: text.slice(at, s), hit: false });
    out.push({ s: text.slice(s, e), hit: true });
    at = e;
  }
  out.push({ s: text.slice(at) + '​', hit: false });   // a trailing newline still takes a line
  return out;
}
