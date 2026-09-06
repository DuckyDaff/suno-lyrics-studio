<script>
  import { panelTab, isPhone } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import StyleTab from './StyleTab.svelte';
  import LibraryTab from './LibraryTab.svelte';
  import StudioTab from './StudioTab.svelte';

  const tabs = $derived([
    { id: 'style',   label: $t('tabStyle') },
    { id: 'library', label: $t('tabLibrary') },
    { id: 'studio',  label: $t('navStudio') },
  ]);
</script>

<div class="panel">
  <div class="tabs">
    {#each tabs as tb}
      <button class:active={$panelTab === tb.id} onclick={() => panelTab.set(tb.id)}>{tb.label}</button>
    {/each}
  </div>
  <div class="body">
    {#if $panelTab === 'style'}<StyleTab />
    {:else if $panelTab === 'library'}<LibraryTab />
    {:else}<StudioTab />{/if}
  </div>
</div>

<style>
  .panel { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .tabs { display: flex; padding: 8px 10px 0; gap: 4px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
  .tabs button {
    padding: 8px 12px; font-size: var(--fs-sm); font-weight: 700; color: var(--tx2);
    border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: var(--r1) var(--r1) 0 0;
  }
  .tabs button:hover { color: var(--tx0); background: var(--bg2); }
  .tabs button.active { color: var(--accent); border-bottom-color: var(--accent); }
  .body { flex: 1; min-height: 0; overflow-y: auto; }
</style>
