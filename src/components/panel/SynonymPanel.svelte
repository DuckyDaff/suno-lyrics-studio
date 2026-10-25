<script>
  /** 🔁 Fresh words: run button, the list of swapped words, undo / redo, and hiding the highlight. */
  import { t } from '../../lib/i18n.js';

  /** info: { changes, on, marked } | null — on: the new words are in the text now; marked: the highlight shows */
  let { info = null, busy = false, disabled = false, onRun, onUndo, onRedo, onHide } = $props();

  let open = $state(false);
</script>

<div class="syn" class:done={info}>
  <div class="row">
    <button class="run" onclick={onRun} disabled={busy || disabled} title={$t('synTitle')}>
      {#if busy}<span class="spin"></span> {$t('synBusy')}{:else}🔁 {info ? $t('synAgain') : $t('synRun')}{/if}
    </button>
    {#if info}
      <button class="sum" onclick={() => (open = !open)}>
        {#if info.changes.length}✓ {$t('synSummary', { n: info.changes.length })}{:else}✓ {$t('synNone')}{/if}
        <span class="car">{open ? '▴' : '▾'}</span>
      </button>
      {#if info.on}<button class="lnk" onclick={onUndo} disabled={busy}>↩ {$t('synUndo')}</button>
      {:else}<button class="lnk" onclick={onRedo} disabled={busy}>↪ {$t('synRedo')}</button>{/if}
      <span class="sp"></span>
      {#if info.on && info.marked}<button class="lnk" onclick={onHide}>{$t('synHide')}</button>{/if}
    {/if}
  </div>

  {#if open && info?.changes.length}
    <ul class="list">
      {#each info.changes as c}<li><span class="b" dir="auto">{c.before}</span><span class="ar">←</span><span class="a" dir="auto">{c.after}</span>{#if c.why}<span class="why">{c.why}</span>{/if}</li>{/each}
    </ul>
  {/if}
</div>

<style>
  .syn { display: flex; flex-direction: column; gap: 6px; padding: 7px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px dashed var(--line2); }
  .syn.done { border-style: solid; border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .sp { flex: 1; }
  .run { display: inline-flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 800; color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-bd); }
  .run:hover:not(:disabled) { border-color: var(--accent); }
  .run:disabled { opacity: .6; }
  .sum { font-size: var(--fs-xs); font-weight: 700; color: var(--accent); }
  .car { font-size: 10px; margin-inline-start: 2px; }
  .lnk { font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); }
  .lnk:hover:not(:disabled) { color: var(--accent); }
  .list { list-style: none; display: flex; flex-direction: column; gap: 4px; max-height: 260px; overflow-y: auto; }
  .list li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; font-size: var(--fs-xs); padding: 5px 8px; border-radius: var(--r1); background: var(--bg1); border: 1px solid var(--line); }
  .b { color: var(--tx2); text-decoration: line-through; text-decoration-color: color-mix(in srgb, var(--err) 60%, transparent); }
  .a { color: var(--tx0); font-weight: 700; background: color-mix(in srgb, var(--accent) 18%, transparent); border-radius: 4px; padding: 0 4px; }
  .ar { color: var(--tx2); }
  .why { flex-basis: 100%; color: var(--tx2); font-size: 11px; }
  .spin { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
