<script>
  /** Generate the cover in local ComfyUI from the art-direction prompts; save it on the song. */
  import { settings } from '../../lib/settings.js';
  import { song, actions } from '../../lib/song.js';
  import { view } from '../../lib/ui.js';
  import { ENGINES, generateImage } from '../../lib/comfy.js';
  import { uploadMedia, deleteMedia, downloadBlob, mediaUrl } from '../../lib/media.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';

  let { cover } = $props();            // parsed art direction { main, negative, photo, illustrated, minimal, ... }
  let variant = $state('main');
  let busy = $state(false);
  let status = $state(null);           // { state, queue, elapsed }
  let result = $state(null);           // { blob, url, seed }
  let error = $state('');
  let saving = $state(false);
  let ctrl = null;

  const engLabel = $derived(ENGINES.find(e => e.id === ($settings.comfyEngine || 'sdxl'))?.label || 'SDXL');
  const VARIANTS = [['main', 'aiCoverMain'], ['photo', 'aiCoverPhoto'], ['illustrated', 'aiCoverIllustrated'], ['minimal', 'aiCoverMinimal']];

  async function run(seed) {
    if (busy) { ctrl?.abort(); return; }
    const positive = cover[variant] || cover.main; if (!positive) return;
    busy = true; error = ''; status = { state: 'queued', elapsed: 0 };
    ctrl = new AbortController();
    try {
      const r = await generateImage(positive, cover.negative || 'text, watermark, logo, blurry, low quality', { seed, signal: ctrl.signal, onStatus: s => (status = s) });
      if (result?.url) URL.revokeObjectURL(result.url);
      result = { blob: r.blob, url: URL.createObjectURL(r.blob), seed: r.seed };
    } catch (e) {
      if (e.code !== 'aborted') error = ($t('comfyErr_' + e.code) !== 'comfyErr_' + e.code ? $t('comfyErr_' + e.code) : $t('comfyErr_http')) + (e.detail ? ' — ' + e.detail : '');
    }
    busy = false; status = null; ctrl = null;
  }
  async function save() {
    if (!result || saving) return;
    saving = true;
    try {
      const path = await uploadMedia(result.blob, 'cover');
      const old = $song.coverPath;
      actions.setCover(path);
      if (old && old !== path) deleteMedia(old);
      toast($t('coverSaved'), 'success');
    } catch (e) { toast($t('coverSaveFail') + (e.detail ? ': ' + e.detail : ''), 'error', 6000); }
    saving = false;
  }
  const fname = () => (($song.title || 'cover').replace(/[\\/:*?"<>|]+/g, '_') + '-cover.png');
</script>

<div class="gen">
  <div class="hd">
    <span class="lbl">🖼️ {$t('coverGenTitle')} <span class="eng mono">{engLabel}</span></span>
    <button class="link" onclick={() => view.set('settings')}>{$t('coverGenSettings')}</button>
  </div>
  <div class="row">
    <select class="field" bind:value={variant}>{#each VARIANTS as [k, lbl]}{#if cover[k]}<option value={k}>{$t(lbl)}</option>{/if}{/each}</select>
    <Button variant={busy ? 'danger' : 'primary'} size="sm" onclick={() => run()} disabled={!cover.main}>{busy ? '⏹ ' + $t('coverGenStop') : '▶ ' + $t('coverGenRun')}</Button>
  </div>
  {#if busy && status}
    <div class="st"><span class="spin"></span> {status.state === 'queued' && status.queue ? $t('coverGenQueued', { n: status.queue }) : $t('coverGenRunning')} · {status.elapsed}s</div>
  {/if}
  {#if error}<div class="err">{error}</div>{/if}
  {#if result}
    <img class="img" src={result.url} alt="" />
    <div class="acts">
      <Button variant="primary" size="sm" icon="check" onclick={save} disabled={saving}>{saving ? $t('coverSaving') : $t('coverUse')}</Button>
      <Button size="sm" onclick={() => downloadBlob(result.blob, fname())}>⬇ {$t('coverDownload')}</Button>
      <Button variant="ghost" size="sm" icon="undo" onclick={() => run()} disabled={busy}>{$t('coverAgain')}</Button>
      <span class="faint mono small">seed {result.seed}</span>
    </div>
  {:else if $song.coverPath}
    <div class="cur"><img class="thumb" src={mediaUrl($song.coverPath)} alt="" /><span class="faint small">{$t('coverCurrent')}</span></div>
  {/if}
</div>

<style>
  .gen { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: var(--r2); border: 1px dashed var(--accent-bd); background: var(--bg1); }
  .hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .lbl { font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); display: inline-flex; gap: 6px; align-items: center; }
  .eng { font-size: 10px; padding: 1px 7px; border-radius: 999px; background: var(--bg3); color: var(--tx1); }
  .link { font-size: var(--fs-xs); color: var(--accent); text-decoration: underline; }
  .row { display: flex; gap: 8px; align-items: center; }
  .field { flex: 1; padding: 6px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx0); font-size: var(--fs-sm); }
  .st { display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); color: var(--tx1); }
  .spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .err { font-size: var(--fs-xs); color: var(--err); line-height: 1.5; white-space: pre-wrap; }
  .img { width: 100%; max-width: 420px; border-radius: var(--r2); border: 1px solid var(--line); display: block; }
  .acts { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .small { font-size: var(--fs-xs); }
  .cur { display: flex; align-items: center; gap: 10px; }
  .thumb { width: 64px; height: 64px; object-fit: cover; border-radius: var(--r2); border: 1px solid var(--line); }
</style>
