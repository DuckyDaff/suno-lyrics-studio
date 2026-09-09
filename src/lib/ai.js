import { get, writable } from 'svelte/store';
import { user } from './auth.js';
import { settings } from './settings.js';
import { song } from './song.js';
import { limits, buildLyrics } from './suno.js';

/** true while a generation is streaming (any mode) */
export const busy = writable(false);
/** '' | 'thinking' | 'writing' | 'retry' — what the model is doing right now */
export const phase = writable('');

/**
 * Stream a generation. `fields` is the mode payload (see api/generate.js).
 * onDelta(text) is called with each new chunk; resolves to the full text.
 * Throws Error with .code on failure: unauthorized | no_api_key | daily_limit |
 * bad_api_key | model_not_found | anthropic_rate_limit | api_error | aborted
 */
export async function generate(fields, onDelta, { signal } = {}) {
  const u = get(user);
  if (!u) throw Object.assign(new Error('unauthorized'), { code: 'unauthorized' });
  const s = get(settings);
  const cur = get(song);
  const body = {
    model: s.aiModel === 'fast' ? 'fast' : 'quality',
    limit: limits(s.sunoVersion).lyrics,
    title: cur.title,
    style: fields.style ?? cur.style,
    lyrics: fields.lyrics ?? buildLyrics(cur),
    producerTag: s.producerTagOn && s.producerTag && s.producerTag.trim() ? s.producerTag.trim() : '',
    ...fields,
  };

  busy.set(true); phase.set('thinking');
  try {
    const r = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u.token}` },
      body: JSON.stringify(body),
      signal,
    });
    if (!r.ok) {
      let code = 'api_error', extra = {};
      try { const j = await r.json(); code = j.error || code; extra = j; } catch {}
      throw Object.assign(new Error(code), { code, status: r.status, ...extra });
    }
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '', full = '', meta = null;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
        if (!line) continue;
        let ev; try { ev = JSON.parse(line); } catch { continue; }
        if (ev.status) phase.set(ev.status);
        if (ev.replace != null) { full = ev.replace; onDelta?.('', full); continue; }
        if (ev.t) { full += ev.t; onDelta?.(ev.t, full); }
        else if (ev.error) throw Object.assign(new Error(ev.error), { code: ev.error, message: ev.message });
        else if (ev.done) meta = ev;
      }
    }
    return { text: full.trim(), meta };
  } catch (e) {
    if (e.name === 'AbortError') throw Object.assign(new Error('aborted'), { code: 'aborted' });
    throw e;
  } finally {
    busy.set(false); phase.set('');
  }
}

export async function health() {
  try { return await (await fetch('/api/generate?action=health')).json(); } catch { return { ok: false }; }
}
