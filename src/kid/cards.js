/**
 * Picture cards for Gala mode. `he` is fully vocalized (she reads Hebrew with nikud),
 * `en` feeds the AI brief, `emoji` is the picture. Style cards carry a Suno style prompt.
 */
export const STEPS = [
  { id: 'who',   q: 'מִי בַּשִּׁיר?',        emoji: '🧑‍🎤' },
  { id: 'where', q: 'אֵיפֹה זֶה קוֹרֶה?',    emoji: '🗺️' },
  { id: 'what',  q: 'מָה קוֹרֶה?',           emoji: '⚡' },
  { id: 'mood',  q: 'אֵיךְ מַרְגִּישִׁים?',   emoji: '💗' },
  { id: 'style', q: 'אֵיזֶה סִגְנוֹן?',      emoji: '🎵' },
];

export const CARDS = {
  who: [
    { id: 'me',       emoji: '🙋‍♀️', he: 'אֲנִי',            en: 'me (a 7-year-old girl)' },
    { id: 'princess', emoji: '👸',   he: 'נְסִיכָה',          en: 'a princess' },
    { id: 'unicorn',  emoji: '🦄',   he: 'חַד־קֶרֶן',         en: 'a unicorn' },
    { id: 'dog',      emoji: '🐶',   he: 'כֶּלֶב',            en: 'a dog' },
    { id: 'cat',      emoji: '🐱',   he: 'חָתוּל',            en: 'a cat' },
    { id: 'dragon',   emoji: '🐉',   he: 'דְּרָקוֹן',         en: 'a dragon' },
    { id: 'robot',    emoji: '🤖',   he: 'רוֹבּוֹט',          en: 'a robot' },
    { id: 'fairy',    emoji: '🧚',   he: 'פֵיָה',             en: 'a fairy' },
    { id: 'mermaid',  emoji: '🧜‍♀️', he: 'בַּת־יָם',          en: 'a mermaid' },
    { id: 'family',   emoji: '👨‍👩‍👧', he: 'אַבָּא וְאִמָּא', en: 'mom and dad' },
    { id: 'grandma',  emoji: '👵',   he: 'סַבְתָּא',          en: 'grandma' },
    { id: 'friends',  emoji: '👭',   he: 'חֲבֵרוֹת',          en: 'best friends' },
    { id: 'monster',  emoji: '👾',   he: 'מִפְלֶצֶת חֲמוּדָה', en: 'a cute little monster' },
    { id: 'bunny',    emoji: '🐰',   he: 'אַרְנָב',           en: 'a bunny' },
    { id: 'astro',    emoji: '👩‍🚀', he: 'אַסְטְרוֹנָאוּטִית', en: 'a girl astronaut' },
    { id: 'super',    emoji: '🦸‍♀️', he: 'גִּבּוֹרַת־עָל',    en: 'a superhero girl' },
  ],
  where: [
    { id: 'home',    emoji: '🏠', he: 'בַּבַּיִת',         en: 'at home' },
    { id: 'beach',   emoji: '🏖️', he: 'בַּיָּם',           en: 'at the beach' },
    { id: 'space',   emoji: '🚀', he: 'בֶּחָלָל',          en: 'in outer space' },
    { id: 'forest',  emoji: '🌳', he: 'בַּיַּעַר',         en: 'in a forest' },
    { id: 'castle',  emoji: '🏰', he: 'בְּטִירָה',         en: 'in a castle' },
    { id: 'school',  emoji: '🏫', he: 'בְּבֵית הַסֵּפֶר',  en: 'at school' },
    { id: 'park',    emoji: '🎡', he: 'בְּלוּנָה פַּארְק', en: 'at an amusement park' },
    { id: 'kitchen', emoji: '🍳', he: 'בַּמִּטְבָּח',      en: 'in the kitchen' },
    { id: 'clouds',  emoji: '☁️', he: 'עַל עָנָן',         en: 'on a cloud' },
    { id: 'sea',     emoji: '🐠', he: 'מִתַּחַת לַמַּיִם', en: 'under the sea' },
    { id: 'candy',   emoji: '🍭', he: 'בְּאֶרֶץ הַמַּמְתַּקִּים', en: 'in candy land' },
    { id: 'night',   emoji: '🌙', he: 'בַּלַּיְלָה',       en: 'at night under the stars' },
    { id: 'snow',    emoji: '❄️', he: 'בַּשֶּׁלֶג',         en: 'in the snow' },
    { id: 'zoo',     emoji: '🦁', he: 'בְּגַן חַיּוֹת',    en: 'at the zoo' },
  ],
  what: [
    { id: 'party',   emoji: '🎂', he: 'יוֹם הֻלֶּדֶת',     en: 'a birthday party' },
    { id: 'dance',   emoji: '💃', he: 'רוֹקְדִים',          en: 'everybody dances' },
    { id: 'fly',     emoji: '🪁', he: 'עָפִים',              en: 'learning to fly' },
    { id: 'lost',    emoji: '🧭', he: 'הָלַכְתִּי לְאִבּוּד', en: 'getting lost and finding the way home' },
    { id: 'friend',  emoji: '🤝', he: 'חָבֵר חָדָשׁ',       en: 'making a new friend' },
    { id: 'rain',    emoji: '🌧️', he: 'יוֹרֵד גֶּשֶׁם',     en: 'it starts to rain' },
    { id: 'magic',   emoji: '✨', he: 'קֶסֶם',               en: 'a magic spell' },
    { id: 'sleep',   emoji: '😴', he: 'הוֹלְכִים לִישֹׁן',  en: 'going to sleep' },
    { id: 'treasure',emoji: '💎', he: 'מְחַפְּשִׂים אוֹצָר', en: 'a treasure hunt' },
    { id: 'cook',    emoji: '🎂', he: 'אוֹפִים עוּגָה',     en: 'baking a cake' },
    { id: 'scared',  emoji: '👻', he: 'קְצָת מַפְחִיד',     en: 'something a little scary (but it turns out fine)' },
    { id: 'brave',   emoji: '💪', he: 'אֲנִי אַמִּיצָה',    en: 'being brave' },
    { id: 'miss',    emoji: '🥺', he: 'מִתְגַּעְגְּעִים',   en: 'missing someone' },
    { id: 'silly',   emoji: '🤪', he: 'שְׁטֻיּוֹת',         en: 'silly nonsense and jokes' },
    { id: 'trip',    emoji: '🚗', he: 'טִיּוּל',             en: 'a trip' },
    { id: 'win',     emoji: '🏆', he: 'מְנַצְּחִים',         en: 'winning a big race' },
  ],
  mood: [
    { id: 'happy',  emoji: '😄', he: 'שָׂמֵחַ',        en: 'happy' },
    { id: 'silly',  emoji: '🤣', he: 'מַצְחִיק',       en: 'funny and silly' },
    { id: 'calm',   emoji: '😌', he: 'רָגוּעַ',        en: 'calm and cozy' },
    { id: 'sad',    emoji: '😢', he: 'קְצָת עָצוּב',   en: 'a little sad' },
    { id: 'excite', emoji: '🤩', he: 'מְרַגֵּשׁ',      en: 'exciting' },
    { id: 'scary',  emoji: '😱', he: 'מַפְחִיד',       en: 'spooky (kid-friendly)' },
    { id: 'love',   emoji: '🥰', he: 'אוֹהֵב',         en: 'full of love' },
    { id: 'angry',  emoji: '😤', he: 'כּוֹעֵס',        en: 'a bit angry' },
  ],
  style: [
    { id: 'kpop',    emoji: '💜', he: 'קֵיי־פּוֹפּ',        en: 'K-pop', form: 'k-pop',
      style: 'K-Pop, Idol Pop, Energetic, Glossy, Synth bass, Electronic drums, Group vocals, Female vocals, Big hook, 120 BPM' },
    { id: 'pop',     emoji: '🎤', he: 'פּוֹפּ',              en: 'pop', form: 'pop song',
      style: 'Modern Pop, Catchy, Bright, Synth-driven, Upbeat, Polished production, Female vocals' },
    { id: 'disney',  emoji: '🏰', he: 'דִּיסְנִי',           en: 'Disney musical', form: 'disney musical',
      style: 'Disney Musical, Broadway, Orchestral, Soaring strings, Piano, Magical, Emotional build, Female lead vocals, Choir finale' },
    { id: 'princess',emoji: '👑', he: 'שִׁיר נְסִיכָה',      en: 'princess ballad', form: 'ballad',
      style: 'Princess Ballad, Gentle piano, Strings, Dreamy, Sweet female vocals, Magical, Slow build' },
    { id: 'rock',    emoji: '🎸', he: 'רוֹק',                en: 'rock', form: 'rock anthem',
      style: 'Kids Rock, Electric guitars, Energetic drums, Fun, Loud, Sing-along chorus' },
    { id: 'rap',     emoji: '🧢', he: 'רַאפּ',               en: 'rap', form: 'rap / hip-hop',
      style: 'Kids Hip-Hop, Bouncy beat, Playful rap, Fun, Clean, Catchy hook' },
    { id: 'disco',   emoji: '🪩', he: 'דִּיסְקוֹ',           en: 'disco', form: 'pop song',
      style: 'Disco, Funky bass, Strings, Sparkly, Dance, Feel-good, Female vocals' },
    { id: 'hasidic', emoji: '🕺', he: 'חֲסִידִי',            en: 'hasidic', form: 'hasidic',
      style: 'Hasidic Pop, Joyful, Clarinet, Strings, Uplifting, Wedding energy, Kids choir' },
    { id: 'lullaby', emoji: '🌙', he: 'שִׁיר עֶרֶשׂ',        en: 'lullaby', form: 'lullaby',
      style: 'Lullaby, Soft, Music box, Acoustic guitar, Gentle female vocals, Calm, Slow' },
    { id: 'kids',    emoji: '🧸', he: 'שִׁיר יְלָדִים',      en: "children's song", form: "children's song",
      style: 'Children Song, Playful, Ukulele, Bright, Simple melody, Happy, Sing-along' },
    { id: 'mizrahi', emoji: '🪕', he: 'מִזְרָחִי',           en: 'mizrahi', form: 'mizrahi',
      style: 'Mizrahi Pop, Darbuka, Oud, Strings, Happy, Dance, Female vocals' },
    { id: 'opera',   emoji: '🎭', he: 'אוֹפֶּרָה',           en: 'opera', form: 'opera',
      style: 'Kids Opera, Orchestral, Dramatic, Soprano, Grand, Fun' },
  ],
};

