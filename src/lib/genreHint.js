/** Map a free-text form ("tech house", "UK garage / 2-step") to the closest randomizer family and
 *  return a short vocabulary hint the writer can draw on for the Style prompt. */
import { GENRES, genreById } from './data/genres.js';
import { FORM_FAMILY } from './data/forms.js';

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9& -]+/g, ' ').replace(/\s+/g, ' ').trim();

export function familyForForm(form) {
  if (FORM_FAMILY[form]) return genreById(FORM_FAMILY[form]);
  const parts = String(form || '').split('/').map(norm).filter(p => p.length > 1);
  if (!parts.length) return null;
  let best = null, bestScore = 0;
  for (const g of GENRES) {
    const labelParts = String(g.label).split('/').map(norm);
    const tags = [...labelParts, ...(g.genre || []).map(norm)];
    let score = 0;
    for (const p of parts) {
      if (labelParts.includes(p)) score = Math.max(score, 12);          // the family is named after it
      for (const t of tags) {
        if (t === p) score = Math.max(score, 10);
        else if (p.length > 3 && (t.includes(p) || p.includes(t))) score = Math.max(score, 5 + Math.min(p.length, t.length) / 20);
      }
    }
    if (score > bestScore) { bestScore = score; best = g; }
  }
  return bestScore >= 5 ? best : null;
}

export function genreHint(form) {
  const g = familyForForm(form);
  if (!g) return '';
  const pick = (arr, n) => (arr || []).slice(0, n).join(', ');
  return [
    `sub-genres: ${pick(g.genre, 5)}`,
    `moods: ${pick(g.mood, 6)}`,
    `instruments/sounds: ${pick(g.instr, 6)}`,
    `vocals: ${pick(g.vox, 4)}`,
    `production: ${pick(g.prod, 4)}`,
    `typical tempo: ${pick(g.bpm, 4)}`,
  ].join(' · ');
}
