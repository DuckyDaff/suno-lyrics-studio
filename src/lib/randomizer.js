import { writable, get } from 'svelte/store';
import { GENRES, genreById } from './data/genres.js';

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

/**
 * @param {object} opts
 * @param {string} opts.familyId  genre id or 'all'
 * @param {boolean} opts.fusion   blend two families
 * @returns {{ text: string, familyLabel: string, picks: object }}
 */
export function randomize({ familyId = 'all', fusion = false } = {}) {
  const l = get(locks), prev = get(picks);

  const primary = familyId !== 'all' && genreById(familyId) ? genreById(familyId) : rand(GENRES);
  let secondary = null;
  if (fusion) {
    // pick a second family from a different group so the blend is interesting
    const pool = GENRES.filter(g => g.id !== primary.id && g.group !== primary.group);
    secondary = rand(pool.length ? pool : GENRES.filter(g => g.id !== primary.id));
  }

  const next = {};
  for (const { key, n } of FIELDS) {
    if (l[key] && prev[key]?.length) { next[key] = prev[key]; continue; }
    if (secondary) {
      // fusion: split the field between the two families (BPM always from primary)
      if (key === 'bpm') next[key] = pick(primary.bpm, 1);
      else if (n === 1) next[key] = pick(rand([primary, secondary])[key], 1);
      else next[key] = [...pick(primary[key], 1), ...pick(secondary[key], 1, [])];
    } else {
      next[key] = pick(primary[key] || [], n);
    }
  }

  const text = FIELDS.flatMap(f => next[f.key]).filter(Boolean).join(', ');
  const familyLabel = secondary ? `${primary.label} × ${secondary.label}` : primary.label;

  picks.set(next);
  history.update(h => [{ text, familyLabel, ts: Date.now() }, ...h].slice(0, HISTORY_LIMIT));
  return { text, familyLabel, picks: next };
}