export const card = (step, id) => (CARDS[step] || []).find(c => c.id === id) || null;

/** Vocalized sentence she can read back: "שִׁיר עַל נְסִיכָה בֶּחָלָל, יוֹם הֻלֶּדֶת, שָׂמֵחַ" */
export function sentence(pick) {
  const w = card('who', pick.who), wh = card('where', pick.where), wt = card('what', pick.what), m = card('mood', pick.mood), s = card('style', pick.style);
  const parts = [];
  if (w) parts.push(w.id === 'me' ? 'שִׁיר עָלַי' : `שִׁיר עַל ${w.he}`); else parts.push('שִׁיר');
  if (wh) parts.push(wh.he);
  const tail = [];
  if (wt) tail.push(wt.he);
  if (m) tail.push(m.he);
  let out = parts.join(' ');
  if (tail.length) out += ' — ' + tail.join(', ');
  if (s) out += ` (${s.he})`;
  return out;
}

/** English/Hebrew brief for the Create tab on the parent side */
export function brief(idea, kidName = 'Gala') {
  const p = idea.cards || {};
  const w = card('who', p.who), wh = card('where', p.where), wt = card('what', p.what), m = card('mood', p.mood), s = card('style', p.style);
  const lines = [`A song invented by ${kidName}, a 7-year-old girl (she doesn't read English; the song is in Hebrew).`];
  const bits = [];
  if (w) bits.push(`about ${w.en}`); if (wh) bits.push(wh.en); if (wt) bits.push(`what happens: ${wt.en}`); if (m) bits.push(`mood: ${m.en}`);
  if (bits.length) lines.push('Her picture cards: ' + bits.join(' · ') + '.');
  if (s) lines.push(`Style she chose: ${s.en}.`);
  if (idea.transcript) lines.push(`In her own words (transcribed from her recording, keep her ideas, images and phrases): "${idea.transcript}"`);
  if (idea.description) lines.push(`Her drawing/photo, as described: ${idea.description}`);
  if (idea.note) lines.push(`Parent's note: ${idea.note}`);
  return lines.join('\n');
}
