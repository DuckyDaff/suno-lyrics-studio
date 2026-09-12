/**
 * Export validator — checks a song before it goes to Suno.
 * Returns [{ level: 'err' | 'warn', code, section?, detail? }].
 */
import { buildLyrics } from './suno.js';

const KNOWN = /^(intro|outro|verse|instrumental( [a-z]+)?|[a-z]+ solo|final [a-z]+|guitar riff|vocal drone|pre[- ]?chorus|chorus|final chorus|power chorus|refrain|hook|bridge|break|breakdown|build[- ]?up|drop|interlude|instrumental|solo|guitar solo|piano solo|sax solo|end|ending|coda|rap verse|rap|spoken|spoken word|recitative|aria|mawwal|taksim|section \d+|climax|release|fade out|fade in|part \d+|movement \d+|vocal|vocals|backing vocals|ad[- ]?libs?|chant|acapella|a cappella|silence|scat|whisper|scream|male vocal|female vocal|duet|choir|beat switch|skit|tag|turnaround|vamp|lift|post[- ]?chorus|hymn|verse \d+|chorus \d+|hook \d+|big finish|key change|half[- ]?time|double[- ]?time)$/i;

const MAX_LINE = 110;   // characters — longer lines make Suno rush the phrase

export function validateSong(song, lim) {
  const issues = [];
  const push = (level, code, extra = {}) => issues.push({ level, code, ...extra });

  const secs = song.sections || [];
  if (!secs.length) push('err', 'noSections');

  const lyrics = buildLyrics(song);
  const style = (song.style || '').trim();
  if (!lyrics.trim() || !secs.some(s => (s.text || '').trim())) push('err', 'noLyrics');
  if (!style) push('warn', 'noStyle');
  if (lim) {
    if (lyrics.length > lim.lyrics) push('err', 'lyricsOver', { detail: `${lyrics.length} / ${lim.lyrics}` });
    if (style.length > lim.style) push('err', 'styleOver', { detail: `${style.length} / ${lim.style}` });
  }
  if (/\[[^\]]*\]/.test(style)) push('warn', 'styleHasTags');

  const seen = new Map();
  let hasChorus = false;
  const anyText = secs.some(s => (s.text || '').trim());
  const INSTR = /instrumental|solo|break|interlude|intro|outro|drop|build|end|coda|silence|taksim|mawwal/i;
  for (const s of secs) {
    const text = (s.text || '').replace(/\r/g, '');
    const name = String(s.name || '').trim();
    const base = name.split(':')[0].trim();
    if (/chorus|hook|refrain/i.test(base)) hasChorus = true;
    if (base && !KNOWN.test(base)) push('warn', 'unknownTag', { section: name });
    if (!text.trim()) { if (anyText && !INSTR.test(base)) push('warn', 'emptySection', { section: name || '?' }); continue; }

    // tags that appear inside the section body
    for (const m of text.matchAll(/^\s*\[([^\]]{1,60})\]\s*$/gm)) {
      const b = m[1].split(':')[0].trim();
      if (/chorus|hook|refrain/i.test(b)) hasChorus = true;
      if (b && !KNOWN.test(b)) push('warn', 'unknownTag', { section: m[1] });
    }
    // unbalanced brackets
    const open = (text.match(/\[/g) || []).length, close = (text.match(/\]/g) || []).length;
    if (open !== close) push('err', 'brackets', { section: name });
    const po = (text.match(/\(/g) || []).length, pc = (text.match(/\)/g) || []).length;
    if (po !== pc) push('warn', 'parens', { section: name });
    // long lines
    const long = text.split('\n').filter(l => l.trim().length > MAX_LINE).length;
    if (long) push('warn', 'longLines', { section: name, detail: String(long) });
    // very long section (Suno tends to cut)
    const lines = text.split('\n').filter(l => l.trim() && !/^\s*\[/.test(l)).length;
    if (lines > 24) push('warn', 'longSection', { section: name, detail: String(lines) });
    // duplicate section names
    const k = name.toLowerCase();
    if (seen.has(k) && !/chorus|hook|refrain|instrumental|break|interlude/i.test(base)) push('warn', 'dupName', { section: name });
    seen.set(k, 1);
  }
  if (secs.length >= 3 && !hasChorus && lyrics.trim()) push('warn', 'noChorus');

  // dedupe identical issues
  const key = i => `${i.level}|${i.code}|${i.section || ''}|${i.detail || ''}`;
  const uniq = [...new Map(issues.map(i => [key(i), i])).values()];
  const errs = uniq.filter(i => i.level === 'err').length;
  return { issues: uniq, errs, warns: uniq.length - errs, status: errs ? 'over' : uniq.length ? 'warn' : 'ok' };
}
