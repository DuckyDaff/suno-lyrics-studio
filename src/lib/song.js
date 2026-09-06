import { writable, get, derived } from 'svelte/store';
import { debounce, uid } from './persist.js';
import { nextName } from './sections.js';

const KEY = 'melodraft_v2_song';

const sec = (name, text = '') => ({ id: uid(), name, text, dir: 'rtl' });

export function blankSong() {
  return {
    id: uid(),
    title: '',
    style: '',
    exclude: '',
    sections: [sec('Verse 1'), sec('Chorus'), sec('Verse 2')],
    updatedAt: Date.now(),
  };
}

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s && Array.isArray(s.sections)) return s;
  } catch {}
  // migrate v1 autosave if present
  try {
    const v1 = JSON.parse(localStorage.getItem('melodraft_autosave') || 'null');
    if (v1 && Array.isArray(v1.sections)) {
      return {
        id: uid(), title: v1.title || '', style: v1.stylePrompt || '', exclude: '',
        sections: v1.sections.map(s => ({ id: uid(), name: s.name, text: s.text || '', dir: s.dir || 'rtl' })),
        updatedAt: Date.now(),
      };
    }
  } catch {}
  return null;
}

export const song = writable(load() || blankSong());
export const restoredFromSave = !!load();

/* ── autosave ── */
const save = debounce(s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }, 300);
song.subscribe(save);

/* ── undo / redo ── */
const LIMIT = 60;
let history = [JSON.stringify(get(song))];
let ptr = 0;
export const canUndo = writable(false);
export const canRedo = writable(false);
function syncFlags() { canUndo.set(ptr > 0); canRedo.set(ptr < history.length - 1); }

function commit() {
  const snap = JSON.stringify(get(song));
  if (snap === history[ptr]) return;
  history = history.slice(0, ptr + 1);
  history.push(snap);
  if (history.length > LIMIT) history.shift();
  ptr = history.length - 1;
  syncFlags();
}
const commitSoon = debounce(commit, 600);

function restore(i) {
  ptr = i;
  song.set(JSON.parse(history[ptr]));
  syncFlags();
}
export function undo() { if (ptr > 0) restore(ptr - 1); }
export function redo() { if (ptr < history.length - 1) restore(ptr + 1); }

/* ── mutations ── */
function mutate(fn, { typing = false } = {}) {
  song.update(s => { fn(s); s.updatedAt = Date.now(); return s; });
  typing ? commitSoon() : commit();
}

export const actions = {
  setTitle:   v => mutate(s => { s.title = v; }, { typing: true }),
  setStyle:   v => mutate(s => { s.style = v; }, { typing: true }),
  setExclude: v => mutate(s => { s.exclude = v; }, { typing: true }),
  setText:    (id, v) => mutate(s => { const x = s.sections.find(q => q.id === id); if (x) x.text = v; }, { typing: true }),
  setName:    (id, v) => mutate(s => { const x = s.sections.find(q => q.id === id); if (x) x.name = v; }),
  toggleDir:  id => mutate(s => { const x = s.sections.find(q => q.id === id); if (x) x.dir = x.dir === 'rtl' ? 'ltr' : 'rtl'; }),
  toggleAllDir: () => mutate(s => {
    const rtl = s.sections.filter(x => x.dir !== 'ltr').length >= s.sections.length / 2;
    s.sections.forEach(x => { x.dir = rtl ? 'ltr' : 'rtl'; });
  }),
  add: (base, text = '', afterId = null) => {
    let created;
    mutate(s => {
      created = sec(nextName(s.sections, base), text);
      const i = afterId ? s.sections.findIndex(q => q.id === afterId) : -1;
      i >= 0 ? s.sections.splice(i + 1, 0, created) : s.sections.push(created);
    });
    return created;
  },
  remove: id => mutate(s => { s.sections = s.sections.filter(q => q.id !== id); }),
  move: (id, delta) => mutate(s => {
    const i = s.sections.findIndex(q => q.id === id), j = i + delta;
    if (i < 0 || j < 0 || j >= s.sections.length) return;
    [s.sections[i], s.sections[j]] = [s.sections[j], s.sections[i]];
  }),
  replaceAll: (sections, style) => mutate(s => {
    s.sections = sections.map(x => sec(x.name, x.text || ''));
    if (style != null) s.style = style;
  }),
  newSong: () => { song.set(blankSong()); commit(); },
};

export const hasContent = derived(song, s =>
  s.sections.some(x => (x.text || '').trim()) || !!(s.style || '').trim());
