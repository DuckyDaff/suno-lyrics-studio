<script>
  import { leftTab } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import LibraryTab from '../panel/LibraryTab.svelte';
  import StudioTab from '../panel/StudioTab.svelte';
</script>

<div class="panel">
  <div class="tabs">
    <button class:on={$leftTab === 'library'} onclick={() => leftTab.set('library')}>📚 {$t('tabLibrary')}</button>
    <button class:on={$leftTab === 'studio'} onclick={() => leftTab.set('studio')}>🎛 {$t('navStudio')}</button>
  </div>
  <div class="body">
    {#if $leftTab === 'library'}<LibraryTab />{:else}<StudioTab />{/if}
  </div>
</div>

<style>
  .panel { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .tabs { display: flex; padding: 8px 10px 0; gap: 4px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
  .tabs button { flex: 1; padding: 8px 10px; font-size: var(--fs-sm); font-weight: 700; color: var(--tx2); border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: var(--r1) var(--r1) 0 0; }
  .tabs button:hover { color: var(--tx0); background: var(--bg2); }
  .tabs button.on { color: var(--accent); border-bottom-color: var(--accent); }
  .body { flex: 1; min-height: 0; overflow-y: auto; }
</style>
