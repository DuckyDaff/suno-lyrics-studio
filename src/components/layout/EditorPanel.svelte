<script>
  import { editorFocus } from '../../lib/ui.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { song } from '../../lib/song.js';
  import { t } from '../../lib/i18n.js';
  import Editor from '../editor/Editor.svelte';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  const MIN = 320, MAX = 760;
  let dragging = $state(false);
  const collapsed = $derived($settings.editorCollapsed);

  function expand() { setSetting('editorCollapsed', false); }
  function collapse() { setSetting('editorCollapsed', true); editorFocus.set(false); }

  // drag the panel's inline-start edge (RTL: the left edge) to resize
  function startDrag(e) {
    e.preventDefault();
    const startX = e.clientX, startW = $settings.editorW;
    const rtl = getComputedStyle(document.documentElement).direction === 'rtl';
    dragging = true;
    const move = ev => {
      const dx = ev.clientX - startX;
      const w = Math.round(Math.min(MAX, Math.max(MIN, startW + (rtl ? -dx : dx))));
      setSetting('editorW', w);
    };
    const up = () => { dragging = false; window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }
  const words = $derived($song.sections.reduce((n, s) => n + (s.text || '').split(/\s+/).filter(Boolean).length, 0));
</script>

{#if collapsed}
  <button class="strip" onclick={expand} title={$t('editorOpen')}>
    <Icon name="pen" size={18} />
    <span class="vlabel">{$t('editorTitle')}</span>
    <span class="cnt mono">{$song.sections.length}</span>
  </button>
{:else}
  <div class="ep" class:dragging>
    <div class="handle" role="separator" aria-orientation="vertical" onpointerdown={startDrag}></div>
    <div class="hd">
      <span class="title">📝 {$t('editorTitle')}</span>
      <span class="meta mono">{$song.sections.length} · {words}w</span>
      <Button size="sm" variant="ghost" icon="align" active={$editorFocus} title={$editorFocus ? $t('editorUnfocus') : $t('editorFocus')}
              onclick={() => editorFocus.update(v => !v)} />
      <Button size="sm" variant="ghost" icon="x" title={$t('editorClose')} onclick={collapse} />
    </div>
    <div class="body"><Editor /></div>
  </div>
{/if}

<style>
  .strip {
    width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding-top: 14px; color: var(--tx2); background: var(--bg1); border-inline-end: 1px solid var(--line);
  }
  .strip:hover { color: var(--accent); background: var(--bg2); }
  .vlabel { writing-mode: vertical-rl; transform: rotate(180deg); font-size: var(--fs-xs); font-weight: 700; letter-spacing: .08em; }
  .cnt { font-size: 10px; background: var(--bg3); border-radius: 999px; padding: 1px 6px; }
  .ep { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .handle { position: absolute; inset-inline-start: -4px; top: 0; bottom: 0; width: 8px; cursor: col-resize; z-index: 5; }
  .handle:hover, .dragging .handle { background: var(--accent-bg); }
  .dragging { user-select: none; }
  .hd { display: flex; align-items: center; gap: 6px; padding: 8px 10px 8px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
  .title { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); flex: 1; }
  .meta { font-size: 10px; color: var(--tx2); }
  .body { flex: 1; min-height: 0; overflow-y: auto; }
</style>
