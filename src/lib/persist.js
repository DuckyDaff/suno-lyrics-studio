import { writable } from 'svelte/store';

/** writable store mirrored to localStorage (JSON). */
export function persisted(key, initial, { migrate } = {}) {
  let value = initial;
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) value = { ...initial, ...JSON.parse(raw) };
    else if (migrate) value = { ...initial, ...(migrate() || {}) };
  } catch {}
  const store = writable(value);
  store.subscribe(v => { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} });
  return store;
}

export function debounce(fn, ms) {
  let t;
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
