/** Hebrew → Latin transliteration (with nikud: exact; without: rough). Ported from the legacy app. */
import { phoneticRespell } from './phonetic.js';

const isNikud = cp => cp >= 0x05B0 && cp <= 0x05C7;
const isHeb   = cp => cp >= 0x05D0 && cp <= 0x05EA;

const CONS = {
  'א':'', 'ב':'b','ג':'g','ד':'d','ה':'h','ו':'v','ז':'z','ח':'ch',
  'ט':'t','י':'y','כ':'k','ך':'ch','ל':'l','מ':'m','ם':'m','נ':'n',
  'ן':'n','ס':'s','ע':'' ,'פ':'p','ף':'f','צ':'ts','ץ':'ts','ק':'k',
  'ר':'r','ש':'sh','ת':'t',
};
const VOWELS = {
  'ְ': '', 'ֱ': 'e', 'ֲ': 'a', 'ֳ': 'o', 'ִ': 'i', 'ֵ': 'e', 'ֶ': 'e',
  'ַ': 'a', 'ָ': 'a', 'ֹ': 'o', 'ֺ': 'o', 'ֻ': 'u', 'ּ': '', 'ֽ': '',
  'ֿ': '', 'ׁ': '', 'ׂ': '',
};

/** Exact transliteration of nikud-bearing text. */
export function transliterateHebrew(text) {
  const chars = [...text];
  let out = '', i = 0;
  while (i < chars.length) {
    const c = chars[i], cp = c.codePointAt(0);
    if (isNikud(cp)) { i++; continue; }
    if (!isHeb(cp)) { out += c; i++; continue; }
    let j = i + 1; const marks = [];
    while (j < chars.length && isNikud(chars[j].codePointAt(0))) marks.push(chars[j++]);
    const vowels = () => marks.map(n => VOWELS[n] ?? '').join('');

    if (c === 'ו') {
      if (marks.includes('ּ')) { out += 'u'; i = j; continue; }
      if (marks.includes('ֺ') || marks.includes('ֹ')) { out += 'o'; i = j; continue; }
      out += 'v' + vowels(); i = j; continue;
    }
    if (c === 'י') {
      const last = out[out.length - 1] ?? '';
      if (marks.includes('ִ')) { if (last !== 'i') out += 'i'; i = j; continue; }
      if (!marks.length && 'aeiou'.includes(last)) { if (last !== 'i') out += 'i'; i = j; continue; }
      out += 'y' + vowels(); i = j; continue;
    }
    if (c === 'ש') { out += (marks.includes('ׂ') ? 's' : 'sh') + vowels(); i = j; continue; }
    if (c === 'ה' && !marks.length && !isHeb((chars[j] ?? ' ').codePointAt(0))) {
      const last = out[out.length - 1] ?? '';
      if (!'aeiou'.includes(last)) out += 'a';
      i = j; continue;
    }
    const dagesh = marks.includes('ּ');
    let con = CONS[c] ?? c;
    if (c === 'ב' && !dagesh) con = 'v';
    if (c === 'פ' && !dagesh) con = 'f';
    out += con + vowels();
    i = j;
  }
  return out;
}

/** Rough transliteration of bare (un-pointed) Hebrew. */
export function roughLatinize(text) {
  let out = '';
  for (const word of text.split(/(\s+|\n)/)) {
    if (!/[א-ת]/.test(word)) { out += word; continue; }
    const chars = [...word];
    let w = '';
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i], cp = c.codePointAt(0);
      if (!isHeb(cp)) { if (!isNikud(cp)) w += c; continue; }
      const next = chars[i + 1], prev = chars[i - 1];
      const nextIsHeb = !!next && isHeb(next.codePointAt(0));
      const prevIsHeb = !!prev && isHeb(prev.codePointAt(0));
      const isLast = !nextIsHeb;
      if (c === 'ו') { w += prevIsHeb ? 'o' : 'v'; continue; }
      if (c === 'י') { w += prevIsHeb ? 'i' : 'y'; continue; }
      if (c === 'ה' && isLast) { w += 'a'; continue; }
      let con = CONS[c] ?? '';
      if (c === 'ש') con = 'sh';
      if (c === 'ה' && i === 0 && next === 'ש' && chars[i + 2] === 'ת') { w += 'hi'; continue; }
      if (c === 'ה' && i === 0 && nextIsHeb) { w += 'ha'; continue; }
      if ((c === 'א' || c === 'ע') && (i === 0 || prevIsHeb)) { w += 'a'; continue; }
      w += con;
      if (con && !isLast && next !== 'ו' && next !== 'י' && next !== 'ה') w += 'a';
    }
    out += w.replace(/([aeiou])\1+/gi, '$1');
  }
  return out.trim();
}

/** Line-by-line latinization: pointed lines use the exact rules, bare lines the rough ones. */
export function latinize(text) {
  return text.split('\n').map(line => {
    if (!/[א-ת]/.test(line)) return line;
    return /[ְ-ׇ]/.test(line) ? transliterateHebrew(line) : roughLatinize(line);
  }).join('\n');
}

/** Phonetic respelling; Hebrew is latinized first. */
export function phonetic(text) {
  return phoneticRespell(/[א-ת]/.test(text) ? latinize(text) : text);
}
