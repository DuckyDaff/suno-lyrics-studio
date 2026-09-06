<script>
  import { song, actions, canUndo, canRedo, hasContent, undo, redo } from '../../lib/song.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { SUNO_VERSIONS } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { logout } from '../../lib/auth.js';
  import { isPhone, view } from '../../lib/ui.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  let menuOpen = $state(false);

  function newSong() {
    if ($hasContent && !confirm($t('confirmNew'))) return;
    actions.newSong();
    toast($t('toastNew'), 'success');
  }
  function doUndo() { undo(); toast($t('toastUndo')); }
  function doRedo() { redo(); toast($t('toastRedo')); }
  function soon() { toast($t('toastSoon')); menuOpen = false; }
  function toggleTheme() { setSetting('theme', $settings.theme === 'light' ? 'dark' : 'light'); }
  function toggleLang() { setSetting('lang', $settings.lang === 'he' ? 'en' : 'he'); }

  function clickOutside(node) {
    const h = e => { if (!node.contains(e.target)) menuOpen = false; };
    document.addEventListener('pointerdown', h, true);
    return { destroy: () => document.removeEventListener('pointerdown', h, true) };
  }
</script>

<header class="bar">
  {#if $isPhone}
    <button class="logoBtn" onclick={() => view.set('editor')}><img class="logo" src="/icon-192.png" alt="MeloDraft" width="30" height="30" /></button>
  {/if}

  <input class="title" placeholder={$t('songTitle')} value={$song.title}
         oninput={e => actions.setTitle(e.target.value)} />

  <select class="ver" value={$settings.sunoVersion} onchange={e => setSetting('sunoVersion', e.target.value)} title={$t('sunoVersionHint')}>
    {#each SUNO_VERSIONS as v}<option value={v.id}>{v.label}</option>{/each}
  </select>

  <div class="group">
    <Button variant="ghost" icon="undo" title={$t('undo')} disabled={!$canUndo} onclick={doUndo} />
    <Button variant="ghost" icon="redo" title={$t('redo')} disabled={!$canRedo} onclick={doRedo} />
    <Button variant="ghost" icon="filePlus" title={$t('newSong')} onclick={newSong} />
  </div>

  <div class="menuWrap" use:clickOutside>
    <Button variant="ghost" icon="more" title={$t('more')} onclick={() => (menuOpen = !menuOpen)} active={menuOpen} />
    {#if menuOpen}
      <div class="menu">
        <button onclick={soon}><Icon name="upload" size={15} /> {$t('import')}</button>
        <button onclick={soon}><Icon name="grid" size={15} /> {$t('templates')}</button>
        <button onclick={() => { actions.toggleAllDir(); menuOpen = false; }}><Icon name="align" size={15} /> {$t('toggleDir')}</button>
        <hr />
        <button onclick={toggleLang}><Icon name="globe" size={15} /> {$t('language')} <span class="tag">{$settings.lang === 'he' ? 'HEB' : 'ENG'}</span></button>
        <button onclick={toggleTheme}><Icon name={$settings.theme === 'light' ? 'moon' : 'sun'} size={15} /> {$t('theme')}</button>
        {#if $isPhone}
          <button onclick={() => { view.set('settings'); menuOpen = false; }}><Icon name="settings" size={15} /> {$t('navSettings')}</button>
          <button onclick={() => { view.set('songs'); menuOpen = false; }}><Icon name="music" size={15} /> {$t('navSongs')}</button>
        {/if}
        <hr />
        <button class="danger" onclick={logout}><Icon name="logout" size={15} /> {$t('logout')}</button>
      </div>
    {/if}
  </div>
</header>

<style>
  .bar { height: 100%; display: flex; align-items: center; gap: 8px; padding: 0 14px; }
  .logoBtn { flex-shrink: 0; display: flex; }
  .logo { border-radius: 8px; }
  .title {
    flex: 1; min-width: 0; background: transparent; border: 1px solid transparent; border-radius: var(--r2);
    padding: 6px 10px; font-size: var(--fs-lg); font-weight: 700; color: var(--tx0);
  }
  .title:hover { background: var(--bg2); }
  .title:focus { background: var(--bg2); border-color: var(--line2); outline: none; }
  .ver {
    background: var(--bg3); border: 1px solid var(--line); border-radius: var(--r2);
    padding: 6px 8px; font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); cursor: pointer; flex-shrink: 0;
  }
  .ver option { background: var(--bg2); color: var(--tx0); }
  .group { display: flex; gap: 2px; flex-shrink: 0; }
  .menuWrap { position: relative; flex-shrink: 0; }
  .menu {
    position: absolute; top: calc(100% + 6px); inset-inline-end: 0; min-width: 220px;
    background: var(--bg2); border: 1px solid var(--line2); border-radius: var(--r3);
    box-shadow: var(--shadow); padding: 6px; z-index: 250; display: flex; flex-direction: column; gap: 2px;
  }
  .menu button {
    display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px;
    border-radius: var(--r1); font-size: var(--fs-sm); font-weight: 500; color: var(--tx0); text-align: start;
  }
  .menu button:hover { background: var(--bg3); }
  .menu .danger { color: var(--err); }
  .menu hr { border: none; border-top: 1px solid var(--line); margin: 4px 0; }
  .tag { margin-inline-start: auto; font-family: var(--font-mono); font-size: 10px; color: var(--accent); }
  @media (max-width: 768px) {
    .bar { padding: 0 10px; gap: 4px; }
    .title { font-size: var(--fs-md); padding: 6px 8px; }
  }
</style>
