import { persisted } from './persist.js';

/** Cover tab state (survives tab switches and reloads) */
export const coverState = persisted('melodraft_v2_cover', {
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
});
export function setCover(patch) { coverState.update(s => ({ ...s, ...patch })); }
