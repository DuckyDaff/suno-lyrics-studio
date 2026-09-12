import { writable, readable } from 'svelte/store';

/** desktop views: editor | songs | settings */
export const view = writable('editor');
/** phone panel tab: ai | style | library | studio */
export const panelTab = writable('ai');
/** desktop centre workspace tab: ai | style */
export const wsTab = writable('ai');
/** desktop left panel tab: library | studio */
export const leftTab = writable('library');
/** desktop: editor takes the wide column, workspace shrinks */
export const editorFocus = writable(false);
/** phone tabs: editor | style | library | export */
export const mobileTab = writable('ai');
/** section whose textarea currently has focus */
export const activeSectionId = writable(null);
/** homograph choices per section: Map<sectionId, [{word, masc, fem, current, gender}]> */
export const homographs = writable(new Map());
/** section id whose nikud keyboard is open */
export const kbdFor = writable(null);
/** Studio Region output (not part of the song) */
export const studioText = writable('');
/** export preview overlay (desktop) */
export const modal = writable('');   // '' | 'templates' | 'import'
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
