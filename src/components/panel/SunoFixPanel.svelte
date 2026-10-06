<script>
  /** 🗣 Prepare for Suno: run button, the change list (sound / rhythm), revert, and a syllables-per-line view. */
  import { t } from '../../lib/i18n.js';
  import { rhythmProfile } from '../../lib/sunoFix.js';

  /** info: { before, changes } | null — text: the lyrics shown now (for the rhythm view) */
  let { info = null, busy = false, disabled = false, text = '', onRun, onRevert } = $props();

  let open = $state(false);
  let showRhythm = $state(false);
  const sound = $derived((info?.changes || []).filter(c => c.kind === 'sound'));
  const rhythm = $derived((info?.changes || []).filter(c => c.kind === 'rhythm'));
  const profile = $derived(showRhythm ? rhythmProfile(text) : []);
</script>

<div class="fx" class:done={info}>
  <div class="row">
    <button class="run" onclick={onRun} disabled={busy || disabled} title={$t('fxTitle')}>
      {#if busy}<span class="spin"></span> {$t('fxBusy')}{:else}🗣 {info ? $t('fxAgain') : $t('fxRun')}{/if}
    </button>
    {#if info}
      <button class="sum" onclick={() => (open = !open)}>
        {#if info.changes.length}✓ {$t('fxSummary', { s: sound.length, r: rhythm.length })}{:else}✓ {$t('fxNone')}{/if}
        <span class="car">{open ? '▴' : '▾'}</span>
      </button>
      {#if info.before}<button class="lnk" onclick={onRevert} disabled={busy}>↩ {$t('fxRevert')}</button>{/if}
    {/if}
    <span class="sp"></span>
    {#if text}<button class="lnk" onclick={() => (showRhythm = !showRhythm)}>📏 {$t('fxRhythm')}</button>{/if}
  </div>

  {#if open && info?.changes.length}
    <ul class="list">
      {#each sound as c}<li><span class="k">🗣</span><span class="b" dir="auto">{c.before}</span><span class="ar">←</span><span class="a" dir="auto">{c.after}</span>{#if c.why}<span class="why">{c.why}</span>{/if}</li>{/each}
      {#each rhythm as c}<li><span class="k">📏</span><span class="b" dir="auto">{c.before}</span><span class="a" dir="auto">{c.after}</span>{#if c.why}<span class="why">{c.why}</span>{/if}</li>{/each}
    </ul>
  {/if}

  {#if showRhythm}
    <div class="rh">
      <p class="faint">{$t('fxRhythmHint')}</p>
      {#each profile as sec}
        <div class="sec"><span class="nm">{sec.name || '—'}</span>
          <span class="cn mono">{#each sec.counts as c, i}<span class:odd={sec.odd[i]}>{c}</span>{/each}</span></div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .fx { display: flex; flex-direction: column; gap: 6px; padding: 7px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px dashed var(--line2); }
  .fx.done { border-style: solid; border-color: color-mix(in srgb, var(--ok) 40%, transparent); }
  .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .sp { flex: 1; }
  .run { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 800; color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-bd); }
  .run:hover:not(:disabled) { border-color: var(--accent); }
  .run:disabled { opacity: .6; }
  .sum { font-size: var(--fs-xs); font-weight: 700; color: var(--ok); }
  .car { font-size: 10px; margin-inline-start: 2px; }
  .lnk { font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); }
  .lnk:hover:not(:disabled) { color: var(--accent); }
  .list { list-style: none; display: flex; flex-direction: column; gap: 4px; max-height: 260px; overflow-y: auto; }
  .list li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; font-size: var(--fs-xs); padding: 5px 8px; border-radius: var(--r1); background: var(--bg1); border: 1px solid var(--line); }
  .k { flex-shrink: 0; }
  .b { color: var(--tx2); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--err) 60%, transparent); }
  .a { color: var(--tx0); font-weight: 700; }
  .ar { color: var(--tx2); }
  .why { flex-basis: 100%; color: var(--tx2); font-size: 11px; }
  .rh { display: flex; flex-direction: column; gap: 3px; font-size: 11px; }
  .rh p { line-height: 1.45; }
  .sec { display: flex; gap: 8px; align-items: baseline; }
  .nm { min-width: 70px; font-weight: 700; color: var(--tx1); direction: ltr; text-align: start; }
  .cn { display: flex; flex-wrap: wrap; gap: 4px; direction: ltr; }
  .cn span { padding: 0 5px; border-radius: 4px; background: var(--bg1); border: 1px solid var(--line); }
  .cn span.odd { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 50%, transparent); }
  .spin { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
