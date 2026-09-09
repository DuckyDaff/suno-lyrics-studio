import { persisted } from './persist.js';

export const settings = persisted('melodraft_v2_settings', {
  theme: 'dark',        // dark | light | system
  lang: 'he',           // he | en
  sunoVersion: 'v5.5',  // see suno.js
  aiModel: 'fast',      // fast | quality
  editorW: 440,         // desktop editor panel width (px)
  editorCollapsed: true, // desktop editor panel starts collapsed
  bookmarkletSeen: false, // shown the Suno bookmarklet setup once
  producerTag: "It's a Denver Production", // signature ad-lib in every intro
  producerTagOn: true,
}, {
  // carry over v1 preferences
  migrate: () => ({
    theme: localStorage.getItem('melodraft_theme') || 'dark',
    lang: localStorage.getItem('melodraft_lang') || 'he',
    sunoVersion: localStorage.getItem('melodraft_suno_ver') || 'v5.5',
  }),
});

export function setSetting(key, value) {
  settings.update(s => ({ ...s, [key]: value }));
}
