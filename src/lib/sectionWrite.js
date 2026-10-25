/**
 * Run one AI operation on one editor section (api/generate.js mode 'section'): write it,
 * continue it, rewrite it … The text streams into the section, then gets auto-nikud.
 * 'write' also sends the neighbouring sections, so the new part continues the story
 * and fits the song's Style.
 */
import { get } from 'svelte/store';
import { song, actions } from './song.js';
import { genState } from './genState.js';
import { settings } from './settings.js';
import { generate } from './ai.js';
import { nikudLyrics } from './hebrew/nikud.js';
import { parseLyrics } from './lyricsParse.js';

/** the nearest section with words before / after `id` */
function neighbours(sections, id) {
  const i = sections.findIndex(s => s.id === id);
  const has = s => (s.text || '').trim();
  const prev = sections.slice(0, i).reverse().find(has);
  const next = sections.slice(i + 1).find(has);
  return {
    prev_name: sections[i - 1]?.name || '', prev_text: prev?.text || '',
    next_name: sections[i + 1]?.name || '', next_text: next?.text || '',
  };
}

/**
 * op: write | continue | rewrite | rhyme | shorter | longer | rap | backing | polish | translate.
 * hint: optional guidance from the writer. onNikud(true/false) reports the nikud step.
 */
export async function runSectionOp(sec, op, { hint = '', signal, onNikud } = {}) {
  const cur = get(song), g = get(genState);
  const base = op === 'continue' ? (sec.text || '').replace(/\s+$/, '') : '';
  const lang = /[א-ת]/.test(sec.text || cur.sections.map(s => s.text).join('')) ? 'Hebrew' : 'English';
  const r = await generate(
    { mode: 'section', op, section: sec.name, section_text: sec.text, language: lang,
      ...(hint.trim() ? { idea: hint.trim() } : {}),
      ...(op === 'write' ? neighbours(cur.sections, sec.id) : {}),
      ...(g.musicOn ? { music: { ...g.music, bars: [] }, bars: g.music.bars.find(r => r.name.toLowerCase() === sec.name.split(':')[0].trim().toLowerCase())?.bars } : {}) },
    (_, full) => actions.setText(sec.id, base ? `${base}\n${full}` : full),
    { signal }
  );
  let out = base ? `${base}\n${r.text}` : r.text;
  if (get(settings).autoNikud && /[א-ת]/.test(r.text) && op !== 'translate' && op !== 'backing') {
    onNikud?.(true);
    try { out = await nikudLyrics(out); } catch {}
    finally { onNikud?.(false); }
    actions.setText(sec.id, out);
  }
  return out;
}

/**
 * "Arrange": fix a section's structure (line breaks on phrases, meter, rhyme scheme, grammar, a
 * clear hook) and split it when it is really two parts (a pre-chorus and a chorus). Every section
 * with the same text (the other choruses) gets the same result. One undo step.
 * Resolves to { parts, copies }: how many sections it became, and in how many places.
 * Throws code 'changed' when the section was edited while Claude worked.
 */
export async function arrangeSection(sec, { signal } = {}) {
  const was = sec.text;
  const lang = /[א-ת]/.test(sec.text || '') ? 'Hebrew' : /[a-z]/i.test(sec.text || '') ? 'English' : '';
  const r = await generate(
    { mode: 'section', op: 'arrange', section: sec.name, section_text: was, ...(lang ? { language: lang } : {}) },
    null, { signal }
  );
  let out = r.text.trim();
  if (get(settings).autoNikud && /[א-ת]/.test(out)) { try { out = await nikudLyrics(out); } catch {} }
  // split into parts when the answer carries tags; otherwise it is the section's new text
  const parts = /^\s*\[[^\]\n]+\]\s*$/m.test(out) ? parseLyrics(out) : [{ name: sec.name, text: out }];
  if (!parts.length || !parts.some(p => (p.text || '').trim())) throw Object.assign(new Error('bad_arrange'), { code: 'api_error' });
  const cur = get(song);
  if (cur.sections.find(s => s.id === sec.id)?.text !== was) throw Object.assign(new Error('changed'), { code: 'changed' });
  const same = cur.sections.filter(s => s.text === was).map(s => s.id);
  actions.replaceSections(same, parts);
  return { parts: parts.length, copies: same.length };
}
