<script>
  import LIB from '../../lib/data/library.json';
  import { studioText } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { copyText } from '../../lib/clipboard.js';
  import ChipGroups from '../ui/ChipGroups.svelte';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  const GENRE_LABELS = {
    pop: 'Pop', hiphop: 'Hip-Hop', rnb: 'R&B / Soul', rock: 'Rock', electronic: 'Electronic',
    jazz: 'Jazz', latin: 'Latin', reggae: 'Reggae', cinematic: 'Cinematic', mediterranean: 'Mediterranean',
  };
  let genre = $state('');
  let cat = $state('');
  let query = $state('');

  const norm = s => s.trim().toLowerCase();
  const parts = $derived($studioText.split(',').map(s => s.trim()).filter(Boolean));
  const active = $derived(item => parts.some(p => norm(p) === norm(item)));

  function pick(item) {
    const i = parts.findIndex(p => norm(p) === norm(item));
    const next = i >= 0 ? parts.filter((_, j) => j !== i) : [...parts, item];
    studioText.set(next.join(', '));
  }
  const shuffle = a => [...a].sort(() => Math.random() - 0.5);
  const take = (a, n) => shuffle(a).slice(0, n);
  function roll() {
    const pool = genre ? LIB.studioGenres[genre] : null;
    const group = cat ? LIB.studio.find(g => g.name === cat) : null;
    let chips;
    if (pool && group) chips = [...take(pool, 2), ...take(group.items, 2)];
    else if (pool) chips = take(pool, 4);
    else if (group) chips = take(group.items, 3);
    else chips = take(LIB.studio[Math.floor(Math.random() * LIB.studio.length)].items, 3);
    studioText.set(chips.join(', '));
    toast('🎲 ' + [genre && GENRE_LABELS[genre], cat].filter(Boolean).join(' · ') || $t('randomize'), 'success');
  }
  async function copy() {
    if (!$studioText.trim()) return toast($t('toastNothing'), 'error');
    (await copyText($studioText.trim())) ? toast($t('toastStudioCopied'), 'success') : toast($t('toastCopyFail'), 'error');
  }
</script>

<div class="tab">
  <div class="top">
    <p class="hint faint">{$t('studioHint')}</p>
    <div class="out">
      <div class="hd">
        <span class="lbl">STYLE <span class="counter">{$studioText.length}</span></span>
        <Button size="sm" icon="copy" onclick={copy}>{$t('copy')}</Button>
        <Button size="sm" variant="ghost" icon="x" title={$t('clear')} onclick={() => studioText.set('')} />
      </div>
      <textarea class="field" rows="3" dir="ltr" bind:value={$studioText} placeholder={$t('studioPlaceholder')}></textarea>
    </div>
    <div class="row">
      <select class="field sel" bind:value={genre}>
        <option value="">🎵 {$t('allGenres')}</option>
        {#each Object.keys(LIB.studioGenres) as g}<option value={g}>{GENRE_LABELS[g] || g}</option>{/each}
      </select>
      <select class="field sel" bind:value={cat}>
        <option value="">{$t('allCategories')}</option>
        {#each LIB.studio as g}<option value={g.name}>{g.name}</option>{/each}
      </select>
      <Button variant="primary" icon="dice" title={$t('randomize')} onclick={roll} />
    </div>
    <div class="search">
      <Icon name="search" size={15} />
      <input class="field" placeholder={$t('librarySearch')} bind:value={query} />
    </div>
  </div>

  <ChipGroups groups={LIB.studio} {query} isActive={active} onpick={pick} />
</div>

<style>
  .tab { display: flex; flex-direction: column; min-height: 100%; }
  .top { position: sticky; top: 0; z-index: 2; background: var(--bg1); padding: 12px 12px 8px; border-bottom: 1px solid var(--line); display: flex; flex-direction: column; gap: 8px; }
  .hint { font-size: 11px; line-height: 1.45; }
  .out { display: flex; flex-direction: column; gap: 4px; }
  .hd { display: flex; align-items: center; gap: 4px; }
  .lbl { flex: 1; font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .12em; color: var(--accent); display: flex; gap: 8px; align-items: baseline; }
  textarea.field { font-family: var(--font-mono); font-size: var(--fs-xs); line-height: 1.6; text-align: left; }
  .row { display: flex; gap: 6px; }
  .sel { flex: 1; min-width: 0; padding: 7px 8px; font-size: var(--fs-xs); }
  .search { position: relative; color: var(--tx2); display: flex; align-items: center; }
  .search :global(svg) { position: absolute; inset-inline-start: 12px; pointer-events: none; }
  .search input { padding-inline-start: 36px; }
</style>
