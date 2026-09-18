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
      u.searchParams.delete('k'); history.replaceState(null, '', u.pathname);
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
function pickVoice() {
  if (voice || !('speechSynthesis' in window)) return;
  const vs = speechSynthesis.getVoices();
  voice = vs.find(v => /he[-_]IL/i.test(v.lang) && /Carmit|Google/i.test(v.name)) || vs.find(v => /^he/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function say(text) {
  if (!('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(stripNikud(text));
    u.lang = 'he-IL'; u.rate = 0.9; u.pitch = 1.05;
    pickVoice(); if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch {}
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
