<script>
  import { wsTab } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import GenerateTab from '../panel/GenerateTab.svelte';
  import StyleTab from '../panel/StyleTab.svelte';
</script>

<div class="ws">
  <div class="tabs">
    <button class:on={$wsTab === 'ai'} onclick={() => wsTab.set('ai')}>✨ {$t('wsCreate')}</button>
    <button class:on={$wsTab === 'style'} onclick={() => wsTab.set('style')}>🎨 {$t('wsStyle')}</button>
  </div>
  <div class="body">
    {#if $wsTab === 'ai'}
      <GenerateTab wide />
    {:else}
      <div class="styleWrap"><StyleTab /></div>
    {/if}
  </div>
</div>

<style>
  .ws { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .tabs { display: flex; gap: 4px; padding: 8px 16px 0; border-bottom: 1px solid var(--line); background: var(--bg1); flex-shrink: 0; }
  .tabs button { padding: 9px 16px; font-size: var(--fs-md); font-weight: 700; color: var(--tx2); border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: var(--r1) var(--r1) 0 0; }
  .tabs button:hover { color: var(--tx0); background: var(--bg2); }
  .tabs button.on { color: var(--accent); border-bottom-color: var(--accent); }
  .body { flex: 1; min-height: 0; overflow-y: auto; }
  .styleWrap { max-width: 760px; margin: 0 auto; padding: 8px 8px 24px; }
</style>
