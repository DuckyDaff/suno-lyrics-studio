import { persisted } from './persist.js';

/** Cover tab state (survives tab switches and reloads) */
/** a fresh Cover form (used at start and by the reset button) */
export const coverDefaults = () => ({
  source: 'library',      // library | paste | idea
  songId: '',             // library song id
  secondId: '',           // mashup partner
  title: '',              // pasted title
  lyrics: '',             // pasted lyrics
  idea: '',               // idea-only source
  recipe: 'genre',
  targetFamily: '',       // genre family id (genres.js) for the genre flip
  targetText: '',         // free-text target style
  touch: 'adapt',
  language: 'Hebrew',
  topic: '',              // parody topic
  notes: '',
  output: '',
  outMode: '',            // 'cover' | 'ideas'
  fix: null,              // last "prepare for Suno" pass: { before, changes }
});

export const coverState = persisted('melodraft_v2_cover', coverDefaults());

/** back to an empty Cover form */
export function resetCover() { coverState.set(coverDefaults()); }
export function setCover(patch) { coverState.update(s => ({ ...s, ...patch })); }
