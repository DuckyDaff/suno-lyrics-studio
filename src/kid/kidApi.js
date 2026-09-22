/** Gala mode: kid token, API calls, draft persistence, text-to-speech. */
import { writable, get } from 'svelte/store';

const TOKEN_KEY = 'melodraft_kid';
const DRAFT_KEY = 'melodraft_kid_draft';

function loadKid() {
  try {
    const u = new URL(location.href);
    const k = u.searchParams.get('k');
    if (k) {
      const b64 = k.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0))));
      const kid = { token: k, name: payload.name || 'גאלה', owner: payload.owner };
      localStorage.setItem(TOKEN_KEY, JSON.stringify(kid));
      // keep ?k= in the address on purpose: an iOS home-screen app launches with the URL it was saved
      // from and has its own storage, so the token must travel in the URL itself
      return kid;
    }
    return JSON.parse(localStorage.getItem(TOKEN_KEY) || 'null');
  } catch { return null; }
}
export const kid = writable(loadKid());

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function loadDraft() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch { return null; } }
export const draft = writable(loadDraft());
draft.subscribe(d => { try { d ? localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) : localStorage.removeItem(DRAFT_KEY); } catch {} });
export const newDraft = () => ({ id: uid(), cards: {}, takes: [], drawing: null, photo: null, createdAt: Date.now() });

const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${get(kid)?.token || ''}` });
async function call(action, body, method = 'POST') {
  const r = await fetch(`/api/kid?action=${action}`, { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw Object.assign(new Error(j.error || 'error'), { code: j.error || 'error', status: r.status, detail: j.detail });
  return j;
}
export const api = {
  list: () => call('list', null, 'GET'),
  saveIdea: idea => call('idea', { idea }),
  deleteFile: path => call('delete-file', { path }).catch(() => {}),
  async upload(blob, kind) {
    const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
    return call('upload', { type: blob.type, data, kind });
  },
};
export const fileUrl = path => `/api/kid?action=file&p=${encodeURIComponent(path)}&t=${encodeURIComponent(get(kid)?.token || '')}`;

/* ── speech ── */
export const stripNikud = s => String(s || '').replace(/[ְ-ׇֽֿׁׂ]/g, '');
let voice = null;
const VOICE_KEY = 'melodraft_kid_voice';
const FEMALE = /carmit|female|woman|girl|נקבה|kar[m]?it|sharon|inbal|maya|noa|shira|tamar/i;
const MALE = /male|man|boy|זכר|gilad|guy|yaron|elad|david|asaf|eitan|ido/i;
/** Hebrew voices available on this device */
export function hebrewVoices() {
  try { return speechSynthesis.getVoices().filter(v => /^he/i.test(v.lang)); } catch { return []; }
}
export function pickVoice(force = false) {
  if ((voice && !force) || !('speechSynthesis' in window)) return;
  const vs = hebrewVoices();
  const wanted = localStorage.getItem(VOICE_KEY);
  voice = (wanted && vs.find(v => v.name === wanted))
    || vs.find(v => FEMALE.test(v.name))
    || vs.find(v => !MALE.test(v.name) && v.localService)
    || vs.find(v => !MALE.test(v.name))
    || vs[0] || null;
}
export function setVoice(name) { try { name ? localStorage.setItem(VOICE_KEY, name) : localStorage.removeItem(VOICE_KEY); } catch {} pickVoice(true); }
export const currentVoiceName = () => (voice && voice.name) || '';
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = () => pickVoice(true); }
/* ── cloud voice (natural, via the server; cached per phrase) ── */
export const CLOUD_VOICES = [['nova', 'נוֹבָה'], ['shimmer', 'שִׁימֶר'], ['coral', 'קוֹרָל'], ['sage', 'סֵייג׳']];
const voicePref = () => { try { return localStorage.getItem(VOICE_KEY) || 'cloud:nova'; } catch { return 'cloud:nova'; } };
export const isCloudVoice = () => voicePref().startsWith('cloud:');
const cloudVoiceId = () => voicePref().replace(/^cloud:/, '');
let audioEl = null, unlocked = false;
const SILENT = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQxAADB8AhSmxhIIEVCSiJrDCQBTcu3UrAIwUdkRgQbFAZC1CQEwTJ9mjRvBA4UOLD8nKVOWfh+UlK3z/177OXrfOdKl7pyn3Xf//WreyTRUoAWgBgkOAGbZHBgG1OF6zM82DWbZaUmMBptgQhGjsyYqc9ae9XFz280948NMBWInluyfN9dBNYb5yXf1rIlWKD3mOpSbYVjOwc8k/8N/wAAAADiAcgtNAAAAAAAAAAAAAAAAAAAA//tQxAoBBXRDaBtYAAB4Iv0YZtANWLlIxFxJYS6ss1BJnqvDo6WBJ5r1SKCU5IPHUJj8u2cFNFxmwnCXPdlgHPT5cW9m1HmdwcjqFxE1oDGXeCWPMhrDTGVsKl3AfnGPbAAABBAaAeIBPYb0uvktCjCnyJ4oZ6HZuMLL2pLOiyxzHB97TcZLMEV1NbEsjRcuLh/Sgq8xzEvG3pBfBGzHGWuDPyMBQQiCbyZzk8s+AAAA';
/** call from a user gesture: lets iOS play later audio from code (same element stays unlocked) */
export function unlockAudio() {
  if (unlocked) return;
  try { audioEl = audioEl || new Audio(); audioEl.src = SILENT; audioEl.play().then(() => { unlocked = true; }).catch(() => {}); } catch {}
}
function sayCloud(text, maxMs) {
  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; clearTimeout(t); resolve(true); } };
    const fail = () => { if (!done) { done = true; clearTimeout(t); resolve(false); } };
    const t = setTimeout(finish, maxMs);
    try {
      audioEl = audioEl || new Audio();
      audioEl.onended = finish; audioEl.onerror = fail;
      audioEl.src = `/api/kid?action=tts&v=${encodeURIComponent(cloudVoiceId())}&text=${encodeURIComponent(stripNikud(text))}&t=${encodeURIComponent(get(kid)?.token || '')}`;
      audioEl.play().catch(fail);
    } catch { fail(); }
  });
}

/** Speak `text`; resolves when it finished (or after maxMs as a safety net). */
export async function say(text, maxMs = 6000) {
  if (!text) return;
  if (isCloudVoice() && get(kid)) {
    try { speechSynthesis.cancel(); } catch {}
    if (await sayCloud(text, Math.max(maxMs, 8000))) return;
  }
  return sayDevice(text, maxMs);
}
function sayDevice(text, maxMs) {
  return new Promise(resolve => {
    if (!('speechSynthesis' in window) || !text) return resolve();
    let done = false;
    const finish = () => { if (!done) { done = true; clearTimeout(t); resolve(); } };
    const t = setTimeout(finish, maxMs);
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(stripNikud(text));
      u.lang = 'he-IL'; u.rate = 0.9; u.pitch = 1.15;
      pickVoice(); if (voice) u.voice = voice;
      u.onend = finish; u.onerror = finish;
      // iOS sometimes needs a tick after cancel() before speak() is honoured
      setTimeout(() => { try { speechSynthesis.speak(u); } catch { finish(); } }, 30);
    } catch { finish(); }
  });
}

/* ── tiny sounds (no assets) ── */
let actx = null;
export function beep(freq = 880, ms = 120, type = 'sine', vol = 0.15) {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(actx.destination);
    o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + ms / 1000); o.stop(actx.currentTime + ms / 1000);
  } catch {}
}
