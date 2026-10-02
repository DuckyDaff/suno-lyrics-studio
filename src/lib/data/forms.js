/** THE style list: one list for Create (form), the Style box (randomizer and AI Style) and the blend slots.
 *  Values are English (they go into the prompt). Every item maps to a randomizer family in genres.js. */
export const FORM_GROUPS = [
  { he: 'פופ ובלדות', en: 'Pop & ballads', items: ['pop song', 'dance pop', 'ballad', 'love song', 'breakup song', 'k-pop', 'j-pop', 'indie pop', 'singer-songwriter'] },
  { he: 'אורבני', en: 'Urban', items: ['rap / hip-hop', 'trap', 'drill', 'boom bap', 'r&b', 'afrobeats', 'reggaeton', 'dancehall', 'grime'] },
  { he: 'אלקטרוני · מועדונים · DJ', en: 'Electronic · Club · DJ', items: [
    'EDM / festival anthem', 'big room', 'future bass', 'trap EDM', 'electro house', 'hyperpop',
    'house', 'deep house', 'tech house', 'progressive house', 'melodic house & techno', 'afro house', 'organic house / downtempo',
    'minimal / microhouse', 'bass house', 'slap house / brazilian bass', 'future house', 'tropical house',
    'nu-disco / indie dance', 'disco house / french house', 'jackin house', 'chicago / acid house',
    'UK garage / 2-step', 'speed garage / bassline',
    'techno', 'melodic techno', 'peak-time techno', 'hard techno / rave', 'industrial techno', 'acid techno', 'dub techno',
    'trance', 'uplifting trance', 'progressive trance', 'vocal trance', 'psytrance', 'goa trance', 'full-on psy',
    'drum & bass', 'liquid drum & bass', 'neurofunk', 'jump-up', 'jungle',
    'dubstep', 'riddim', 'melodic dubstep',
    'hardstyle', 'rawstyle', 'hardcore / gabber', 'frenchcore', 'happy hardcore',
    'eurodance / 90s rave', 'italo disco / hi-NRG', 'electro / breakbeat', 'big beat', 'electro swing',
    'jersey club', 'baltimore club', 'footwork / juke', 'amapiano', 'gqom', 'moombahton', 'baile funk',
    'phonk / drift phonk', 'synthwave', 'chillwave / lo-fi house', 'ambient', 'IDM / glitch',
    'mizrahi dance / oriental house', 'DJ tool / extended club mix'] },
  { he: 'רוק', en: 'Rock', items: ['rock anthem', 'punk', 'metal', 'indie rock', 'alternative rock', 'pop punk', 'grunge'] },
  { he: 'ישראלי ויהודי', en: 'Israeli & Jewish', items: ['mizrahi', 'israeli rock', 'israeli pop', 'piyyut / religious', 'hasidic', 'chanukah / jewish holiday', 'wedding song'] },
  { he: 'עולם ולטיני', en: 'World & Latin', items: ['latin pop', 'salsa', 'bossa nova', 'flamenco', 'greek / laika', 'arabic pop', 'turkish pop', 'balkan', 'bollywood', 'reggae'] },
  { he: 'ג׳אז, נשמה ואקוסטי', en: 'Jazz, soul & acoustic', items: ['jazz', 'blues', 'gospel', 'soul', 'funk', 'folk', 'country', 'lo-fi'] },
  { he: 'במה ותיאטרון', en: 'Stage', items: ['opera', 'musical theatre', 'disney musical', 'cinematic / epic'] },
  { he: 'ילדים ואירועים', en: 'Kids & occasions', items: ['children\'s song', 'lullaby', 'birthday song', 'christmas / holiday', 'anthem', 'protest song'] },
  { he: 'אחר', en: 'Other', items: ['spoken word', 'poem', 'parody / comedy'] },
];

export const FORMS = FORM_GROUPS.flatMap(g => g.items);

