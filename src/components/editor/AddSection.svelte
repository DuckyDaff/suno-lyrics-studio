<script>
  import { actions } from '../../lib/song.js';
  import { QUICK_SECTIONS, sectionColor } from '../../lib/sections.js';
  import { t } from '../../lib/i18n.js';
  import Icon from '../ui/Icon.svelte';

  const focus = node => node.focus();
  let custom = $state(false);
  let name = $state('');

  function add(base) {
    const s = actions.add(base);
    requestAnimationFrame(() => document.querySelector(`[data-sec="${s.id}"]`)?.focus());
  }
  function addCustom() {
    if (name.trim()) add(name.trim());
    name = ''; custom = false;
  }
</script>

<div class="add">
  <span class="lbl"><Icon name="plus" size={14} /> {$t('addSection')}</span>
  <div class="chips">
    {#each QUICK_SECTIONS as q}
      <button class="chip mono" style="--c:{sectionColor(q)}" onclick={() => add(q)}>{q}</button>
    {/each}
    {#if custom}
      <input class="chip input mono" bind:value={name} placeholder={$t('customName')} use:focus
             onkeydown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') custom = false; }}
             onblur={addCustom} />
    {:else}
      <button class="chip other" onclick={() => (custom = true)}>{$t('custom')}</button>
    {/if}
  </div>
</div>

<style>
  .add { display: flex; flex-direction: column; gap: 8px; padding: 6px 4px; }
  .lbl { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-xs); font-weight: 700; color: var(--tx2); letter-spacing: .04em; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    padding: 6px 12px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700;
    border: 1px dashed color-mix(in srgb, var(--c, var(--tx2)) 45%, transparent); color: var(--c, var(--tx1));
    background: transparent; direction: ltr;
  }
  .chip:hover { background: color-mix(in srgb, var(--c, var(--tx2)) 12%, transparent); border-style: solid; }
  .other { --c: var(--tx1); font-family: var(--font-ui); }
  .input { width: 140px; border-style: solid; border-color: var(--accent); background: var(--bg2); color: var(--tx0); outline: none; }
  @media (max-width: 768px) {
    .chips { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
    .chips::-webkit-scrollbar { display: none; }
    .chip { flex-shrink: 0; padding: 8px 14px; }
  }
</style>
