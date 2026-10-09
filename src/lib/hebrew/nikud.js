/**
 * Nikud via the Dicta Nakdan API (proxied by /api/nikud) + homograph (gender) handling.
 * Ported from the legacy app.
 */
import { get } from 'svelte/store';
import { song } from '../song.js';
/** the open song's "who sings to whom" ('' when not set) */
export const songVoice = () => get(song)?.voice || '';

const NAKDAN_BODY = t => ({ task: 'nakdan', data: t, genre: 'modern', addmorph: false });

export const HEBREW_RE = /[א-ת]/;
export const NIKUD_RE  = /[ְ-ׇ]/;

export function stripNikud(str) { return str.replace(/[ְ-ׇ]/g, ''); }

/** Raw Dicta token array: [{word, sep, options:[...]}, …] */
export async function nakdanRaw(text) {
  const resp = await fetch('/api/nikud', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(NAKDAN_BODY(text)),
  });
  if (!resp.ok) throw new Error('HTTP ' + resp.status);
  return await resp.json();
}

/** Text with nikud (first option per word). */
export async function nakdan(text, voice = songVoice()) {
  return buildNikudText(await nakdanRaw(text), null, voice) || text;
}

/* ── homographs: same spelling, different nikud for masc / fem ───────────── */
export const HOMOGRAPH_DICT = {
  // בינוני קל / ל"ה — זכר: ֶה, נקבה: ָה
  'רוצה':  { masc: 'רוֹצֶה',    fem: 'רוֹצָה'    },
  'עושה':  { masc: 'עוֹשֶׂה',   fem: 'עוֹשָׂה'   },
  'רואה':  { masc: 'רוֹאֶה',    fem: 'רוֹאָה'    },
  'קונה':  { masc: 'קוֹנֶה',    fem: 'קוֹנָה'    },
  'בונה':  { masc: 'בּוֹנֶה',   fem: 'בּוֹנָה'   },
  'פונה':  { masc: 'פּוֹנֶה',   fem: 'פּוֹנָה'   },
  'עונה':  { masc: 'עוֹנֶה',    fem: 'עוֹנָה'    },
  'עולה':  { masc: 'עוֹלֶה',    fem: 'עוֹלָה'    },
  'שותה':  { masc: 'שׁוֹתֶה',   fem: 'שׁוֹתָה'   },
  'קורה':  { masc: 'קוֹרֶה',    fem: 'קוֹרָה'    },
  'צופה':  { masc: 'צוֹפֶה',    fem: 'צוֹפָה'    },
  'חוזה':  { masc: 'חוֹזֶה',    fem: 'חוֹזָה'    },
  'גולה':  { masc: 'גּוֹלֶה',   fem: 'גּוֹלָה'   },
  'בוכה':  { masc: 'בּוֹכֶה',   fem: 'בּוֹכָה'   },
  'יורה':  { masc: 'יוֹרֶה',    fem: 'יוֹרָה'    },
  'חיה':   { masc: 'חָיֶה',     fem: 'חָיָה'     },
  'כלה':   { masc: 'כָּלֶה',    fem: 'כָּלָה'    },
  'שרה':   { masc: 'שָׁרֶה',    fem: 'שָׁרָה'    },
  'גדה':   { masc: 'גָּדֶה',    fem: 'גָּדָה'    },
  'מורה':  { masc: 'מוֹרֶה',    fem: 'מוֹרָה'    },
  // בינוני פיעל / ל"ה
  'מנסה':  { masc: 'מְנַסֶּה',  fem: 'מְנַסָּה'  },
  'מחכה':  { masc: 'מְחַכֶּה',  fem: 'מְחַכָּה'  },
  'מגלה':  { masc: 'מְגַלֶּה',  fem: 'מְגַלָּה'  },
  'מקווה': { masc: 'מְקַוֶּה',  fem: 'מְקַוָּה'  },
  'משנה':  { masc: 'מְשַׁנֶּה', fem: 'מְשַׁנָּה' },
  'מכסה':  { masc: 'מְכַסֶּה',  fem: 'מְכַסָּה'  },
  'מקשה':  { masc: 'מַקְשֶׁה',  fem: 'מַקְשָׁה'  },
  // גוף שני עבר — קל: זכר תָּ, נקבה תְּ
  'הלכת':  { masc: 'הָלַכְתָּ',  fem: 'הָלַכְתְּ'  },
  'ידעת':  { masc: 'יָדַעְתָּ',  fem: 'יָדַעְתְּ'  },
  'אמרת':  { masc: 'אָמַרְתָּ',  fem: 'אָמַרְתְּ'  },
  'שמעת':  { masc: 'שָׁמַעְתָּ', fem: 'שָׁמַעְתְּ' },
  'שמרת':  { masc: 'שָׁמַרְתָּ', fem: 'שָׁמַרְתְּ' },
  'כתבת':  { masc: 'כָּתַבְתָּ', fem: 'כָּתַבְתְּ' },
  'אהבת':  { masc: 'אָהַבְתָּ',  fem: 'אָהַבְתְּ'  },
  'חשבת':  { masc: 'חָשַׁבְתָּ', fem: 'חָשַׁבְתְּ' },
  'פגשת':  { masc: 'פָּגַשְׁתָּ', fem: 'פָּגַשְׁתְּ' },
  'זכרת':  { masc: 'זָכַרְתָּ',  fem: 'זָכַרְתְּ'  },
  'שכחת':  { masc: 'שָׁכַחְתָּ', fem: 'שָׁכַחְתְּ' },
  'גמרת':  { masc: 'גָּמַרְתָּ', fem: 'גָּמַרְתְּ' },
  'נפלת':  { masc: 'נָפַלְתָּ',  fem: 'נָפַלְתְּ'  },
  'ישנת':  { masc: 'יָשַׁנְתָּ', fem: 'יָשַׁנְתְּ' },
  'נתת':   { masc: 'נָתַתָּ',    fem: 'נָתַתְּ'    },
  'לקחת':  { masc: 'לָקַחְתָּ',  fem: 'לָקַחְתְּ'  },
  'ישבת':  { masc: 'יָשַׁבְתָּ', fem: 'יָשַׁבְתְּ' },
  'עמדת':  { masc: 'עָמַדְתָּ',  fem: 'עָמַדְתְּ'  },
  'קמת':   { masc: 'קַמְתָּ',    fem: 'קַמְתְּ'    },
  'נסעת':  { masc: 'נָסַעְתָּ',  fem: 'נָסַעְתְּ'  },
  'ירדת':  { masc: 'יָרַדְתָּ',  fem: 'יָרַדְתְּ'  },
  'עזבת':  { masc: 'עָזַבְתָּ',  fem: 'עָזַבְתְּ'  },
  'נגעת':  { masc: 'נָגַעְתָּ',  fem: 'נָגַעְתְּ'  },
  'שרת':   { masc: 'שַׁרְתָּ',   fem: 'שַׁרְתְּ'   },
  // גוף שני עבר — ל"ה: זכר יתָ, נקבה ית
  'ראית':  { masc: 'רָאִיתָ',   fem: 'רָאִית'   },
  'רצית':  { masc: 'רָצִיתָ',   fem: 'רָצִית'   },
  'עשית':  { masc: 'עָשִׂיתָ',  fem: 'עָשִׂית'  },
  'בנית':  { masc: 'בָּנִיתָ',   fem: 'בָּנִית'   },
  'קנית':  { masc: 'קָנִיתָ',   fem: 'קָנִית'   },
  'שתית':  { masc: 'שָׁתִיתָ',  fem: 'שָׁתִית'  },
  'בכית':  { masc: 'בָּכִיתָ',   fem: 'בָּכִית'   },
  'עלית':  { masc: 'עָלִיתָ',   fem: 'עָלִית'   },
  'חיית':  { masc: 'חָיִיתָ',   fem: 'חָיִית'   },
  // פיעל ל"ה
  'ניסית': { masc: 'נִיסִּיתָ',  fem: 'נִיסִּית'  },
  'חיכית': { masc: 'חִיכִּיתָ',  fem: 'חִיכִּית'  },
  'ציפית': { masc: 'צִיפִּיתָ',  fem: 'צִיפִּית'  },
  // פיעל רגיל
  'דיברת': { masc: 'דִּיבַּרְתָּ', fem: 'דִּיבַּרְתְּ' },
  'בקשת':  { masc: 'בִּקַּשְׁתָּ', fem: 'בִּקַּשְׁתְּ' },
  'חיפשת': { masc: 'חִיפַּשְׁתָּ', fem: 'חִיפַּשְׁתְּ' },
  'ניגנת': { masc: 'נִיגַּנְתָּ', fem: 'נִיגַּנְתְּ' },
  // הפעיל
  'הבנת':  { masc: 'הֵבַנְתָּ',  fem: 'הֵבַנְתְּ'  },
  'הרגשת': { masc: 'הִרְגַּשְׁתָּ', fem: 'הִרְגַּשְׁתְּ' },
  'הבאת':  { masc: 'הֵבֵאתָ',   fem: 'הֵבֵאת'   },
  // התפעל
  'התחלת': { masc: 'הִתְחַלְתָּ', fem: 'הִתְחַלְתְּ' },
  'התעלת': { masc: 'הִתְעַלְתָּ', fem: 'הִתְעַלְתְּ' },
};

