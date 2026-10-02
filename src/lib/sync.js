/** Cloud sync of the song library via /api/songs (Redis). Last-writer-wins by updatedAt. */
import { writable, get } from 'svelte/store';
import { songs, mergeRemote } from './songs.js';
import { artists, mergeRemoteArtists } from './artists.js';
import { user } from './auth.js';
import { debounce } from './persist.js';

/** 'idle' | 'syncing' | 'ok' | 'error' | 'off' */
export const syncState = writable('idle');
export const lastSync = writable(0);

const synced = new Map();           // id → updatedAt last confirmed in the cloud
const syncedA = new Map();          // same, for artists
let started = false;

const headers = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${get(user)?.token || ''}` });

async function push(entry) {
  const r = await fetch('/api/songs', { method: 'PUT', headers: headers(), body: JSON.stringify({ song: entry }) });
  if (r.status === 401) throw new Error('unauthorized');
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'push');
  if (j.kept === 'remote' && j.song) mergeRemote([j.song]);
  synced.set(entry.id, entry.updatedAt);
}

const pushDirty = debounce(async () => {
  if (!get(user)) return;
  const dirty = get(songs).filter(s => (s.updatedAt || 0) > (synced.get(s.id) || 0));
  if (!dirty.length) return;
  syncState.set('syncing');
  try {
    for (const s of dirty) await push(s);
    syncState.set('ok'); lastSync.set(Date.now());
  } catch (e) { syncState.set(e.message === 'unauthorized' ? 'off' : 'error'); }
}, 1500);

/* artists ("hats"): same last-writer-wins, kept in /api/songs?type=artists */
const pushArtists = debounce(async () => {
  if (!get(user)) return;
  const dirty = get(artists).filter(a => (a.updatedAt || 0) > (syncedA.get(a.id) || 0));
  try {
    for (const a of dirty) {
      const r = await fetch('/api/songs?type=artists', { method: 'PUT', headers: headers(), body: JSON.stringify({ song: a }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || 'push');
      if (j.kept === 'remote' && j.song) mergeRemoteArtists([j.song]);
      syncedA.set(a.id, a.updatedAt);
    }
  } catch {}
}, 1500);

async function pullArtists() {
  try {
    const r = await fetch('/api/songs?type=artists', { headers: headers() });
    if (!r.ok) return;
    const j = await r.json();
    if (!j.ok) return;
    for (const a of j.songs) syncedA.set(a.id, a.updatedAt || 0);
    mergeRemoteArtists(j.songs);
    pushArtists();
  } catch {}
}

export async function pullAll() {
  if (!get(user)) return;
  syncState.set('syncing');
  try {
    const r = await fetch('/api/songs', { headers: headers() });
    if (r.status === 401) { syncState.set('off'); return; }
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'pull');
    for (const s of j.songs) synced.set(s.id, s.updatedAt || 0);
    mergeRemote(j.songs);
    await pullArtists();
    syncState.set('ok'); lastSync.set(Date.now());
    pushDirty();          // anything newer locally goes up
  } catch (e) { syncState.set(e.message === 'no_store' ? 'off' : 'error'); }
}

export function startSync() {
  if (started) return;
  started = true;
  songs.subscribe(() => pushDirty());
  artists.subscribe(() => pushArtists());
  let lastUser = null;
  user.subscribe(u => {
    const name = u?.username || null;
    if (name === lastUser) return;
    lastUser = name;
    if (u) pullAll(); else syncState.set('off');
  });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pullAll(); });
  setInterval(() => { if (document.visibilityState === 'visible') pullAll(); }, 90000);
}
