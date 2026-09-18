/** Owner media (covers etc.) in the private Blob store, via /api/kid upload/file. */
import { get } from 'svelte/store';
import { user } from './auth.js';

const tok = () => get(user)?.token || '';
export const mediaUrl = path => path ? `/api/kid?action=file&p=${encodeURIComponent(path)}&t=${encodeURIComponent(tok())}` : '';

export async function uploadMedia(blob, kind = 'cover') {
  const data = await new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
  const r = await fetch('/api/kid?action=upload', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ type: blob.type || 'image/png', data, kind }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw Object.assign(new Error(j.error || 'upload'), { code: j.error || 'upload', detail: j.detail });
  return j.path;
}

export async function deleteMedia(path) {
  if (!path) return;
  try { await fetch('/api/kid?action=delete-file', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` }, body: JSON.stringify({ path }) }); } catch {}
}

/** trigger a browser download of a blob */
export function downloadBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
