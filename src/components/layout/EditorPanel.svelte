<script>
  import { editorFocus } from '../../lib/ui.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { song } from '../../lib/song.js';
  import { t } from '../../lib/i18n.js';
  import Editor from '../editor/Editor.svelte';
  import Button from '../ui/Button.svelte';

  const MIN = 320, MAX = 760;
  let dragging = $state(false);

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

<div class="ep" class:dragging>
  <div class="handle" role="separator" aria-orientation="vertical" onpointerdown={startDrag}></div>
  <div class="hd">
    <span class="title">📝 {$t('editorTitle')}</span>
    <span class="meta mono">{$song.sections.length} · {words}w</span>
    <Button size="sm" variant="ghost" icon={$editorFocus ? 'x' : 'align'} title={$editorFocus ? $t('editorUnfocus') : $t('editorFocus')}
            onclick={() => editorFocus.update(v => !v)} />
  </div>
  <div class="body"><Editor /></div>
</div>

<style>
  .ep { position: relative; display: flex; flex-direction: column; height: 100%; min-height: 0; }
  .handle { position: absolute; inset-inline-start: -4px; top: 0; bottom: 0; width: 8px; cursor: col-resize; z-index: 5; }
  .handle:hover, .dragging .handle { background: var(--accent-bg); }
  .dragging { user-select: none; }
  .hd { display: flex; align-items: center; gap: 8px; padding: 8px 10px 8px 12px; border-bottom: 1px solid var(--line); flex-shrink: 0; }
  .title { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); flex: 1; }
  .meta { font-size: 10px; color: var(--tx2); }
  .body { flex: 1; min-height: 0; overflow-y: auto; }
</style>
