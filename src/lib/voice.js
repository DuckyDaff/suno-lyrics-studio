/**
 * "Who sings to whom" is a song-level setting (song.voice). Changing it re-vocalizes only the
 * gendered words everywhere the song's text lives: the editor, the Create result and the Cover result.
 */
import { get, writable } from 'svelte/store';
import { song, actions } from './song.js';
import { genState, setGen } from './genState.js';
import { coverState, setCover } from './coverState.js';
import { regenderLyrics, HEBREW_RE } from './hebrew/nikud.js';

export const voiceBusy = writable(false);

/** set the voice and fix gendered nikud; resolves to the number of words changed (or -1 on failure) */
export async function applyVoice(v) {
  if ((get(song).voice || '') === (v || '')) return 0;
  actions.setVoice(v);
  if (!v) return 0;
  voiceBusy.set(true);
  let n = 0;
  try {
    for (const x of get(song).sections) {
      if (!HEBREW_RE.test(x.text || '')) continue;
      const r = await regenderLyrics(x.text, v);
      if (r.changed) { actions.setText(x.id, r.text); n += r.changed; }
    }
    const g = get(genState);
    if (g.output && (g.outMode === 'song' || g.outMode === 'wild') && HEBREW_RE.test(g.output)) {
      const r = await regenderLyrics(g.output, v);
      if (r.changed) { setGen({ output: r.text }); n += r.changed; }
    }
    const c = get(coverState);
    if (c.output && c.outMode === 'cover' && HEBREW_RE.test(c.output)) {
      const r = await regenderLyrics(c.output, v);
      if (r.changed) { setCover({ output: r.text }); n += r.changed; }
    }
    return n;
  } catch { return -1; }
  finally { voiceBusy.set(false); }
}
