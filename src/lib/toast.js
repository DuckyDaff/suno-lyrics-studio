import { writable } from 'svelte/store';
import { uid } from './persist.js';

export const toasts = writable([]);

/** type: '' | 'success' | 'error' */
export function toast(message, type = '', ms = 2200) {
  const id = uid();
  toasts.update(t => [...t, { id, message, type }]);
  setTimeout(() => toasts.update(t => t.filter(x => x.id !== id)), ms);
}
