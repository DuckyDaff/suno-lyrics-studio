<script>
  import { actions } from '../../lib/song.js';
  import { activeSectionId } from '../../lib/ui.js';
  import { sectionColor } from '../../lib/sections.js';
  import { t } from '../../lib/i18n.js';
  import Button from '../ui/Button.svelte';
  import WordTools from './WordTools.svelte';

  let { sec, index, total } = $props();
  let ta = $state(null);
  let editingName = $state(false);
  const focus = node => { node.focus(); node.select(); };

  const color = $derived(sectionColor(sec.name));
  const active = $derived($activeSectionId === sec.id);
  const lines = $derived((sec.text || '').split('\n').filter(l => l.trim()).length);

  function resize() {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }
  $effect(() => { sec.text; resize(); });
</script>

<article class="card" class:active style="--c:{color}">
  <header>
    {#if editingName}
      <input class="name mono" value={sec.name} use:focus
             onblur={e => { actions.setName(sec.id, e.target.value.trim() || sec.name); editingName = false; }}
             onkeydown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') editingName = false; }} />
    {:else}
      <button class="badge mono" onclick={() => (editingName = true)} title={sec.name}>[{sec.name}]</button>
    {/if}
    <span class="meta">{lines} {$t('lines')} · {(sec.text || '').length} {$t('chars')}</span>
    <div class="acts">
      <Button variant="ghost" size="sm" title={$t('dir')} onclick={() => actions.toggleDir(sec.id)}>
        <span class="mono dir">{sec.dir === 'ltr' ? 'LTR' : 'RTL'}</span>
      </Button>
      <Button variant="ghost" size="sm" icon="arrowUp" title={$t('moveUp')} disabled={index === 0} onclick={() => actions.move(sec.id, -1)} />
      <Button variant="ghost" size="sm" icon="arrowDown" title={$t('moveDown')} disabled={index === total - 1} onclick={() => actions.move(sec.id, 1)} />
      <Button variant="ghost" size="sm" icon="trash" title={$t('remove')} onclick={() => actions.remove(sec.id)} />
    </div>
  </header>

  <textarea bind:this={ta} data-sec={sec.id} rows="3" dir={sec.dir} value={sec.text}
            placeholder={$t('lyricsPlaceholder')}
            oninput={e => { actions.setText(sec.id, e.target.value); resize(); }}
            onfocus={() => activeSectionId.set(sec.id)}></textarea>

  {#if active}<WordTools {sec} />{/if}
</article>

<style>
  .card {
    background: var(--bg1); border: 1px solid var(--line); border-radius: var(--r3);
    border-inline-start: 3px solid var(--c); padding: 10px 14px 12px;
    transition: border-color .12s, box-shadow .12s;
  }
  .card.active { border-color: var(--line2); border-inline-start-color: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 12%, transparent); }
  header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .badge {
    font-size: var(--fs-xs); font-weight: 700; letter-spacing: .04em; color: var(--c);
    background: color-mix(in srgb, var(--c) 12%, transparent); border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    padding: 3px 9px; border-radius: 999px; direction: ltr;
  }
  .name { font-size: var(--fs-xs); font-weight: 700; background: var(--bg2); border: 1px solid var(--accent); border-radius: 999px; padding: 3px 9px; width: 140px; direction: ltr; }
  .meta { font-size: 11px; color: var(--tx2); flex: 1; }
  .acts { display: flex; gap: 0; opacity: .55; transition: opacity .12s; }
  .card:hover .acts, .card.active .acts { opacity: 1; }
  .dir { font-size: 10px; font-weight: 700; }
  textarea {
    width: 100%; background: transparent; border: none; outline: none;
    font-size: 16px; line-height: 1.85; color: var(--tx0); padding: 4px 2px; min-height: 84px;
    unicode-bidi: plaintext;
  }
  @media (max-width: 768px) {
    .card { padding: 8px 10px 10px; }
    .meta { display: none; }
    .acts { opacity: 1; }
  }
</style>
