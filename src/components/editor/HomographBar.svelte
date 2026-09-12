<script>
  import { actions } from '../../lib/song.js';
  import { homographs } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';

  let { sec } = $props();
  const items = $derived($homographs.get(sec.id) || []);

  function choose(item, gender) {
    const next = gender === 'masc' ? item.masc : item.fem;
    if (item.current === next) return;
    const text = (sec.text || '').split(item.current).join(next);
    actions.setText(sec.id, text);
    homographs.update(m => {
      const list = (m.get(sec.id) || []).map(x => x === item ? { ...x, current: next, gender } : x);
      const nm = new Map(m); nm.set(sec.id, list); return nm;
    });
  }
  function dismiss() { homographs.update(m => { const nm = new Map(m); nm.delete(sec.id); return nm; }); }
</script>

{#if items.length}
  <div class="bar" onmousedown={e => e.preventDefault()} role="group">
    <span class="lbl">{$t('homographs')}</span>
    {#each items as it (it.word)}
      <span class="pair">
        <span class="w">{it.current}</span>
        <button class:on={it.gender === 'masc'} onclick={() => choose(it, 'masc')}>{$t('masc')}</button>
        <button class:on={it.gender === 'fem'} onclick={() => choose(it, 'fem')}>{$t('fem')}</button>
      </span>
    {/each}
    <button class="x" onclick={dismiss} title={$t('clear')}>✕</button>
  </div>
{/if}

<style>
  .bar { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; padding: 6px 8px; background: color-mix(in srgb, var(--warn) 8%, var(--bg2)); border: 1px solid color-mix(in srgb, var(--warn) 35%, transparent); border-radius: var(--r2); }
  .lbl { font-size: 11px; font-weight: 700; color: var(--warn); }
  .pair { display: inline-flex; align-items: center; gap: 2px; background: var(--bg1); border: 1px solid var(--line); border-radius: 999px; padding: 2px 4px 2px 8px; }
  .w { font-size: var(--fs-sm); font-weight: 700; margin-inline-end: 4px; }
  .pair button { padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--tx2); }
  .pair button.on { background: var(--accent-bg); color: var(--accent); }
  .x { margin-inline-start: auto; color: var(--tx2); padding: 0 4px; }
</style>
