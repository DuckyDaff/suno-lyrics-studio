<script>
  import { view, panelTab, mobileTab, isPhone, previewOpen, editorFocus } from '../../lib/ui.js';
  import { settings } from '../../lib/settings.js';
  import Rail from './Rail.svelte';
  import TopBar from './TopBar.svelte';
  import MobileTabs from './MobileTabs.svelte';
  import ExportBar from './ExportBar.svelte';
  import ExportView from './ExportView.svelte';
  import Workspace from './Workspace.svelte';
  import EditorPanel from './EditorPanel.svelte';
  import LeftPanel from './LeftPanel.svelte';
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
    if ($isPhone && ['ai', 'style', 'library'].includes($mobileTab)) panelTab.set($mobileTab);
  });
</script>

<div class="shell" class:phone={$isPhone} class:focus={$editorFocus} style="--editor-w:{$settings.editorW}px">
  {#if !$isPhone}<div class="rail"><Rail /></div>{/if}
  <div class="top"><TopBar /></div>

  {#if $isPhone}
    <main class="main">
      {#if phoneSurface === 'editor'}<Editor />
      {:else if phoneSurface === 'panel'}<SidePanel />
      {:else if phoneSurface === 'export'}<ExportView />
      {:else if $view === 'songs'}<Songs />
      {:else if $view === 'settings'}<Settings />{/if}
    </main>
    <div class="tabs"><MobileTabs /></div>
  {:else if $view === 'editor'}
    <aside class="editor"><EditorPanel /></aside>
    <main class="center"><Workspace /></main>
    <aside class="left"><LeftPanel /></aside>
    <div class="export"><ExportBar /></div>
  {:else}
    <main class="full">
      {#if $view === 'songs'}<Songs />{:else if $view === 'settings'}<Settings />{/if}
    </main>
  {/if}
</div>

{#if $previewOpen && !$isPhone}
  <div class="overlay" role="presentation" onclick={e => { if (e.target === e.currentTarget) previewOpen.set(false); }}
       onkeydown={e => { if (e.key === 'Escape') previewOpen.set(false); }}>
    <div class="sheet"><ExportView modal /></div>
  </div>
{/if}

<style>
  /* RTL: columns run right → left: rail · editor · centre workspace · library/studio */
  .shell {
    display: grid;
    grid-template-columns: var(--rail-w) var(--editor-w) minmax(0, 1fr) var(--panel-w);
    grid-template-rows: var(--top-h) minmax(0, 1fr) var(--export-h);
    height: 100dvh; background: var(--bg0);
    padding-top: env(safe-area-inset-top, 0px);
    padding-left: env(safe-area-inset-left, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    --panel-w: 340px;
  }
  .shell.focus { grid-template-columns: var(--rail-w) minmax(0, 1fr) 460px var(--panel-w); }

  .rail   { grid-column: 1; grid-row: 1 / -1; border-inline-end: 1px solid var(--line); background: var(--bg1); }
  .top    { grid-column: 2 / -1; grid-row: 1; border-bottom: 1px solid var(--line); background: var(--bg1); position: relative; }
  .top::before { content: ''; position: absolute; left: 0; right: 0; bottom: 100%; height: env(safe-area-inset-top, 0px); background: var(--bg1); }
  .editor { grid-column: 2; grid-row: 2; min-height: 0; min-width: 0; background: var(--bg0); border-inline-end: 1px solid var(--line); }
  .center { grid-column: 3; grid-row: 2; min-height: 0; min-width: 0; background: var(--bg0); }
  .left   { grid-column: 4; grid-row: 2; min-height: 0; min-width: 0; border-inline-start: 1px solid var(--line); background: var(--bg1); }
  .export { grid-column: 2 / -1; grid-row: 3; border-top: 1px solid var(--line); background: var(--bg1); }
  .full   { grid-column: 2 / -1; grid-row: 2 / -1; overflow: auto; min-height: 0; }

  @media (max-width: 1400px) { .shell { --panel-w: 300px; } }
  @media (max-width: 1180px) { .shell { --panel-w: 270px; } .shell:not(.focus) { grid-template-columns: var(--rail-w) min(var(--editor-w), 360px) minmax(0, 1fr) var(--panel-w); } }

  .phone {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 52px minmax(0, 1fr) var(--tabs-h);
    padding-bottom: env(safe-area-inset-bottom);
  }
  .phone .top  { grid-column: 1; }
  .phone .main { grid-column: 1; grid-row: 2; overflow: auto; min-height: 0; }
  .phone .tabs { grid-column: 1; grid-row: 3; border-top: 1px solid var(--line); background: var(--bg1); }

  .overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,.55); backdrop-filter: blur(3px);
    display: flex; align-items: center; justify-content: center; z-index: 300; padding: 24px;
  }
  .sheet { width: min(760px, 100%); max-height: 90vh; overflow: auto; border-radius: var(--r4); background: var(--bg1); border: 1px solid var(--line2); box-shadow: var(--shadow); }
</style>
