/*
 * Runs INSIDE suno.com (as a bookmarklet). Reads the MeloDraft payload from the URL
 * fragment (#md=…), switches to Custom mode and fills Title / Style / Lyrics / Exclude.
 * Self-contained: no external requests, so Suno's CSP cannot block it.
 * Keep this file free of line comments below this block — it is collapsed to one line.
 */
export default function sunoFill() {
  var Q = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };
  var toast = function (msg, ok) {
    var d = document.createElement('div');
    d.textContent = msg;
    d.style.cssText = 'position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:999999;background:' + (ok ? '#0e7490' : '#b91c1c') + ';color:#fff;font:600 14px system-ui;padding:10px 16px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.4);direction:rtl;max-width:90vw';
    document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, 6000);
  };
  var payload = null;
  try {
    var m = /[#&]md=([^&]+)/.exec(location.hash);
    if (m) {
      var b64 = m[1].replace(/-/g, '+').replace(/_/g, '/');
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      payload = JSON.parse(new TextDecoder().decode(bytes));
    }
  } catch (e) { payload = null; }
  if (!payload) { toast('MeloDraft: לא נמצא טקסט לשיגור — פתח את Suno דרך הכפתור "שגר ל-Suno"', false); return; }

  var textOf = function (el) {
    return ((el.getAttribute('placeholder') || '') + ' ' + (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('name') || '') + ' ' + (el.id || '') + ' ' + ((el.labels && el.labels[0] && el.labels[0].textContent) || '')).toLowerCase();
  };
  var fields = function () {
    var els = Q('textarea, input[type="text"], input:not([type]), [contenteditable="true"]');
    var f = { lyrics: null, style: null, title: null, exclude: null };
    els.forEach(function (el) {
      var t = textOf(el);
      if (!t.trim() && el.getAttribute('contenteditable') === 'true') {
        var box = el.closest('[class*="lyric" i], [data-testid*="lyric" i], section, form') || el.parentElement;
        t = ((box && box.textContent) || '').slice(0, 400).toLowerCase();
      }
      if (/exclude/.test(t)) { if (!f.exclude) f.exclude = el; }
      else if (/style/.test(t)) { if (!f.style) f.style = el; }
      else if (/lyric/.test(t)) { if (!f.lyrics) f.lyrics = el; }
      else if (/title/.test(t)) { if (!f.title) f.title = el; }
    });
    return f;
  };
  var setValue = function (el, text) {
    if (!el || text == null) return false;
    el.focus();
    if (el.getAttribute('contenteditable') === 'true') {
      var sel = window.getSelection(); var range = document.createRange();
      range.selectNodeContents(el); sel.removeAllRanges(); sel.addRange(range);
      var ok = false;
      try { ok = document.execCommand('insertText', false, text); } catch (e) { ok = false; }
      if (!ok) { el.textContent = text; el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text })); }
      return true;
    }
    var proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(el, text);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  };
  var ensureCustom = function () {
    var f = fields();
    if (f.lyrics) return true;
    var toggles = Q('button, [role="switch"], [role="tab"], label').filter(function (el) {
      return /^\s*(custom|advanced|מותאם|מתקדם)\s*$/i.test(el.textContent || '') || /custom|advanced/i.test(el.getAttribute('aria-label') || '');
    });
    if (toggles.length) { toggles[0].click(); return false; }
    return false;
  };
  var attempt = 0;
  var fill = function () {
    attempt++;
    var ready = ensureCustom();
    var f = fields();
    if (!f.lyrics && attempt < 12) { setTimeout(fill, 350); return; }
    var done = [];
    if (payload.t && setValue(f.title, payload.t)) done.push('Title');
    if (payload.s && setValue(f.style, payload.s)) done.push('Style');
    if (payload.x && setValue(f.exclude, payload.x)) done.push('Exclude');
    if (payload.l && setValue(f.lyrics, payload.l)) done.push('Lyrics');
    if (done.length) toast('MeloDraft מילא: ' + done.join(' · ') + ' — עכשיו Create ✨', true);
    else toast('MeloDraft: לא מצאתי את שדות הטופס. ודא שאתה במסך Create במצב Custom.', false);
    if (!f.lyrics && payload.l) { try { navigator.clipboard.writeText(payload.l); } catch (e) {} }
  };
  fill();
}
