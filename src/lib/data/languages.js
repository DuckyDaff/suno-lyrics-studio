/** Lyric languages for Create and Cover (English values go into the prompt). */
export const ORIGINAL = 'Original language';

export const LANGS = [
  'Hebrew', 'English', 'Hebrew and English mixed',
  'Jamaican Patois', 'Spanish', 'Portuguese (Brazilian)', 'Italian', 'French', 'German', 'Greek', 'Turkish',
  'Arabic', 'Moroccan Arabic (Darija)', 'Russian', 'Amharic', 'Hindi', 'Japanese', 'Korean',
  'Yiddish', 'Ladino', 'Aramaic',
];

/** cover tab: the original language comes first (keep what the song is written in) */
export const COVER_LANGS = [ORIGINAL, ...LANGS];