/** Which of two nikud options is masculine / feminine (heuristic). */
export function classifyGender(opt1, opt2) {
  if (/תָּ$|תָ$|תַּ$/.test(opt1)) return { masc: opt1, fem: opt2 };
  if (/תְּ$|תְ$/.test(opt1))      return { masc: opt2, fem: opt1 };
  if (/תָּ$|תָ$/.test(opt2))      return { masc: opt2, fem: opt1 };
  if (/תְּ$|תְ$/.test(opt2))      return { masc: opt1, fem: opt2 };
  if (/ָה$/.test(opt1))           return { masc: opt2, fem: opt1 };
  if (/ָה$/.test(opt2))           return { masc: opt1, fem: opt2 };
  if (/ֶת$/.test(opt1))     return { masc: opt2, fem: opt1 };
  if (/ֶת$/.test(opt2))     return { masc: opt1, fem: opt2 };
  if (/ִים$/.test(opt1))    return { masc: opt1, fem: opt2 };
  if (/ִים$/.test(opt2))    return { masc: opt2, fem: opt1 };
  return opt1.length <= opt2.length ? { masc: opt1, fem: opt2 } : { masc: opt2, fem: opt1 };
}

/** [{ word, masc, fem }] for words whose gender is ambiguous in the raw response. */
export function findGenderAmbiguous(rawData) {
  const out = [], seen = new Set();
  if (!Array.isArray(rawData)) return out;
  for (const item of rawData) {
    if (!item || item.sep) continue;
    const word = item.word ?? '';
    if (!word || seen.has(word)) continue;
    const dict = HOMOGRAPH_DICT[word];
    if (dict) { seen.add(word); out.push({ word, masc: dict.masc, fem: dict.fem }); continue; }
    const opts = item.options;
    if (!opts || opts.length < 2) continue;
    if (stripNikud(opts[0]) !== stripNikud(opts[1]) || opts[0] === opts[1]) continue;
    const { masc, fem } = classifyGender(opts[0], opts[1]);
    if (masc === fem) continue;
    seen.add(word); out.push({ word, masc, fem });
  }
  return out;
}

