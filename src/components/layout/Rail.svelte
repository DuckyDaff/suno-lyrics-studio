<script>
  import { view, wsTab, leftTab, editorFocus } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import Icon from '../ui/Icon.svelte';

  const items = $derived([
    { id: 'songs',   icon: 'music',    label: $t('navSongs') },
    { id: 'ai',      icon: 'sparkles', label: $t('wsCreate') },
    { id: 'style',   icon: 'sliders',  label: $t('wsStyle') },
    { id: 'editor',  icon: 'pen',      label: $t('navEditor') },
    { id: 'library', icon: 'library',  label: $t('navLibrary') },
    { id: 'studio',  icon: 'grid',     label: $t('navStudio') },
  ]);

  function go(id) {
    if (id === 'songs') { view.set('songs'); return; }
    view.set('editor');
    if (id === 'ai' || id === 'style') { wsTab.set(id); editorFocus.set(false); }
    else if (id === 'editor') { if ($settings.editorCollapsed) setSetting('editorCollapsed', false); else editorFocus.update(v => !v); }
    else leftTab.set(id);
  }
  const isActive = id =>
    id === 'songs' ? $view === 'songs'
    : $view !== 'editor' ? false
    : id === 'editor' ? !$settings.editorCollapsed
    : id === 'ai' || id === 'style' ? $wsTab === id && !$editorFocus
    : $leftTab === id;
</script>

<nav class="rail">
  <img class="logo" src="/icon-192.png" alt="MeloDraft" width="36" height="36" />
  {#each items as it}
    <button class="item" class:active={isActive(it.id)} onclick={() => go(it.id)} title={it.label}>
      <Icon name={it.icon} size={20} />
      <span>{it.label}</span>
    </button>
  {/each}
  <div class="spacer"></div>
  <button class="item" class:active={$view === 'settings'} onclick={() => view.set('settings')} title={$t('navSettings')}>
    <Icon name="settings" size={20} />
    <span>{$t('navSettings')}</span>
  </button>
</nav>

<style>
  .rail { display: flex; flex-direction: column; align-items: center; height: 100%; padding: 10px 0; gap: 4px; }
  .logo { border-radius: 10px; margin-bottom: 10px; }
  .item {
    width: 52px; height: 52px; border-radius: var(--r2);
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px;
    color: var(--tx2); font-size: 10px; font-weight: 600;
  }
  .item:hover { background: var(--bg3); color: var(--tx0); }
  .item.active { background: var(--accent-bg); color: var(--accent); }
  .spacer { flex: 1; }
</style>
