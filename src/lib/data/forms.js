/** Song forms for the Create tab, grouped. Values are English (they go into the prompt). */
export const FORM_GROUPS = [
  { he: 'פופ ובלדות', en: 'Pop & ballads', items: ['pop song', 'ballad', 'love song', 'breakup song', 'k-pop', 'j-pop', 'indie pop', 'singer-songwriter'] },
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
  { he: 'עולם ולטיני', en: 'World & Latin', items: ['latin pop', 'salsa', 'bossa nova', 'flamenco', 'greek / laika', 'arabic pop', 'balkan', 'bollywood', 'reggae'] },
  { he: 'ג׳אז, נשמה ואקוסטי', en: 'Jazz, soul & acoustic', items: ['jazz', 'blues', 'gospel', 'soul', 'funk', 'folk', 'country', 'lo-fi'] },
  { he: 'במה ותיאטרון', en: 'Stage', items: ['opera', 'musical theatre', 'disney musical', 'cinematic / epic'] },
  { he: 'ילדים ואירועים', en: 'Kids & occasions', items: ['children\'s song', 'lullaby', 'birthday song', 'christmas / holiday', 'anthem', 'protest song'] },
  { he: 'אחר', en: 'Other', items: ['spoken word', 'poem', 'parody / comedy'] },
];

export const FORMS = FORM_GROUPS.flatMap(g => g.items);