/** Rebuild the text from the raw response. choices: Map<originalWord, chosenNikud> */
/* ── who sings to whom: picks masculine / feminine forms by context ─────────── */
/** voice: 'm>f' | 'm>m' | 'f>m' | 'f>f' | '' — singer's gender > listener's gender */
export const VOICES = ['m>f', 'm>m', 'f>m', 'f>f'];
const parseVoice = v => (/^[mf]>[mf]$/.test(v || '') ? { from: v[0], to: v[2] } : null);

/** a clear masculine / feminine pair from two Dicta options, or null (only real gender endings count) */
// gender endings; mark order differs between sources (ת + dagesh + qamats or ת + qamats + dagesh)
const M_END = /ת[ָּ]{1,2}$|ִיתָ$|ך[ָּ]{1,2}$|ֶה$/;           // הָלַכְתָּ, רָאִיתָ, שֶׁלְּךָ, רוֹצֶה
const F_END = /ת[ְּ]{1,2}$|ִית$|[ֵָ]ךְ$|ָה$|ֶת$/;            // הָלַכְתְּ, רָאִית, שֶׁלָּךְ / בִּשְׁבִילֵךְ, רוֹצָה
const SECOND = /ת[ָּ]{1,2}$|ִיתָ$|ך[ָּ]{1,2}$/;              // "you did", "your", "to you"

