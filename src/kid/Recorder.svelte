<script>
  /** Voice takes: 3-2-1 countdown, up to MAX_SEC per take, MAX_TAKES takes; play / delete / re-record. */
  import { onDestroy } from 'svelte';
  import { api, fileUrl, say, beep } from './kidApi.js';

  let { takes = [], onchange } = $props();
  const MAX_SEC = 180, MAX_TAKES = 5;

  let state = $state('idle');     // idle | countdown | recording | uploading
  let count = $state(3);
  let secs = $state(0);
  let err = $state('');
  let rec = null, chunks = [], stream = null, tick = null, startedAt = 0;

  const mime = () => ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'].find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
  const mmss = n => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;

  async function start() {
    if (state !== 'idle' || takes.length >= MAX_TAKES) return;
    err = '';
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { err = 'צָרִיךְ לְאַשֵּׁר אֶת הַמִּיקְרוֹפוֹן'; say('צריך לאשר את המיקרופון'); return; }
    state = 'countdown'; count = 3;
    say('שלוש, שתיים, אחת');
    for (let i = 3; i >= 1; i--) { count = i; beep(660, 120); await new Promise(r => setTimeout(r, 900)); if (state !== 'countdown') return; }
    beep(990, 220);
    chunks = [];
    rec = new MediaRecorder(stream, mime() ? { mimeType: mime() } : undefined);
    rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = finish;
    rec.start(1000);
    state = 'recording'; secs = 0; startedAt = Date.now();
    tick = setInterval(() => { secs = Math.floor((Date.now() - startedAt) / 1000); if (secs >= MAX_SEC) stop(); }, 250);
  }
  function stop() {
    if (state === 'countdown') { state = 'idle'; cleanup(); return; }
    if (state !== 'recording') return;
    clearInterval(tick);
    try { rec.stop(); } catch { finish(); }
  }
  async function finish() {
    const dur = Math.max(1, Math.round((Date.now() - startedAt) / 1000));
    const type = (rec && rec.mimeType) || mime() || 'audio/mp4';
    const blob = new Blob(chunks, { type: type.split(';')[0] });
    cleanup();
    if (blob.size < 2000) { state = 'idle'; err = 'לֹא שָׁמַעְתִּי כְּלוּם, נְנַסֶּה שׁוּב?'; return; }
    state = 'uploading';
    try {
      const r = await api.upload(blob, 'audio');
      takes = [...takes, { id: r.path.split('/').pop(), path: r.path, seconds: dur }];
      onchange?.(takes);
      beep(1200, 150); say('מעולה! נשמר');
    } catch { err = 'לֹא הִצְלַחְתִּי לִשְׁמֹר, נְנַסֶּה שׁוּב'; }
    state = 'idle';
  }
  function cleanup() { clearInterval(tick); try { stream && stream.getTracks().forEach(t => t.stop()); } catch {} stream = null; rec = null; }
  async function remove(t) {
    takes = takes.filter(x => x.id !== t.id); onchange?.(takes);
    api.deleteFile(t.path);
  }
  onDestroy(cleanup);
</script>

