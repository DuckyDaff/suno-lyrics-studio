/**
 * "Prepare for Suno": a producer's pass over finished lyrics (api/generate.js mode 'sunofix').
 * It respells words Suno would misread (geresh sounds, slang, loanwords, acronyms, numbers,
 * ambiguous words) and evens out the rhythm, and returns a list of every change with its reason.
 */
import { generate } from './ai.js';

/** parse the model answer: LYRICS: … CHANGES: - kind | before | after | why */
export function parseFix(text) {
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
      const [kind, before, after, why] = l.split('|').map(x => (x || '').trim());
      if (!before && !after) continue;
      changes.push({ kind: /rhythm|קצב/i.test(kind) ? 'rhythm' : 'sound', before, after, why: why || '' });
    }
  }
  return { lyrics, changes };
}

const tags = s => (String(s).match(/^\s*\[[^\]\n]+\]\s*$/gm) || []).length;
const lines = s => String(s).split('\n').filter(l => l.trim() && !/^\s*\[/.test(l)).length;

/**
 * Run the pass. ctx: { keepWords, srcLyrics, style, form, language, music }.
 * Resolves to { lyrics, changes }. Throws (with .code) on failure or on an answer that lost the song.
 */
export async function runSunoFix(lyricsText, ctx = {}, { signal, onDelta } = {}) {
  const r = await generate({
    mode: 'sunofix', fixText: lyricsText,
    keepWords: !!ctx.keepWords, srcLyrics: ctx.srcLyrics || '',
    style: ctx.style || '', form: ctx.form || '', language: ctx.language || '',
    ...(ctx.music ? { music: ctx.music } : {}),
    artist: null, producerTag: '',
  }, (_, full) => onDelta?.(full), { signal });
  const p = parseFix(r.text);
  // safety: never hand back an answer that dropped sections or most of the lines
  if (!p || !p.lyrics || tags(p.lyrics) < tags(lyricsText) || lines(p.lyrics) < lines(lyricsText) * 0.7) {
    throw Object.assign(new Error('bad_fix'), { code: 'bad_fix' });
  }
  return p;
}

/* ── rhythm view: estimated sung syllables per line ─────────────────────── */
const VOWEL = /[ֱ-ֻ]/g;              // hataf, hiriq, tsere, segol, patah, qamats, holam, qubuts
const SHURUK = /וּ(?![ְ-ֻ])/g;      // vav with dagesh and no vowel of its own = u

function wordSyllables(w) {
  if (/[א-ת]/.test(w)) {
    const marks = (w.match(VOWEL) || []).length + (w.match(SHURUK) || []).length;
    if (marks) return marks;
    return Math.max(1, Math.round(w.replace(/[^א-ת]/g, '').length / 2));   // bare Hebrew: rough guess
  }
  const v = w.toLowerCase().replace(/[^a-z]/g, '').replace(/e$/, '').match(/[aeiouy]+/g);
  return v ? v.length : 0;
}

export function syllables(line) {
  return String(line).replace(/\([^)]*\)/g, ' ').split(/[\s\-–]+/).reduce((n, w) => n + wordSyllables(w), 0);
}

/** breath limit per sung line: rap sections may run longer */
const limitFor = tag => (/rap|drill|trap|hip.?hop/i.test(tag) ? 16 : 12);

/** [{ name, counts, odd, long, limit }] — odd = more than 2 away from the section's median,
 *  long = over the breath limit (Suno sings it without a breath) */
export function rhythmProfile(text) {
  const out = []; let cur = null;
  for (const raw of String(text || '').split('\n')) {
    const l = raw.trim();
    const m = l.match(/^\[([^\]]+)\]$/);
    if (m) { cur = { name: m[1].split(':')[0].trim(), counts: [], limit: limitFor(m[1]) }; out.push(cur); continue; }
    if (!l || /^\(.*\)$/.test(l)) continue;           // blank or a backing-only line
    if (!cur) { cur = { name: '', counts: [], limit: 12 }; out.push(cur); }
    cur.counts.push(syllables(l));
  }
  return out.filter(s => s.counts.length).map(s => {
    const sorted = [...s.counts].sort((a, b) => a - b), med = sorted[Math.floor(sorted.length / 2)];
    return { ...s, odd: s.counts.map(c => Math.abs(c - med) > 2), long: s.counts.map(c => c > s.limit) };
  });
}

/** how many sung lines are over the breath limit */
export const breathless = text => rhythmProfile(text).reduce((n, s) => n + s.long.filter(Boolean).length, 0);