/** form → randomizer family (genres.js id). Every form has one, and every family is reachable. */
export const FORM_FAMILY = {
  'pop song': 'pop', 'dance pop': 'dancepop', 'ballad': 'ballad', 'love song': 'ballad', 'breakup song': 'pop', 'k-pop': 'kpop', 'j-pop': 'jpop',
  'indie pop': 'indiepop', 'singer-songwriter': 'singersongwriter',
  'rap / hip-hop': 'hiphop', 'trap': 'trap', 'drill': 'drill', 'boom bap': 'hiphop', 'r&b': 'rnb', 'afrobeats': 'afrobeats',
  'reggaeton': 'reggaeton', 'dancehall': 'reggae', 'grime': 'grime',
  'EDM / festival anthem': 'edm', 'big room': 'edm', 'future bass': 'futurebass', 'trap EDM': 'trap', 'electro house': 'electro', 'hyperpop': 'hyperpop',
  'house': 'house', 'deep house': 'deephouse', 'tech house': 'techhouse', 'progressive house': 'progressive', 'melodic house & techno': 'melodictechno',
  'afro house': 'afrohouse', 'organic house / downtempo': 'afrohouse', 'minimal / microhouse': 'minimal', 'bass house': 'bassslap',
  'slap house / brazilian bass': 'bassslap', 'future house': 'bassslap', 'tropical house': 'chillwave', 'nu-disco / indie dance': 'nudisco',
  'disco house / french house': 'nudisco', 'jackin house': 'house', 'chicago / acid house': 'house',
  'UK garage / 2-step': 'ukg', 'speed garage / bassline': 'ukg',
  'techno': 'techno', 'melodic techno': 'melodictechno', 'peak-time techno': 'techno', 'hard techno / rave': 'hardtechno', 'industrial techno': 'techno',
  'acid techno': 'hardtechno', 'dub techno': 'techno',
  'trance': 'trance', 'uplifting trance': 'trance', 'progressive trance': 'trance', 'vocal trance': 'trance', 'psytrance': 'psytrance', 'goa trance': 'psytrance', 'full-on psy': 'psytrance',
  'drum & bass': 'dnb', 'liquid drum & bass': 'dnb', 'neurofunk': 'dnb', 'jump-up': 'dnb', 'jungle': 'dnb',
  'dubstep': 'dubstep', 'riddim': 'dubstep', 'melodic dubstep': 'dubstep',
  'hardstyle': 'hardstyle', 'rawstyle': 'hardstyle', 'hardcore / gabber': 'hardstyle', 'frenchcore': 'hardstyle', 'happy hardcore': 'hardstyle',
  'eurodance / 90s rave': 'eurodance', 'italo disco / hi-NRG': 'eurodance', 'electro / breakbeat': 'electro', 'big beat': 'electro', 'electro swing': 'electro',
  'jersey club': 'jerseyclub', 'baltimore club': 'jerseyclub', 'footwork / juke': 'jerseyclub', 'amapiano': 'amapiano', 'gqom': 'amapiano',
  'moombahton': 'reggaeton', 'baile funk': 'reggaeton',
  'phonk / drift phonk': 'phonk', 'synthwave': 'synthwave', 'chillwave / lo-fi house': 'chillwave', 'ambient': 'ambient', 'IDM / glitch': 'idm',
  'mizrahi dance / oriental house': 'orientalhouse', 'DJ tool / extended club mix': 'techhouse',
  'rock anthem': 'rock', 'punk': 'punk', 'metal': 'metal', 'indie rock': 'rock', 'alternative rock': 'rock', 'pop punk': 'punk', 'grunge': 'rock',
  'mizrahi': 'mizrahi', 'israeli rock': 'israelirock', 'israeli pop': 'pop', 'piyyut / religious': 'jewish', 'hasidic': 'jewish',
  'chanukah / jewish holiday': 'jewish', 'wedding song': 'mizrahi',
  'latin pop': 'latinpop', 'salsa': 'latinpop', 'bossa nova': 'bossa', 'flamenco': 'flamenco', 'greek / laika': 'greek', 'arabic pop': 'arabic',
  'turkish pop': 'turkish', 'balkan': 'balkan', 'bollywood': 'bollywood', 'reggae': 'reggae',
  'jazz': 'jazz', 'blues': 'blues', 'gospel': 'gospel', 'soul': 'rnb', 'funk': 'funk', 'folk': 'folk', 'country': 'country', 'lo-fi': 'lofi',
  'opera': 'opera', 'musical theatre': 'musical', 'disney musical': 'disney', 'cinematic / epic': 'cinematic',
  "children's song": 'kids', 'lullaby': 'lullaby', 'birthday song': 'kids', 'christmas / holiday': 'holiday', 'anthem': 'cinematic', 'protest song': 'folk',
  'spoken word': 'spoken', 'poem': 'spoken', 'parody / comedy': 'pop',
};

/** Forms that describe an occasion or a theme, not a sound: their genre tag comes from the family. */
const GENERIC = new Set(['pop song', 'love song', 'breakup song', 'anthem', 'protest song', 'wedding song', 'birthday song',
  "children's song", 'christmas / holiday', 'chanukah / jewish holiday', 'piyyut / religious', 'poem', 'parody / comedy',
  'DJ tool / extended club mix', 'rock anthem', 'EDM / festival anthem']);

const SPECIAL = { 'r&b': 'R&B', 'edm': 'EDM', 'idm': 'IDM', 'uk': 'UK', 'dj': 'DJ', 'hi-nrg': 'Hi-NRG', '2-step': '2-Step', 'k-pop': 'K-Pop', 'j-pop': 'J-Pop', '90s': '90s' };
const titleWord = w => SPECIAL[w.toLowerCase()] || w.split('-').map(p => p ? p[0].toUpperCase() + p.slice(1) : p).join('-');

/** The Suno genre tag for a form ("UK garage / 2-step" → "UK Garage, 2-Step"), or '' when the family should choose. */
export function formTag(form) {
  if (!form || GENERIC.has(form)) return '';
  return form.split('/').map(part => part.trim().split(/\s+/).map(titleWord).join(' ')).filter(Boolean).join(', ');
}
