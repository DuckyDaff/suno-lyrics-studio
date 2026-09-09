import { get } from 'svelte/store';
import { song } from './song.js';
import { buildLyrics, SUNO_CREATE_URL } from './suno.js';
import fillSource from './sunoFill.js?raw';

/** The bookmarklet: the whole filler inlined so Suno's CSP cannot block it. */
export const BOOKMARKLET = (() => {
  const body = fillSource
    .replace(/\/\*[\s\S]*?\*\//g, '')          // strip the header block comment
    .replace(/export default function sunoFill\(\)/, 'function sunoFill()')
    .replace(/\s+/g, ' ')
    .trim();
  // percent-encode so a bare % (e.g. translateX(-50%)) survives every bookmark manager
  return 'javascript:' + encodeURIComponent('(function(){' + body + ' sunoFill();})();');
})();

const b64url = str => {
  const bytes = new TextEncoder().encode(str);
  let bin = ''; bytes.forEach(b => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/** Auto title when the song has none: first chorus line, else first lyric line. */
export function autoTitle(s) {
  if (s.title && s.title.trim()) return s.title.trim();
  const chorus = s.sections.find(x => /chorus|hook/i.test(x.name) && (x.text || '').trim());
  const src = chorus || s.sections.find(x => (x.text || '').trim());
  const line = ((src && src.text) || '').split('\n').map(l => l.trim()).find(l => l && !l.startsWith('[') && !l.startsWith('('));
  return (line || '').replace(/[",.!?…]+$/g, '').slice(0, 60);
}

/** Opens suno.com/create with the song encoded in the URL fragment (never sent to a server). */
export function launchSuno() {
  const s = get(song);
  if (!s.sections.some(x => (x.text || '').trim()) && !s.style.trim()) return null;
  const payload = { t: autoTitle(s), s: s.style.trim(), l: buildLyrics(s), x: (s.exclude || '').trim(), v: 1 };
  const url = SUNO_CREATE_URL + '#md=' + b64url(JSON.stringify(payload));
  window.open(url, '_blank', 'noopener');
  return payload;
}