/** the masculine / feminine pair among Dicta's first options (same letters), or null */
function genderPair(opts) {
  if (!opts || opts.length < 2) return null;
  const list = opts.slice(0, 8).map(o => String(o).replace(/\|/g, ''));
  const a = list[0], base = stripNikud(a);
  const other = re => list.find(o => o !== a && stripNikud(o) === base && re.test(o));
  if (M_END.test(a)) { const f = other(F_END); if (f) return { masc: a, fem: f }; }
  if (F_END.test(a)) { const m = other(M_END); if (m) return { masc: m, fem: a }; }
  return null;
}
/** Dicta sometimes offers only the masculine "you did" (חָזַרְתָּ / רָאִיתָ): derive the feminine form */
function pastPair(opts) {
  const a = opts && opts.length ? String(opts[0]).replace(/\|/g, '') : '';
  if (/ִיתָ$/.test(a)) return { masc: a, fem: a.replace(/ָ$/, '') };
  if (/ת[ָּ]{2}$/.test(a) && stripNikud(a).length >= 3 && stripNikud(a) !== 'את') return { masc: a, fem: a.replace(/ת[ָּ]{2}$/, 'תְּ') };
  return null;
}
/** 2nd person (past "you did", "your", "you" suffixes) agrees with the listener */
const secondPerson = p => SECOND.test(p.masc);
const PRON = { 'אני': 'from', 'אנוכי': 'from', 'אתה': 'm', 'את': 'f', 'הוא': 'm', 'היא': 'f' };

/** 'masc' | 'fem' for a gendered word, from the voice and the pronoun just before it in the line */
function chooseGender(pair, prev, v) {
  if (secondPerson(pair)) return v.to === 'f' ? 'fem' : 'masc';
  for (let k = prev.length - 1; k >= Math.max(0, prev.length - 3); k--) {
    const who = PRON[stripNikud(prev[k])];
    if (!who) continue;
    const g = who === 'from' ? v.from : who;
    return g === 'f' ? 'fem' : 'masc';
  }
  return v.from === 'f' ? 'fem' : 'masc';         // songs speak in the first person by default
}

/** tokens with a flag for words whose form depends on gender */
function buildTokens(rawData, choices, voice) {
  const v = parseVoice(voice);
  const out = [];
  let prev = [];
  for (const item of rawData) {
    if (typeof item === 'string') { out.push({ t: item }); if (item.includes('\n')) prev = []; continue; }
    if (!item || typeof item !== 'object') continue;
    if (item.sep) { const w = item.word ?? ''; out.push({ t: w }); if (w.includes('\n')) prev = []; continue; }
    const word = item.word ?? '';
    const chosen = choices?.get(word);
    if (chosen) { out.push({ t: chosen }); prev.push(word); continue; }
    const pair = HOMOGRAPH_DICT[word] || genderPair(item.options) || (v ? pastPair(item.options) : null);
    if (pair && v) { out.push({ t: chooseGender(pair, prev, v) === 'fem' ? pair.fem : pair.masc, g: true }); prev.push(word); continue; }
    if (pair) { out.push({ t: HOMOGRAPH_DICT[word] ? pair.masc : String(item.options[0]).replace(/\|/g, ''), g: true }); prev.push(word); continue; }
    let t;
    if (item.options?.length) t = String(item.options[0]).replace(/\|/g, '');
    else if (item.nakdan)      t = item.nakdan;
    else if (item.withNikud)   t = item.withNikud;
    else                       t = word;
    out.push({ t }); prev.push(word);
  }
  return out;
}

export function buildNikudText(rawData, choices, voice = '') {
  if (!Array.isArray(rawData)) return typeof rawData === 'string' ? rawData : '';
  return buildTokens(rawData, choices, voice).map(x => x.t).join('').trim();
}

/**
 * Re-vocalize only the gendered words of a text for a new "who sings to whom", keeping every
 * other word exactly as it is (the user's own nikud included). Returns { text, changed }.
 */
