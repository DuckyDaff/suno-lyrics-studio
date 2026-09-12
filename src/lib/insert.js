import { get } from 'svelte/store';
import { song, actions } from './song.js';
import { activeSectionId } from './ui.js';

const norm = s => s.trim().toLowerCase();

/** Is this tag already in the style prompt? */
export function inStyle(tag) {
  return get(song).style.split(',').map(norm).includes(norm(tag));
}

/** Toggle a tag in the comma-separated style prompt. Returns 'added' | 'removed'. */
export function toggleStyle(tag) {
  const parts = get(song).style.split(',').map(s => s.trim()).filter(Boolean);
  const i = parts.findIndex(p => norm(p) === norm(tag));
  if (i >= 0) { parts.splice(i, 1); actions.setStyle(parts.join(', ')); return 'removed'; }
  actions.setStyle([...parts, tag].join(', '));
  return 'added';
}

/**
 * Insert text into the lyrics: at the caret of the focused section textarea,
 * otherwise as a new line at the end of the active (or first) section.
 * Returns false when there is no section to insert into.
 */
export function insertLyrics(text) {
  const s = get(song);
  const id = get(activeSectionId) ?? s.sections[0]?.id;
  const sec = s.sections.find(x => x.id === id);
  if (!sec) return false;

  const ta = document.querySelector(`textarea[data-sec="${id}"]`);
  if (ta && document.activeElement === ta) {
    const start = ta.selectionStart, end = ta.selectionEnd;
    const before = ta.value.slice(0, start), after = ta.value.slice(end);
    // bracket tags go on their own line
    const needsNl = text.startsWith('[') && before.length && !before.endsWith('\n');
    const needsNlAfter = text.startsWith('[') && after.length && !after.startsWith('\n');
    const ins = (needsNl ? '\n' : '') + text + (needsNlAfter ? '\n' : '');
    ta.setRangeText(ins, start, end, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));   // SectionCard → setText + resize
    return true;
  }
  const cur = (sec.text || '').replace(/\s+$/, '');
  actions.setText(id, cur ? `${cur}\n${text}` : text);
  return true;
}

/** Add a new section named after a structure tag ("Verse", "Chorus", "Outro (Fade)"…). */
export function addSectionTag(name) {
  const created = actions.add(name);
  requestAnimationFrame(() => document.querySelector(`textarea[data-sec="${created.id}"]`)?.focus());
  return created;
}
