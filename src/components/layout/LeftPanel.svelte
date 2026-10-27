<script>
  import { leftTab } from '../../lib/ui.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { t } from '../../lib/i18n.js';
  import LibraryTab from '../panel/LibraryTab.svelte';
  import StudioTab from '../panel/StudioTab.svelte';
  import Icon from '../ui/Icon.svelte';

  const collapsed = $derived($settings.leftCollapsed);
  function open(tab) { if (tab) leftTab.set(tab); setSetting('leftCollapsed', false); }
</script>

{#if collapsed}
  <div class="strip">
    <button onclick={() => open('library')} title={$t('tabLibrary')}><Icon name="library" size={18} /><span class="v">{$t('tabLibrary')}</span></button>
    <button onclick={() => open('studio')} title={$t('navStudio')}><Icon name="grid" size={18} /><span class="v">{$t('navStudio')}</span></button>
  </div>
{:else}
  <div class="panel">
    <div class="tabs">
      <button class:on={$leftTab === 'library'} onclick={() => leftTab.set('library')}>📚 {$t('tabLibrary')}</button>
      <button class:on={$leftTab === 'studio'} onclick={() => leftTab.set('studio')}>🎛 {$t('navStudio')}</button>
      <button class="x" onclick={() => setSetting('leftCollapsed', true)} title={$t('panelClose')}><Icon name="x" size={14} /></button>
    </div>
    <div class="body">
      {#if $leftTab === 'library'}<LibraryTab />{:else}<StudioTab />{/if}
    </div>
  </div>
{/if}

<style>
  .panel { display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .tabs { display: flex; padding: 8px 10px 0; gap: 4px; border-bottom: 1px solid var(--line); flex-shrink: 0; align-items: flex-end; }
  .tabs button { flex: 1; padding: 8px 10px; font-size: var(--fs-sm); font-weight: 700; color: var(--tx2); border-bottom: 2px solid transparent; margin-bottom: -1px; border-radius: var(--r1) var(--r1) 0 0; }
  .tabs button:hover { color: var(--tx0); background: var(--bg2); }
  .tabs button.on { color: var(--accent); border-bottom-color: var(--accent); }
  .tabs .x { flex: 0 0 auto; padding: 8px; }
  .body { flex: 1; min-height: 0; overflow-y: auto; }
  .strip { height: 100%; display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 0; }
  .strip button { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 10px 4px; width: 34px; border-radius: var(--r2); color: var(--tx2); }
  .strip button:hover { background: var(--bg3); color: var(--accent); }
  .v { writing-mode: vertical-rl; font-size: 11px; font-weight: 700; letter-spacing: .04em; }
</style>
