/** Cover-version recipes: what to do with an existing song. `prompt` goes to the writer verbatim. */
export const RECIPES = [
  { id: 'genre',    he: 'החלפת ז׳אנר',       en: 'Genre flip',      needsTarget: true,
    prompt: 'Re-imagine the song in the TARGET STYLE: new Style prompt for that genre, section tags and arrangement cues the genre needs ([Drop], [Rap Verse], [Instrumental Break], [Build Up]…), the rhythm and phrasing of that genre.' },
  { id: 'party',    he: 'גרסת מסיבה',        en: 'Party / dance',
    prompt: 'Turn it into an up-tempo party / dance version: driving beat (120–128 BPM), a build-up and a drop, chantable hook lines, call-and-response, energy from the first bar.' },
  { id: 'ballad',   he: 'בלדה איטית',        en: 'Slow ballad',
    prompt: 'Turn it into a slow, emotional ballad: piano or acoustic guitar, strings, intimate first verse, a big final chorus; the same words hit differently when slowed down.' },
  { id: 'acoustic', he: 'אקוסטי / מופשט',    en: 'Acoustic / stripped',
    prompt: 'A stripped-down acoustic version: one voice, acoustic guitar or piano, no drop, quiet dynamics, room for breath; simplify the arrangement tags accordingly.' },
  { id: 'lullaby',  he: 'שיר ערש',           en: 'Lullaby',
    prompt: 'A lullaby version: soft, slow, gentle vocals, music box or soft guitar, sleepy imagery, repeat the calmest lines.' },
  { id: 'kids',     he: 'גרסת ילדים',        en: 'Kids version',
    prompt: 'A children\'s version: simple clean words a 7-year-old sings along to, playful sounds, repetition, a call-and-response chorus, nothing scary or grown-up.' },
  { id: 'rap',      he: 'ראפ (פזמון נשאר שר)', en: 'Rap verses, sung chorus',
    prompt: 'Rap-ify it: the verses become rap bars (internal rhymes, flow, punchlines) while the chorus stays sung and melodic. Tag the sections [Verse: rap] / [Chorus: sung] so Suno switches delivery.' },
  { id: 'duet',     he: 'דואט',              en: 'Duet',
    prompt: 'Make it a duet: split the lines between two singers (male and female, or two contrasting voices), mark who sings what with tags like [Verse 1: female] / [Verse 2: male] / [Chorus: both], add a moment where they answer each other.' },
  { id: 'swap',     he: 'החלפת מבצע/ת',      en: 'Swap the singer',
    prompt: 'Swap the performer: if it was sung by a man make it a woman (and vice versa) — adjust gendered words, address and vocal description in the Style; keep everything else.' },
  { id: 'hasidic',  he: 'גרסה חסידית',       en: 'Hasidic version',
    prompt: 'A hasidic / Jewish celebration version: joyful clarinet-and-strings arrangement, a niggun-style wordless section (ai-ai-ai / oy-oy) as [Bridge], wedding energy, choir on the final chorus.' },
  { id: 'mizrahi',  he: 'גרסה מזרחית',       en: 'Mizrahi version',
    prompt: 'A Mizrahi / Mediterranean version: darbuka, oud, strings, melisma-friendly vowels, a [Mawwal] intro, emotional direct address, a hook word repeated in the chorus.' },
  { id: 'disney',   he: 'מחזמר דיסני',       en: 'Disney musical',
    prompt: 'A Disney-musical version: theatrical storytelling, an "I want" feel, spoken asides in parentheses, orchestral build, a key-change final chorus ([Final Chorus: key change]), optional [Choir] answers.' },
  { id: 'lang',     he: 'שפה אחרת',          en: 'Another language', needsLang: true,
    prompt: 'Translate the song into the TARGET LANGUAGE as singable lyrics: keep meaning, images and structure, re-create rhymes and syllable counts (not a literal translation). Keep the Style musically the same unless told otherwise.' },
  { id: 'parody',   he: 'פרודיה (מילים חדשות)', en: 'Parody / new words', needsTopic: true,
    prompt: 'Write a parody: keep the EXACT structure, line count, meter and rhyme positions of the original so it can be sung to the same melody, but with completely new words about the NEW TOPIC. Keep the musical Style similar.' },
  { id: 'answer',   he: 'שיר תשובה',         en: 'Answer song',
    prompt: 'Write an answer song: the other side of the story replies (the person addressed, the rival, the city, the dog…), same style and structure, references the original\'s images without copying its lines.' },
  { id: 'extend',   he: 'גרסה מורחבת',       en: 'Extended version',
    prompt: 'An extended version: add a new verse that advances the story, a bridge with a turn and a longer outro; keep the existing sections intact.' },
  { id: 'radio',    he: 'רדיו אדיט (קצר)',   en: 'Radio edit (short)',
    prompt: 'A tight radio edit under 2:30: cut to the strongest verse, chorus, one more verse, chorus, short outro; keep the hook exactly.' },
  { id: 'mashup',   he: 'מאשאפ (שני שירים)', en: 'Mashup (two songs)', needsSecond: true,
    prompt: 'Make a mashup of the two songs: alternate and weave their sections (verse of A, chorus of B, a bridge that combines both hooks), unify the tempo and key feel in one Style prompt, tag sections with which song they come from.' },
  { id: 'free',     he: 'הנחיה חופשית',      en: 'Free instruction', needsNotes: true,
    prompt: 'Follow the writer\'s instruction below for the cover version.' },
];

export const TOUCH = [
  { id: 'keep',    he: 'לשמור את המילים',  en: 'Keep the lyrics',
    prompt: 'LYRICS: keep every existing lyric line VERBATIM — same words, same order. You may only change/add section tags, arrangement cues in brackets, and backing vocals / ad-libs in parentheses, and add purely instrumental sections.' },
  { id: 'adapt',   he: 'להתאים',            en: 'Adapt',
    prompt: 'LYRICS: keep the story, the chorus hook and most lines, but adapt them to the new form — fix meter and syllable counts for the new tempo, add the hooks, ad-libs, repeats and section tags the new style needs, cut what no longer fits. Recognizably the same song.' },
  { id: 'rewrite', he: 'לכתוב מחדש',        en: 'Rewrite',
    prompt: 'LYRICS: write new lyrics on the same theme, characters and emotional arc, in the new form. Keep at most the title phrase; everything else is new.' },
];

export const COVER_LANGS = ['Hebrew', 'English', 'Hebrew and English mixed', 'Spanish', 'Italian', 'French', 'Arabic', 'Russian', 'Yiddish'];

export const recipe = id => RECIPES.find(r => r.id === id) || RECIPES[0];
export const touch = id => TOUCH.find(r => r.id === id) || TOUCH[1];
