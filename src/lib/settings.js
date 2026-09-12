import { persisted } from './persist.js';

export const settings = persisted('melodraft_v2_settings', {
  theme: 'dark',        // dark | light | system
  lang: 'he',           // he | en
  sunoVersion: 'v6',    // see suno.js
  v6Default: false,     // one-time bump of an older stored default to v6
  aiModel: 'fast',      // fast | quality
  editorW: 440,         // desktop editor panel width (px)
  editorCollapsed: true, // desktop editor panel starts collapsed
  bookmarkletSeen: false, // shown the Suno bookmarklet setup once
  producerTag: "It's a Denver Production", // signature ad-lib in every intro
  producerTagOn: true,
  autoNikud: true,     // vocalize Hebrew AI output automatically
}, {
  // carry over v1 preferences
  migrate: () => ({
    theme: localStorage.getItem('melodraft_theme') || 'dark',
    lang: localStorage.getItem('melodraft_lang') || 'he',
    sunoVersion: localStorage.getItem('melodraft_suno_ver') || 'v6',
  }),
});

// existing users: move the default once to v6 (they can still pick an older model)
settings.update(s => s.v6Default ? s : { ...s, sunoVersion: 'v6', v6Default: true });

export function setSetting(key, value) {
  settings.update(s => ({ ...s, [key]: value }));
}
