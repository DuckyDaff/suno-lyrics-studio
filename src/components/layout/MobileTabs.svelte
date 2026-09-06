<script>
  import { mobileTab, view } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import Icon from '../ui/Icon.svelte';

  const tabs = $derived([
    { id: 'editor',  icon: 'pen',     label: $t('tabEditor') },
    { id: 'style',   icon: 'sparkles', label: $t('tabStyle') },
    { id: 'library', icon: 'library', label: $t('tabLibrary') },
    { id: 'export',  icon: 'send',    label: $t('tabExport') },
  ]);
  function go(id) { view.set('editor'); mobileTab.set(id); }
</script>

<nav class="tabs">
  {#each tabs as tb}
    <button class:active={$view === 'editor' && $mobileTab === tb.id} onclick={() => go(tb.id)}>
      <Icon name={tb.icon} size={20} />
      <span>{tb.label}</span>
    </button>
  {/each}
</nav>

<style>
  .tabs { display: flex; height: 100%; }
  button {
    flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    color: var(--tx2); font-size: 11px; font-weight: 600;
  }
  button.active { color: var(--accent); }
</style>
