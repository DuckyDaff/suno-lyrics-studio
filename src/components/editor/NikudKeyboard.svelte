<script>
  import { MARKS, MARKS2, insertMark, deleteMark } from '../../lib/hebrew/marks.js';
  import { t, lang } from '../../lib/i18n.js';

  /** getTa(): returns the textarea to act on (keeps focus thanks to mousedown.preventDefault) */
  let { getTa, onclose } = $props();
  const act = fn => { const ta = getTa?.(); if (ta) { ta.focus(); fn(ta); } };
</script>

<div class="kbd" role="toolbar" tabindex="-1" onmousedown={e => e.preventDefault()}>
  <div class="row">
    {#each MARKS as m}
      <button class="k" title={$lang === 'he' ? m.name : m.en} onclick={() => act(ta => insertMark(ta, m.ch))}>
        <span class="g">{m.glyph}</span><span class="n">{$lang === 'he' ? m.name : m.en}</span>
      </button>
    {/each}
  </div>
  <div class="row">
    {#each MARKS2 as m}
      <button class="k" title={$lang === 'he' ? m.name : m.en} onclick={() => act(ta => insertMark(ta, m.ch))}>
        <span class="g">{m.glyph}</span><span class="n">{$lang === 'he' ? m.name : m.en}</span>
      </button>
    {/each}
    <button class="k del" title={$t('kbdDelete')} onclick={() => act(ta => deleteMark(ta))}>
      <span class="g">×</span><span class="n">{$t('kbdDelete')}</span>
    </button>
    <span class="hint">{$t('kbdHint')}</span>
    <button class="close" onclick={onclose} title={$t('clear')}>✕</button>
  </div>
</div>

<style>
  .kbd { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; padding: 8px; background: var(--bg2); border: 1px solid var(--line); border-radius: var(--r2); direction: rtl; }
  .row { display: flex; flex-wrap: wrap; gap: 3px; align-items: center; }
  .k {
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0;
    min-width: 40px; padding: 3px 5px; border-radius: var(--r1); border: 1px solid var(--line); background: var(--bg1); color: var(--tx0);
    font-family: 'David Libre', 'Frank Ruehl CLM', 'Noto Serif Hebrew', serif;
  }
  .k:hover { border-color: var(--accent); color: var(--accent); }
  .k:active { transform: scale(.94); }
  .g { font-size: 19px; line-height: 1.25; }
  .n { font-size: 9px; font-family: var(--font-ui); color: var(--tx2); white-space: nowrap; }
  .k:hover .n { color: var(--accent); }
  .del { color: var(--err); }
  .del:hover { border-color: var(--err); color: var(--err); }
  .hint { margin-inline-start: auto; font-size: 10px; color: var(--tx2); }
  .close { color: var(--tx2); padding: 2px 6px; }
  .close:hover { color: var(--tx0); }
  @media (max-width: 768px) { .k { min-width: 44px; } .hint { display: none; } }
</style>
