<script>
  import { TEMPLATES } from '../../lib/data/templates.js';
  import { song, actions, hasContent } from '../../lib/song.js';
  import { newSong } from '../../lib/songs.js';
  import { modal, view, homographs } from '../../lib/ui.js';
  import { settings } from '../../lib/settings.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';

  let picked = $state(null);
  let asNew = $state(true);
  let keepStyle = $state(false);
  const lbl = tp => ($settings.lang === 'he' ? tp.he : tp.en);

  function apply() {
    if (!picked) return;
    if (asNew) { newSong(); homographs.set(new Map()); }
    else if ($hasContent && !confirm($t('confirmTemplate'))) return;
    const secs = picked.sections.map(name => ({ name, text: '' }));
    actions.replaceAll(secs, keepStyle && $song.style.trim() ? null : picked.style);
    modal.set('');
    view.set('editor');
    toast($t('toastTemplate').replace('{t}', lbl(picked)), 'success');
  }
</script>

<div class="wrap">
  <header>
    <h2>{$t('templatesTitle')}</h2>
    <Button variant="ghost" icon="x" onclick={() => modal.set('')} />
  </header>
  <p class="faint small">{$t('templatesHint')}</p>

  <div class="grid">
    {#each TEMPLATES as tp (tp.id)}
      <button class="tpl" class:on={picked?.id === tp.id} onclick={() => (picked = tp)}>
        <span class="ico">{tp.icon}</span>
        <span class="nm">{lbl(tp)}</span>
        <span class="n faint">{tp.sections.length} {$t('sectionsN')}</span>
      </button>
    {/each}
  </div>

  {#if picked}
    <div class="detail">
      <div class="style" dir="ltr">{picked.style}</div>
      <div class="secs">
        {#each picked.sections as s}<span class="chip">[{s}]</span>{/each}
      </div>
      <div class="opts">
        <label><input type="checkbox" bind:checked={asNew} /> {$t('templateAsNew')}</label>
        <label><input type="checkbox" bind:checked={keepStyle} disabled={!$song.style.trim()} /> {$t('templateKeepStyle')}</label>
      </div>
      <Button size="lg" icon="check" onclick={apply}>{$t('useTemplate')}</Button>
    </div>
  {/if}
</div>

<style>
  .wrap { padding: 18px 18px 24px; display: flex; flex-direction: column; gap: 14px; }
  header { display: flex; align-items: center; justify-content: space-between; }
  h2 { font-size: var(--fs-lg); }
  .small { font-size: var(--fs-xs); line-height: 1.5; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
  .tpl { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 8px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-sm); color: var(--tx0); }
  .tpl:hover { border-color: var(--accent-bd); }
  .tpl.on { border-color: var(--accent); background: var(--accent-bg); }
  .ico { font-size: 22px; }
  .nm { font-weight: 700; }
  .n { font-size: 11px; }
  .detail { display: flex; flex-direction: column; gap: 10px; padding: 14px; border-radius: var(--r3); background: var(--bg2); border: 1px solid var(--line); }
  .style { font-family: var(--font-mono); font-size: var(--fs-xs); text-align: left; color: var(--tx1); }
  .secs { display: flex; flex-wrap: wrap; gap: 5px; direction: ltr; }
  .chip { font-family: var(--font-mono); font-size: 11px; padding: 2px 7px; border-radius: 999px; background: var(--bg3); color: var(--tx1); }
  .opts { display: flex; gap: 16px; flex-wrap: wrap; font-size: var(--fs-sm); }
  .opts label { display: flex; align-items: center; gap: 6px; }
</style>
