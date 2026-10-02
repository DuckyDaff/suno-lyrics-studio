/**
 * Artists ("hats"): recurring identities the user releases songs under, so every song of one artist
 * sounds like the same DJ / producer. An artist carries a signature sound (pasted at the start of every
 * Style), a signature voice, a writing identity, an intro ad-lib, a cover look and exclude tags.
 * Kept locally and mirrored to the cloud by sync.js (same last-writer-wins rules as songs).
 */
import { writable, derived, get } from 'svelte/store';
import { debounce, uid } from './persist.js';
import { settings, setSetting } from './settings.js';
import { song, actions } from './song.js';

const KEY = 'melodraft_v2_artists';

function load() { try { const a = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(a) ? a : []; } catch { return []; } }

export const artists = writable(load());
artists.subscribe(debounce(list => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {} }, 300));

export const artistList = derived(artists, l => l.filter(a => !a.deleted).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
export const activeArtist = derived([artists, settings], ([l, s]) => (s.artistId && l.find(a => a.id === s.artistId && !a.deleted)) || null);

export const ARTIST_FIELDS = ['name', 'emoji', 'form', 'sound', 'voice', 'writing', 'tag', 'look', 'exclude', 'notes'];

export const blankArtist = () => ({
  id: uid(), name: '', emoji: '🎧', form: '', language: '', sound: '', voice: '', writing: '', tag: '', look: '', exclude: '', notes: '',
  createdAt: Date.now(), updatedAt: Date.now(),
});

export function saveArtist(a) {
  const entry = { ...a, updatedAt: Date.now() };
  artists.update(l => { const i = l.findIndex(x => x.id === a.id); const n = [...l]; i >= 0 ? (n[i] = entry) : n.push(entry); return n; });
  return entry;
}

export function deleteArtist(id) {
  artists.update(l => l.map(x => x.id === id ? { id, name: x.name || '', deleted: true, updatedAt: Date.now() } : x));
  if (get(settings).artistId === id) setSetting('artistId', '');
}

export function useArtist(id) { setSetting('artistId', id || ''); }

/** mark the current song as released under the active artist (called when AI output or a Style is applied) */
export function tagSong() {
  const a = get(activeArtist), cur = get(song);
  if (a && cur.artist?.id !== a.id) actions.setArtist(a);
}

/** merge artists coming from the cloud (last-writer-wins by updatedAt) */
export function mergeRemoteArtists(remote) {
  artists.update(list => {
    const next = [...list];
    for (const r of remote) {
      if (!r || !r.id) continue;
      const i = next.findIndex(x => x.id === r.id);
      if (i < 0) next.push(r);
      else if ((r.updatedAt || 0) > (next[i].updatedAt || 0)) next[i] = r;
    }
    return next;
  });
}

/** what the writer model gets */
export function artistPayload(a) {
  if (!a) return null;
  const p = {};
  for (const k of ['name', 'sound', 'voice', 'writing', 'look', 'exclude']) if ((a[k] || '').trim()) p[k] = a[k].trim();
  return Object.keys(p).length ? p : null;
}

/** parse the AI 'artist' mode answer (LABEL: value lines) */
export function parseArtist(text) {
  const out = {};
  const map = { NAME: 'name', EMOJI: 'emoji', FORM: 'form', SOUND: 'sound', VOICE: 'voice', WRITING: 'writing', TAG: 'tag', LOOK: 'look', EXCLUDE: 'exclude' };
  for (const line of String(text || '').split('\n')) {
    const m = line.match(/^\s*\**([A-Z]+)\**\s*:\s*(.+)$/);
    if (m && map[m[1]]) out[map[m[1]]] = m[2].trim().replace(/^["“]|["”]$/g, '');
  }
  return out;
}