export async function regenderLyrics(text, voice) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const idx = [];
  lines.forEach((l, i) => { if (HEBREW_RE.test(l) && !/^\s*\[/.test(l) && !/^\s*(TITLE|STYLE):/i.test(l)) idx.push(i); });
  if (!idx.length) return { text, changed: 0 };
  const raw = await nakdanRaw(idx.map(i => stripNikud(lines[i])).join('\n'));
  if (!Array.isArray(raw)) return { text, changed: 0 };
  const MARK = '\u0001';
  const marked = buildTokens(raw, null, voice).map(x => (x.g ? MARK + x.t : x.t)).join('').split('\n');
  if (marked.length !== idx.length) return { text, changed: 0 };
  let changed = 0;
  idx.forEach((li, k) => {
    const a = lines[li].split(/(\s+)/), b = marked[k].split(/(\s+)/);
    if (a.length !== b.length) return;
    lines[li] = a.map((w, j) => {
      if (!b[j].includes(MARK)) return w;
      const nw = b[j].replace(MARK, '');
      if (nw !== w) changed++;
      return nw;
    }).join('');
  });
  return { text: lines.join('\n'), changed };
}

/** Hebrew words (2+ letters) that carry no nikud at all */
export function unvocalizedWords(text) {
  return String(text || '').split(/\s+/).filter(w => /[א-ת]{2,}/.test(w) && !NIKUD_RE.test(w));
}
/** keep words that already carry nikud (user picks, deliberate fixes); take Dicta's version for bare ones */
function keepVocalized(orig, voc) {
  const a = orig.split(/(\s+)/), b = String(voc || '').split(/(\s+)/);
  if (a.length !== b.length) return voc || orig;
  return a.map((w, i) => (NIKUD_RE.test(w) || !/[א-ת]/.test(w) ? w : b[i])).join('');
}
const lineNeedsNikud = l => !/^\s*\[/.test(l) && !/^\s*(TITLE|STYLE):/i.test(l) && unvocalizedWords(l).length > 0;

async function nakdanLineRetry(line, voice) {
  for (let i = 0; i < 2; i++) {
    try { const r = await nakdan(line, voice); if (r && !unvocalizedWords(r).length) return r; if (i === 1 && r) return r; }
    catch (e) { if (i === 1) throw e; }
    await new Promise(r => setTimeout(r, 400));
  }
  return line;
}

/**
 * Vocalize a whole Suno-formatted lyrics text. Section tags, TITLE:/STYLE: lines and
 * lines without Hebrew are left untouched. Pass 1 sends everything in one request;
 * pass 2 re-runs (sequentially, with a retry) any line that still has bare Hebrew words,
 * so a hiccup at Dicta cannot leave half a song unvocalized. onProgress(done, total).
 */
export async function nikudLyrics(text, onProgress, voice = songVoice()) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const idx = [];
  lines.forEach((l, i) => { if (lineNeedsNikud(l)) idx.push(i); });
  if (!idx.length) return text;
  onProgress?.(0, idx.length);
  try {
    const raw = await nakdanRaw(idx.map(i => stripNikud(lines[i])).join('\n'));
    const out = buildNikudText(raw, null, voice).split('\n');
    if (out.length === idx.length) idx.forEach((i, k) => { lines[i] = keepVocalized(lines[i], out[k]); });
  } catch {}
  // pass 2: whatever is still bare, line by line
  const left = idx.filter(i => lineNeedsNikud(lines[i]));
  onProgress?.(idx.length - left.length, idx.length);
  let k = 0;
  for (const i of left) {
    try { lines[i] = keepVocalized(lines[i], await nakdanLineRetry(stripNikud(lines[i]), voice)); } catch {}
    onProgress?.(idx.length - left.length + (++k), idx.length);
  }
  return lines.join('\n');
}

/** Nikud a text; returns { text, ambiguous } */
export async function nikudWithHomographs(text, voice = songVoice()) {
  const raw = await nakdanRaw(text);
  const out = buildNikudText(raw, null, voice) || text;
  // which form each ambiguous word got, so the per-word gender bar starts on the right button
  const fem = a => out.includes(a.fem) && !out.includes(a.masc);
  const ambiguous = findGenderAmbiguous(raw).map(a => ({ ...a, current: fem(a) ? a.fem : a.masc, gender: fem(a) ? 'fem' : 'masc' }));
  return { text: out, ambiguous };
}
