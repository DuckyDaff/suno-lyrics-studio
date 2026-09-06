import { derived } from 'svelte/store';
import { settings } from './settings.js';
import he from './i18n/he.js';
import en from './i18n/en.js';

const dicts = { he, en };

export const lang = derived(settings, s => (dicts[s.lang] ? s.lang : 'he'));
export const dir  = derived(lang, l => (l === 'he' ? 'rtl' : 'ltr'));

/** usage in components: $t('key') or $t('key', { n: 3 }) */
export const t = derived(lang, l => (key, vars) => {
  let s = dicts[l][key] ?? he[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
});
