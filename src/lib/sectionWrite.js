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
