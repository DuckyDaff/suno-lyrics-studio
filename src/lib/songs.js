/**
 * Song library: every song the user worked on, kept locally (localStorage) and
 * mirrored to the cloud by sync.js. The `song` store (song.js) is the one being
 * edited; this module keeps it upserted in the library and offers open / new /
 * duplicate / delete / versions.
 */
import { writable, derived, get } from 'svelte/store';
import { song, blankSong, resetHistory } from './song.js';
import { debounce, uid } from './persist.js';

const KEY = 'melodraft_v2_songs';
const MAX_VERSIONS = 20;

function load() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }

/** [{ id, title, style, exclude, sections, updatedAt, createdAt, deleted?, versions? }] */
export const songs = writable(load());
songs.subscribe(debounce(list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }, 300));

/** visible (non-deleted) songs, newest first */
export const songList = derived(songs, list =>
  list.filter(s => !s.deleted).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));

let applying = false;   // true while we replace the current song from the library (avoid echo)

// keep the current song upserted in the library
song.subscribe(s => {
  if (applying || !s || !s.id) return;
  songs.update(list => {
    const i = list.findIndex(x => x.id === s.id);
    const prev = i >= 0 ? list[i] : null;
    if (!prev && !s.title && !s.style && !s.sections.some(q => (q.text || '').trim())) return list;
    const entry = { ...s, createdAt: prev?.createdAt || s.createdAt || s.updatedAt || Date.now(), versions: prev?.versions || [], deleted: false };
    if (prev && JSON.stringify(prev) === JSON.stringify(entry)) return list;
    const next = [...list];
    i >= 0 ? (next[i] = entry) : next.push(entry);
    return next;
  });
});

const strip = e => { const { versions, createdAt, deleted, ...rest } = e; return rest; };

export function openSong(id) {
  const e = get(songs).find(x => x.id === id && !x.deleted);
  if (!e) return false;
  applying = true;
  song.set(strip(e));
  resetHistory();
  applying = false;
  return true;
}

export function newSong() {
  applying = true;
  song.set(blankSong());
  resetHistory();
  applying = false;
}

export function duplicateSong(id) {
  const e = get(songs).find(x => x.id === id);
  if (!e) return;
  const copy = { ...strip(e), id: uid(), title: e.title ? e.title + ' (2)' : '', updatedAt: Date.now(), createdAt: Date.now(), versions: [] };
  songs.update(l => [...l, copy]);
  openSong(copy.id);
}

export function deleteSong(id) {
  songs.update(l => l.map(x => x.id === id ? { id, title: x.title || '', deleted: true, updatedAt: Date.now() } : x));
  if (get(song).id === id) {
    const next = get(songList)[0];
    next ? openSong(next.id) : newSong();
  }
}

/** snapshot the current song into its version list */
export function saveVersion(label = '') {
  const s = get(song);
  songs.update(l => l.map(x => x.id === s.id
    ? { ...x, versions: [{ ts: Date.now(), label, title: s.title, style: s.style, exclude: s.exclude, sections: s.sections.map(q => ({ ...q })) }, ...(x.versions || [])].slice(0, MAX_VERSIONS) }
    : x));
}

export function restoreVersion(songId, ts) {
  const e = get(songs).find(x => x.id === songId);
  const v = e?.versions?.find(q => q.ts === ts);
  if (!v) return false;
  applying = true;
  song.set({ ...strip(e), title: v.title, style: v.style, exclude: v.exclude || '', sections: v.sections.map(q => ({ ...q })), updatedAt: Date.now() });
  resetHistory();
  applying = false;
  return true;
}

export function deleteVersion(songId, ts) {
  songs.update(l => l.map(x => x.id === songId ? { ...x, versions: (x.versions || []).filter(q => q.ts !== ts) } : x));
}

/** merge songs coming from the cloud (last-writer-wins by updatedAt) */
export function mergeRemote(remote) {
  let changedCurrent = false;
  songs.update(list => {
    const next = [...list];
    for (const r of remote) {
      if (!r || !r.id) continue;
      const i = next.findIndex(x => x.id === r.id);
      const l = i >= 0 ? next[i] : null;
      if (!l || (r.updatedAt || 0) > (l.updatedAt || 0)) {
        const merged = r.deleted ? r : { ...r, versions: r.versions || l?.versions || [], createdAt: r.createdAt || l?.createdAt || r.updatedAt };
        i >= 0 ? (next[i] = merged) : next.push(merged);
        if (get(song).id === r.id) changedCurrent = true;
      }
    }
    return next;
  });
  if (changedCurrent) {
    const cur = get(songs).find(x => x.id === get(song).id);
    if (cur && !cur.deleted) { applying = true; song.set(strip(cur)); applying = false; }
  }
}
