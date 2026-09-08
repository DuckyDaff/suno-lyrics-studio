/** English phonetic respelling ("galaxy" → "gal-ak-see"). Ported from the legacy app. */
const SKIP = new Set([
  'a','an','the','in','on','at','to','for','of','and','but','or','nor','so',
  'yet','is','are','was','were','be','been','being','have','has','had','do',
  'does','did','will','would','could','should','may','might','shall','this',
  'that','these','those','with','from','they','not','can','its','my','your',
  'our','his','her','their','by','as','if','up','out','no','oh','ah','it','me',
]);

export function phoneticRespell(text) {
  return text.replace(/[a-zA-Z]+/g, w => {
    const r = respellWord(w.toLowerCase());
    return /^[A-Z]/.test(w) ? r[0].toUpperCase() + r.slice(1) : r;
  });
}

function respellWord(w) {
  if (w.length <= 2 || SKIP.has(w)) return w;
  let p = w;
  p = p.replace(/^kn/, 'n').replace(/^wr/, 'r');
  p = p.replace(/tion/g, 'shun').replace(/sion(?=[^s]|$)/g, 'zhun').replace(/ture/g, 'chur');
  p = p.replace(/tch/g, 'ch').replace(/ck/g, 'k').replace(/ph/g, 'f').replace(/wh/g, 'w').replace(/qu/g, 'kw');
  p = p.replace(/x/g, 'ks').replace(/ght/g, 't').replace(/gh(?=[aeiou])/g, 'g').replace(/gh/g, '');
  p = p.replace(/c(?=[eiy])/g, 's').replace(/mb$/, 'm').replace(/gue$/, 'g');
  p = p.replace(/are|air/g, 'air').replace(/ear/g, 'eer').replace(/ar(?=[^ey])/g, 'ahr');
  p = p.replace(/ore?(?=[^a-z]|$)/g, 'or').replace(/[eiu]r(?=[^aeiou]|$)/g, 'ur');
  p = p.replace(/ee|ea/g, 'ee').replace(/ey$|ei$/g, 'ay').replace(/ai|ay/g, 'ay').replace(/oa/g, 'oh');
  p = p.replace(/oi|oy/g, 'oy').replace(/ew|eu/g, 'yoo').replace(/au|aw/g, 'aw').replace(/ow(?=[^n]|$)/g, 'oh').replace(/ou/g, 'ow');
  p = p.replace(/([^aeiou])a([^aeiouy])e$/g, '$1ay$2').replace(/([^aeiou])e([^aeiouy])e$/g, '$1ee$2')
       .replace(/([^aeiou])i([^aeiouy])e$/g, '$1y$2').replace(/([^aeiou])o([^aeiouy])e$/g, '$1oh$2')
       .replace(/([^aeiou])u([^aeiouy])e$/g, '$1yoo$2');
  p = p.replace(/y$/, 'ee').replace(/le$/, 'ul');
  return syllabify(p);
}

function syllabify(word) {
  const matches = [...word.matchAll(/[aeiouy]+/g)];
  if (matches.length <= 1) return word;
  const parts = [];
  let pos = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i], next = matches[i + 1];
    if (!next) { parts.push(word.slice(pos)); break; }
    const vEnd = m.index + m[0].length;
    const cons = word.slice(vEnd, next.index);
    const cut = cons.length <= 1 ? vEnd : vEnd + Math.ceil(cons.length / 2);
    parts.push(word.slice(pos, cut)); pos = cut;
  }
  const out = [];
  for (const part of parts) {
    if (part.length <= 1 && out.length) out[out.length - 1] += part;
    else out.push(part);
  }
  return out.join('-');
}
