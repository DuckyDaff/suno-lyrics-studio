/** Nikud keyboard: marks + caret-level insert / replace / delete on a textarea. */
export const MARKS = [
  { ch: 'ְ', name: 'שווא',     en: 'shva',        glyph: 'וְ' },
  { ch: 'ֱ', name: 'ח.סגול',   en: 'hataf segol', glyph: 'וֱ' },
  { ch: 'ֲ', name: 'ח.פתח',    en: 'hataf patah', glyph: 'וֲ' },
  { ch: 'ֳ', name: 'ח.קמץ',    en: 'hataf kamatz',glyph: 'וֳ' },
  { ch: 'ִ', name: 'חיריק',    en: 'hiriq',       glyph: 'וִ' },
  { ch: 'ֵ', name: 'צרי',      en: 'tsere',       glyph: 'וֵ' },
  { ch: 'ֶ', name: 'סגול',     en: 'segol',       glyph: 'וֶ' },
  { ch: 'ַ', name: 'פתח',      en: 'patah',       glyph: 'וַ' },
  { ch: 'ָ', name: 'קמץ',      en: 'kamatz',      glyph: 'וָ' },
  { ch: 'ֹ', name: 'חולם',     en: 'holam',       glyph: 'וֹ' },
  { ch: 'ֻ', name: 'קיבוץ',    en: 'kubutz',      glyph: 'וֻ' },
  { ch: 'ּ', name: 'שורוק',    en: 'shuruk',      glyph: 'וּ' },
];
export const MARKS2 = [
  { ch: 'ּ', name: 'דגש',      en: 'dagesh',      glyph: 'בּ' },
  { ch: 'ׁ', name: 'שין ימין', en: 'shin dot',    glyph: 'שׁ' },
  { ch: 'ׂ', name: 'שין שמאל', en: 'sin dot',     glyph: 'שׂ' },
  { ch: 'ֽ', name: 'מטג',      en: 'meteg',       glyph: 'אֽ' },
];
const NIKUD = /[ְ-ׇ]/;

/** Insert `mark` at the caret; a mark adjacent to the caret is replaced instead of stacked. */
export function insertMark(ta, mark) {
  const pos = ta.selectionStart, v = ta.value;
  if (pos > 0 && NIKUD.test(v[pos - 1]))      ta.setRangeText(mark, pos - 1, pos, 'end');
  else if (pos < v.length && NIKUD.test(v[pos])) ta.setRangeText(mark, pos, pos + 1, 'end');
  else                                          ta.setRangeText(mark, pos, pos, 'end');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Delete the nikud mark before (or after) the caret. */
export function deleteMark(ta) {
  const pos = ta.selectionStart, v = ta.value;
  if (pos > 0 && NIKUD.test(v[pos - 1]))         ta.setRangeText('', pos - 1, pos, 'end');
  else if (pos < v.length && NIKUD.test(v[pos])) ta.setRangeText('', pos, pos + 1, 'start');
  else return false;
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

/** { text, start, end } for the selection, or the word under the caret; null if none. */
export function wordAtCursor(ta) {
  const text = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  if (s !== e) return { text: text.substring(s, e), start: s, end: e };
  const isWord = ch => /[א-תְ-ׇa-zA-Z’'-]/.test(ch);
  let a = s, b = s;
  while (a > 0 && isWord(text[a - 1])) a--;
  while (b < text.length && isWord(text[b])) b++;
  return a === b ? null : { text: text.substring(a, b), start: a, end: b };
}
