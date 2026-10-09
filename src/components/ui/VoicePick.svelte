<script>
  /** 🎙 Who sings to whom — the song's main gender setting (nikud and wording follow it). */
  import { song, actions } from '../../lib/song.js';
  import { t } from '../../lib/i18n.js';

  /** onChange(voice) runs after the song's voice changed (e.g. to re-vocalize gendered words) */
  let { onChange = null, busy = false, compact = false } = $props();
  const OPTS = [['m>f', 'vpMF'], ['m>m', 'vpMM'], ['f>m', 'vpFM'], ['f>f', 'vpFF']];

  function pick(v) {
    if (v === ($song.voice || '')) return;
    actions.setVoice(v);
    onChange?.(v);
  }
</script>

<div class="vp" class:compact class:unset={!$song.voice} title={$t('vpTitle')}>
  <span class="lbl">🎙 {$t('vpLabel')}</span>
  <div class="seg">
    {#each OPTS as [v, k]}
      <button class:on={$song.voice === v} onclick={() => pick(v)} disabled={busy}>{$t(k)}</button>
    {/each}
  </div>
  {#if busy}<span class="spin"></span>{/if}
</div>

<style>
  .vp { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 6px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); }
  .vp.unset { border-color: color-mix(in srgb, var(--warn) 45%, transparent); }
  .lbl { font-size: var(--fs-xs); font-weight: 800; color: var(--tx0); white-space: nowrap; }
  .seg { display: flex; flex-wrap: wrap; gap: 3px; }
  .seg button { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--tx1); background: var(--bg1); border: 1px solid var(--line); white-space: nowrap; }
  .seg button:hover:not(:disabled) { border-color: var(--accent-bd); }
  .seg button.on { color: var(--accent); background: var(--accent-bg); border-color: var(--accent); }
  .compact { padding: 4px 8px; }
  .spin { width: 12px; height: 12px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
