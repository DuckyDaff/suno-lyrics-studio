/**
 * Nikud via the Dicta Nakdan API (proxied by /api/nikud) + homograph (gender) handling.
 * Ported from the legacy app.
 */
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
export async function nakdan(text) {
  return buildNikudText(await nakdanRaw(text), null) || text;
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
export function buildNikudText(rawData, choices) {
  if (!Array.isArray(rawData)) return typeof rawData === 'string' ? rawData : '';
  const parts = [];
  for (const item of rawData) {
    if (typeof item === 'string') { parts.push(item); continue; }
    if (!item || typeof item !== 'object') continue;
    if (item.sep) { parts.push(item.word ?? ''); continue; }
    const chosen = choices?.get(item.word);
    if (chosen) { parts.push(chosen); continue; }
    const dict = HOMOGRAPH_DICT[item.word ?? ''];
    if (dict) { parts.push(dict.masc); continue; }
    if (item.options?.length) parts.push(String(item.options[0]).replace(/\|/g, ''));
    else if (item.nakdan)      parts.push(item.nakdan);
    else if (item.withNikud)   parts.push(item.withNikud);
    else                       parts.push(item.word ?? '');
  }
  return parts.join('').trim();
}

/**
 * Vocalize a whole Suno-formatted lyrics text. Section tags, TITLE:/STYLE: lines and
 * lines without Hebrew are left untouched; everything else goes to Dicta in one request.
 */
export async function nikudLyrics(text) {
  const lines = String(text || '').replace(/\r/g, '').split('\n');
  const keep = l => /^\s*\[/.test(l) || /^\s*(TITLE|STYLE):/i.test(l) || !HEBREW_RE.test(l);
  const idx = [];
  lines.forEach((l, i) => { if (!keep(l)) idx.push(i); });
  if (!idx.length) return text;
  const raw = await nakdanRaw(idx.map(i => lines[i]).join('\n'));
  const out = buildNikudText(raw, null).split('\n');
  if (out.length !== idx.length) {           // separator mismatch — fall back to per-line
    const res = await Promise.all(idx.map(i => nakdan(lines[i]).catch(() => lines[i])));
    idx.forEach((i, k) => { lines[i] = res[k]; });
    return lines.join('\n');
  }
  idx.forEach((i, k) => { lines[i] = out[k]; });
  return lines.join('\n');
}

/** Nikud a text; returns { text, ambiguous } */
export async function nikudWithHomographs(text) {
  const raw = await nakdanRaw(text);
  return { text: buildNikudText(raw, null) || text, ambiguous: findGenderAmbiguous(raw) };
}
