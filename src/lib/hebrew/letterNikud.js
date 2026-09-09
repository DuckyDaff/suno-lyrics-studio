/**
 * Per-letter nikud editing: find the Hebrew letter at the caret, read its marks,
 * build the alternatives to offer, and write a new mark set back.
 */
const LETTER = /[א-ת]/;
const MARK = /[ְ-ׇֽֿׁׂ]/;   // vowels, dagesh, meteg, rafe, shin/sin dots, qamats qatan

export const VOWELS = [
  { ch: '',  name: 'ללא',   en: 'none' },
  { ch: 'ְ', name: 'שווא',  en: 'shva' },
  { ch: 'ִ', name: 'חיריק', en: 'hiriq' },
  { ch: 'ֵ', name: 'צירה',  en: 'tsere' },
  { ch: 'ֶ', name: 'סגול',  en: 'segol' },
  { ch: 'ַ', name: 'פתח',   en: 'patah' },
  { ch: 'ָ', name: 'קמץ',   en: 'kamatz' },
  { ch: 'ֹ', name: 'חולם',  en: 'holam' },
  { ch: 'ֻ', name: 'קובוץ', en: 'kubutz' },
];
export const HATAFS = [
  { ch: 'ֲ', name: 'חטף פתח', en: 'hataf patah' },
  { ch: 'ֱ', name: 'חטף סגול', en: 'hataf segol' },
  { ch: 'ֳ', name: 'חטף קמץ', en: 'hataf kamatz' },
];
const VOWEL_SET = new Set([...VOWELS, ...HATAFS].map(v => v.ch).filter(Boolean));
const DAGESH = 'ּ', SHIN = 'ׁ', SIN = 'ׂ';

/** Locate the letter the caret is on/after: { index, letter, marks, start, end } or null */
export function letterAtCaret(text, caret) {
  let i = caret - 1;
  while (i >= 0 && MARK.test(text[i])) i--;
  if (i < 0 || !LETTER.test(text[i])) {
    // nothing before — try the letter right after the caret
    if (caret < text.length && LETTER.test(text[caret])) i = caret; else return null;
  }
  let end = i + 1;
  while (end < text.length && MARK.test(text[end])) end++;
  const marks = text.slice(i + 1, end);
  return { index: i, letter: text[i], marks, start: i + 1, end, ...parse(marks) };
}

export function parse(marks) {
  const st = { vowel: '', dagesh: false, shin: false, sin: false, other: '' };
  for (const c of marks) {
    if (VOWEL_SET.has(c)) st.vowel = c;
    else if (c === DAGESH) st.dagesh = true;
    else if (c === SHIN) st.shin = true;
    else if (c === SIN) st.sin = true;
    else st.other += c;
  }
  return st;
}

/** compose marks in canonical order */
export function compose({ vowel = '', dagesh = false, shin = false, sin = false, other = '' }) {
  return (vowel + (dagesh ? DAGESH : '') + (shin ? SHIN : '') + (sin ? SIN : '') + other).normalize('NFC');
}

export const isGuttural = l => 'אהחע'.includes(l);
export const isShin = l => l === 'ש';
export const isVav = l => l === 'ו';
export const canDagesh = l => !'אעחר'.includes(l) && l !== 'ו';   // vav's dot is shuruk, offered separately

/** Write `marks` after the letter described by `hit` into textarea `ta`. */
export function writeMarks(ta, hit, marks) {
  ta.setRangeText(marks, hit.start, hit.end, 'end');
  ta.dispatchEvent(new Event('input', { bubbles: true }));
  return { ...hit, marks, end: hit.start + marks.length, ...parse(marks) };
}

/** Pixel position of a caret index inside a textarea (mirror-div technique). */
export function caretCoords(ta, index) {
  const div = document.createElement('div');
  const cs = getComputedStyle(ta);
  for (const p of ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'letterSpacing', 'lineHeight', 'textTransform', 'wordSpacing',
    'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth',
    'boxSizing', 'direction', 'textAlign', 'tabSize']) div.style[p] = cs[p];
  Object.assign(div.style, { position: 'absolute', visibility: 'hidden', whiteSpace: 'pre-wrap', wordWrap: 'break-word', overflowWrap: 'break-word',
    top: '0', left: '0', width: ta.clientWidth + 'px', unicodeBidi: 'plaintext' });
  div.textContent = ta.value.slice(0, index);
  const span = document.createElement('span');
  span.textContent = ta.value.slice(index, index + 1) || '.';
  div.appendChild(span);
  ta.parentNode.appendChild(div);
  const r = { top: span.offsetTop - ta.scrollTop, left: span.offsetLeft, width: span.offsetWidth, height: span.offsetHeight || parseFloat(cs.lineHeight) || 24 };
  div.remove();
  return r;
}
