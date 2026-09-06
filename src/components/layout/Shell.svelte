<script>
  import { view, panelTab, mobileTab, isPhone, previewOpen } from '../../lib/ui.js';
  import Rail from './Rail.svelte';
  import TopBar from './TopBar.svelte';
  import MobileTabs from './MobileTabs.svelte';
  import ExportBar from './ExportBar.svelte';
  import ExportView from './ExportView.svelte';
  import Editor from '../editor/Editor.svelte';
  import SidePanel from '../panel/SidePanel.svelte';
  import Songs from '../views/Songs.svelte';
  import Settings from '../views/Settings.svelte';

  // phone: which surface fills the screen
  const phoneSurface = $derived(
    $view !== 'editor' ? 'view' :
    $mobileTab === 'editor' ? 'editor' :
    $mobileTab === 'export' ? 'export' : 'panel'
  );
  $effect(() => {
    if ($isPhone && ($mobileTab === 'style' || $mobileTab === 'library')) panelTab.set($mobileTab);
  });
</script>

<div class="shell" class:phone={$isPhone}>
  {#if !$isPhone}<div class="rail"><Rail /></div>{/if}
  <div class="top"><TopBar /></div>

  <main class="main">
    {#if $isPhone}
      {#if phoneSurface === 'editor'}<Editor />
      {:else if phoneSurface === 'panel'}<SidePanel />
      {:else if phoneSurface === 'export'}<ExportView />
      {:else if $view === 'songs'}<Songs />
      {:else if $view === 'settings'}<Settings />{/if}
    {:else}
      {#if $view === 'editor'}<Editor />
      {:else if $view === 'songs'}<Songs />
      {:else if $view === 'settings'}<Settings />{/if}
    {/if}
  </main>

  {#if !$isPhone && $view === 'editor'}
    <aside class="panel"><SidePanel /></aside>
    <div class="export"><ExportBar /></div>
  {/if}

  {#if $isPhone}<div class="tabs"><MobileTabs /></div>{/if}
</div>

{#if $previewOpen && !$isPhone}
  <div class="overlay" role="presentation" onclick={e => { if (e.target === e.currentTarget) previewOpen.set(false); }}
       onkeydown={e => { if (e.key === 'Escape') previewOpen.set(false); }}>
    <div class="sheet"><ExportView modal /></div>
  </div>
{/if}

<style>
  .shell {
    display: grid;
    grid-template-columns: var(--rail-w) minmax(0, 1fr) var(--panel-w);
    grid-template-rows: var(--top-h) minmax(0, 1fr) var(--export-h);
    height: 100dvh; background: var(--bg0);
  }
  .rail   { grid-column: 1; grid-row: 1 / -1; border-inline-end: 1px solid var(--line); background: var(--bg1); }
  .top    { grid-column: 2 / -1; grid-row: 1; border-bottom: 1px solid var(--line); background: var(--bg1); }
  .main   { grid-column: 2; grid-row: 2; overflow: auto; min-height: 0; }
  .panel  { grid-column: 3; grid-row: 2; min-height: 0; border-inline-start: 1px solid var(--line); background: var(--bg1); }
  .export { grid-column: 2 / -1; grid-row: 3; border-top: 1px solid var(--line); background: var(--bg1); }
  /* full-width main when panel is hidden (songs / settings) */
  .shell:not(.phone):not(:has(.panel)) .main { grid-column: 2 / -1; grid-row: 2 / -1; }

  @media (max-width: 1100px) { .shell { --panel-w: 320px; } }

  .phone {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 52px minmax(0, 1fr) var(--tabs-h);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .phone .top  { grid-column: 1; }
  .phone .main { grid-column: 1; grid-row: 2; }
  .phone .tabs { grid-column: 1; grid-row: 3; border-top: 1px solid var(--line); background: var(--bg1); }

  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center; z-index: 300; padding: 24px;
  }
  .sheet { width: min(760px, 100%); max-height: 90vh; overflow: auto; border-radius: var(--r4); background: var(--bg1); border: 1px solid var(--line2); box-shadow: var(--shadow); }
</style>
