import { writable, readable } from 'svelte/store';

/** desktop views: editor | songs | settings */
export const view = writable('editor');
/** right-panel tab: style | library | studio */
export const panelTab = writable('style');
/** phone tabs: editor | style | library | export */
export const mobileTab = writable('editor');
/** section whose textarea currently has focus */
export const activeSectionId = writable(null);
/** export preview overlay (desktop) */
export const previewOpen = writable(false);

function mq(query) {
  return readable(false, set => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia(query);
    set(m.matches);
    const h = e => set(e.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  });
}
export const isPhone = mq('(max-width: 768px)');
