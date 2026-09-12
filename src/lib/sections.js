/** Section types, quick-add order, and colour mapping. */
export const QUICK_SECTIONS = [
  'Verse', 'Chorus', 'Pre-Chorus', 'Bridge', 'Hook', 'Intro', 'Outro',
  'Interlude', 'Break', 'Instrumental', 'Solo',
];

const COLOR_RULES = [
  [/^intro/i,            'var(--c-intro)'],
  [/^pre[- ]?chorus/i,   'var(--c-pre)'],
  [/^(final |power )?chorus|^refrain/i, 'var(--c-chorus)'],
  [/^verse|^rap verse/i, 'var(--c-verse)'],
  [/hook/i,              'var(--c-hook)'],
  [/^bridge/i,           'var(--c-bridge)'],
  [/^(break|breakdown|drop|interlude|instrumental|solo|build)/i, 'var(--c-break)'],
  [/^(outro|coda|end)/i, 'var(--c-outro)'],
];

export function sectionColor(name = '') {
  const base = name.split(':')[0].trim();
  for (const [re, color] of COLOR_RULES) if (re.test(base)) return color;
  return 'var(--c-default)';
}

/** "Verse" → "Verse 3" if two verses already exist; "Chorus" stays "Chorus". */
export function nextName(sections, base) {
  if (!/^(verse)$/i.test(base)) return base;
  const n = sections.filter(s => new RegExp(`^${base}( \\d+)?$`, 'i').test(s.name)).length;
  return `${base} ${n + 1}`;
}
