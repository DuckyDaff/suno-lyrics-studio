<script>
  import LIB from '../../lib/data/library.json';
  import { song } from '../../lib/song.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { inStyle, toggleStyle, insertLyrics, addSectionTag } from '../../lib/insert.js';
  import ChipGroups from '../ui/ChipGroups.svelte';
  import Icon from '../ui/Icon.svelte';

  let kind = $state('style');   // tags | style | lyrics
  let query = $state('');

  const kinds = $derived([
    { id: 'style',  label: $t('kindStyle'),  groups: LIB.style },
    { id: 'lyrics', label: $t('kindLyrics'), groups: LIB.lyrics },
    { id: 'tags',   label: $t('kindTags'),   groups: LIB.tags },
  ]);
  const current = $derived(kinds.find(k => k.id === kind));
  const total = $derived(current.groups.reduce((n, g) => n + g.items.length, 0));

  // re-evaluates when the style prompt changes so chips highlight live
  const active = $derived.by(() => { $song.style; return item => inStyle(item); });

  function pick(item, group) {
    const isBracket = item.startsWith('[');
    if (kind === 'lyrics' || (kind === 'tags' && isBracket)) {
      insertLyrics(item) ? toast($t('toastInserted', { x: item }), 'success') : toast($t('toastNoSection'), 'error');
    } else if (kind === 'tags' && group.name === 'Structure') {
      addSectionTag(item);
      toast($t('toastSection', { x: item }), 'success');
    } else {
      const r = toggleStyle(item);
      toast($t(r === 'added' ? 'toastAddedStyle' : 'toastRemovedStyle', { x: item }), r === 'added' ? 'success' : '');
    }
  }
</script>

<div class="tab">
  <div class="top">
    <div class="search">
      <Icon name="search" size={15} />
      <input class="field" placeholder={$t('librarySearch')} bind:value={query} />
      {#if query}<button class="clr" onclick={() => (query = '')}><Icon name="x" size={13} /></button>{/if}
    </div>
    <div class="kinds">
      {#each kinds as k}
        <button class:on={kind === k.id} onclick={() => (kind = k.id)}>{k.label}</button>
      {/each}
    </div>
    <p class="hint faint">
      {#if kind === 'style'}{$t('hintStyle')}{:else if kind === 'lyrics'}{$t('hintLyrics')}{:else}{$t('hintTags')}{/if}
      <span class="mono"> · {total}</span>
    </p>
  </div>

  {#key kind}
    <ChipGroups groups={current.groups} {query} isActive={kind === 'lyrics' ? () => false : active}
                mono={kind === 'lyrics'} onpick={pick} />
  {/key}
</div>

<style>
  .tab { display: flex; flex-direction: column; min-height: 100%; }
  .top { position: sticky; top: 0; z-index: 2; background: var(--bg1); padding: 12px 12px 8px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px; }
  .search { position: relative; color: var(--tx2); display: flex; align-items: center; }
  .search :global(svg:first-child) { position: absolute; inset-inline-start: 12px; pointer-events: none; }
  .search input { padding-inline-start: 36px; padding-inline-end: 34px; }
  .clr { position: absolute; inset-inline-end: 8px; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; color: var(--tx2); }
  .clr:hover { background: var(--bg3); color: var(--tx0); }
  .kinds { display: flex; gap: 4px; background: var(--bg2); padding: 3px; border-radius: var(--r2); }
  .kinds button { flex: 1; padding: 6px 8px; border-radius: var(--r1); font-size: var(--fs-xs); font-weight: 700; color: var(--tx2); }
  .kinds button.on { background: var(--bg1); color: var(--accent); box-shadow: 0 1px 3px rgba(0,0,0,.25); }
  .hint { font-size: 11px; line-height: 1.4; }
</style>
