import { writable, get } from 'svelte/store';
import { GENRES, genreById } from './data/genres.js';
import { formTag } from './data/forms.js';
import { familyForForm } from './genreHint.js';

/** Fields in output order, with how many tags each contributes. */
export const FIELDS = [
  { key: 'genre', n: 1 },
  { key: 'mood',  n: 2 },
  { key: 'instr', n: 2 },
  { key: 'vox',   n: 1 },
  { key: 'prod',  n: 1 },
  { key: 'bpm',   n: 1 },
];

const HISTORY_LIMIT = 10;

/** per-field lock state — locked fields keep their previous picks */
export const locks = writable(Object.fromEntries(FIELDS.map(f => [f.key, false])));
/** last picks per field, so locks have something to keep */
export const picks = writable(Object.fromEntries(FIELDS.map(f => [f.key, []])));
/** last N results: { text, familyLabel, ts } */
export const history = writable([]);

export function toggleLock(key) {
  locks.update(l => ({ ...l, [key]: !l[key] }));
}
export function clearLocks() {
  locks.set(Object.fromEntries(FIELDS.map(f => [f.key, false])));
}

const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);
const pick = (arr, n, avoid = []) => shuffle(arr.filter(x => !avoid.includes(x))).slice(0, n);
const rand = arr => arr[Math.floor(Math.random() * arr.length)];

/** remember a Style (AI-written or typed) so it can be restored from the history list */
export function pushHistory(text, familyLabel) {
  if (!text || !text.trim()) return;
  history.update(h => h[0]?.text === text ? h : [{ text, familyLabel, ts: Date.now() }, ...h].slice(0, HISTORY_LIMIT));
}

/** merge comma-separated tag lists, first list wins, case-insensitive de-dupe */
export function mergeTags(...lists) {
  const seen = new Set(), out = [];
  for (const l of lists) for (const raw of String(l || '').split(',')) {
    const t = raw.trim(); if (!t) continue;
    const k = t.toLowerCase(); if (seen.has(k)) continue;
    seen.add(k); out.push(t);
  }
  return out.join(', ');
}

/**
 * @param {object} opts
 * @param {string} opts.form      the song form from the shared style list (decides the family and the genre tag)
 * @param {boolean} opts.fusion   blend in a second family
 * @param {string} opts.prefix    tags that always come first (the active artist's signature sound)
 * @returns {{ text: string, familyLabel: string, picks: object }}
 */
export function randomize({ form = '', fusion = false, prefix = '' } = {}) {
  const l = get(locks), prev = get(picks);

  const primary = (form && familyForForm(form)) || rand(GENRES);
  // the form's genre tag, unless the artist's signature already names that genre
  const tag = formTag(form).split(', ').filter(x => x && !String(prefix).toLowerCase().includes(x.toLowerCase())).join(', ');
  let secondary = null;
  if (fusion) {
    // pick a second family from a different group so the blend is interesting
    const pool = GENRES.filter(g => g.id !== primary.id && g.group !== primary.group);
    secondary = rand(pool.length ? pool : GENRES.filter(g => g.id !== primary.id));
  }

  const next = {};
  for (const { key, n } of FIELDS) {
    if (l[key] && prev[key]?.length) { next[key] = prev[key]; continue; }
    if (key === 'genre' && tag) { next[key] = secondary ? [tag, ...pick(secondary.genre, 1)] : [tag]; continue; }
    if (secondary) {
      // fusion: split the field between the two families (BPM always from primary)
      if (key === 'bpm') next[key] = pick(primary.bpm, 1);
      else if (n === 1) next[key] = pick(rand([primary, secondary])[key], 1);
      else next[key] = [...pick(primary[key], 1), ...pick(secondary[key], 1, [])];
    } else {
      next[key] = pick(primary[key] || [], n);
    }
  }

  const text = mergeTags(prefix, FIELDS.flatMap(f => next[f.key]).filter(Boolean).join(', '));
  const label = form || primary.label;
  const familyLabel = secondary ? `${label} × ${secondary.label}` : label;

  picks.set(next);
  history.update(h => [{ text, familyLabel, ts: Date.now() }, ...h].slice(0, HISTORY_LIMIT));
  return { text, familyLabel, picks: next };
}
