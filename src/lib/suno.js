/** Suno model versions and their character limits. */
export const SUNO_VERSIONS = [
  { id: 'v5.5', label: 'Suno v5.5', style: 1000, lyrics: 5000 },
  { id: 'v5',   label: 'Suno v5',   style: 1000, lyrics: 5000 },
  { id: 'v4.5', label: 'Suno v4.5', style: 1000, lyrics: 5000 },
  { id: 'v4',   label: 'Suno v4',   style: 200,  lyrics: 3000 },
  { id: 'v3.5', label: 'Suno v3.5', style: 120,  lyrics: 3000 },
];

export const SUNO_CREATE_URL = 'https://suno.com/create';

export function limits(versionId) {
  return SUNO_VERSIONS.find(v => v.id === versionId) || SUNO_VERSIONS[0];
}

/** 'ok' | 'warn' | 'over' */
export function levelFor(len, limit) {
  if (len > limit) return 'over';
  if (len > limit * 0.85) return 'warn';
  return 'ok';
}

/** Builds the lyrics text exactly as it should be pasted into Suno. */
export function buildLyrics(song) {
  return song.sections.map(sec => {
    const text = (sec.text || '').trim();
    if (text.startsWith('[')) return text;          // section carries its own header
    return `[${sec.name}]\n${text}`;
  }).join('\n\n').trim();
}