<div class="rec">
  {#if state === 'recording' || state === 'countdown'}
    <div class="reminder" aria-live="polite">
      <span class="ill">🗣️📣</span>
      <span class="txt">דַּבְּרִי בְּקוֹל רָם וּבָרוּר</span>
    </div>
  {/if}

  <div class="stage">
    {#if state === 'countdown'}
      <div class="count">{count}</div>
      <div class="hint">מִתְכּוֹנְנִים…</div>
      <button class="big stop" onclick={stop}>בִּטּוּל</button>
    {:else if state === 'recording'}
      <div class="ring" style="--p:{(secs / MAX_SEC) * 100}%">
        <span class="dot"></span>
        <span class="time">{mmss(secs)}</span>
      </div>
      <div class="hint">מַקְלִיטִים… עוֹד {mmss(MAX_SEC - secs)}</div>
      <button class="big stop" onclick={stop}>⏹ סִיַּמְתִּי</button>
    {:else if state === 'uploading'}
      <div class="count">💾</div>
      <div class="hint">שׁוֹמְרִים…</div>
    {:else}
      <button class="mic" onclick={start} disabled={takes.length >= MAX_TAKES} aria-label="הקלטה">🎤</button>
      <div class="hint">{takes.length ? 'עוֹד הַקְלָטָה?' : 'לַחֲצִי וְסַפְּרִי אֶת הָרַעְיוֹן'}</div>
      {#if takes.length >= MAX_TAKES}<div class="hint small">זֶה הַמַּקְסִימוּם, כָּל הַכָּבוֹד!</div>{/if}
    {/if}
    {#if err}<div class="err">{err}</div>{/if}
  </div>

  {#if takes.length}
    <ul class="takes">
      {#each takes as t, i (t.id)}
        <li>
          <span class="n">{i + 1}</span>
          <audio controls preload="none" src={fileUrl(t.path)}></audio>
          <span class="len">{mmss(t.seconds || 0)}</span>
          <button class="del" onclick={() => remove(t)} aria-label="מחיקה">🗑️</button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .rec { display: flex; flex-direction: column; gap: 18px; align-items: center; width: 100%; }
  .reminder { display: flex; align-items: center; gap: 16px; padding: 14px 22px; border-radius: 24px; background: #fff3c4; border: 4px solid #f59e0b; color: #7c2d12; font-size: 30px; font-weight: 900; animation: pulse 1.6s ease-in-out infinite; }
  .ill { font-size: 44px; }
  @keyframes pulse { 50% { transform: scale(1.04); } }
  .stage { display: flex; flex-direction: column; align-items: center; gap: 14px; min-height: 260px; justify-content: center; }
  .mic { width: 200px; height: 200px; border-radius: 50%; font-size: 96px; background: linear-gradient(145deg, #ff6b9d, #ff3d71); border: 8px solid #fff; box-shadow: 0 12px 40px rgba(255, 61, 113, .45); }
  .mic:active { transform: scale(.94); }
  .mic:disabled { filter: grayscale(1); opacity: .5; }
  .count { font-size: 140px; font-weight: 900; color: #ff3d71; line-height: 1; animation: pop .9s ease-out infinite; }
  @keyframes pop { 0% { transform: scale(.6); opacity: .4; } 40% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
  .ring { width: 210px; height: 210px; border-radius: 50%; display: grid; place-items: center; background: conic-gradient(#ff3d71 var(--p), #ffd6e2 0); position: relative; }
  .ring::after { content: ''; position: absolute; inset: 14px; border-radius: 50%; background: #fff; }
  .dot { position: absolute; top: 34px; width: 16px; height: 16px; border-radius: 50%; background: #ff3d71; animation: blink 1s infinite; z-index: 1; }
  @keyframes blink { 50% { opacity: .15; } }
  .time { position: relative; z-index: 1; font-size: 54px; font-weight: 900; color: #1f2937; font-variant-numeric: tabular-nums; }
  .hint { font-size: 28px; font-weight: 800; color: #374151; text-align: center; }
  .hint.small { font-size: 20px; color: #6b7280; }
  .big { font-size: 30px; font-weight: 900; padding: 16px 36px; border-radius: 999px; border: 5px solid #fff; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
  .stop { background: #ef4444; }
  .err { font-size: 22px; font-weight: 800; color: #b91c1c; background: #fee2e2; padding: 10px 18px; border-radius: 16px; }
  .takes { list-style: none; display: flex; flex-direction: column; gap: 10px; width: 100%; max-width: 560px; }
  .takes li { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 18px; background: #fff; border: 3px solid #e5e7eb; }
  .takes .n { width: 38px; height: 38px; border-radius: 50%; background: #ff3d71; color: #fff; display: grid; place-items: center; font-size: 20px; font-weight: 900; flex-shrink: 0; }
  .takes audio { flex: 1; min-width: 0; height: 44px; }
  .len { font-size: 18px; font-weight: 800; color: #6b7280; font-variant-numeric: tabular-nums; }
  .del { font-size: 28px; padding: 4px 8px; border-radius: 12px; }
  .del:active { background: #fee2e2; }
</style>
