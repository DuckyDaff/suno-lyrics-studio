<script>
  import { song, actions } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';

  const lim = $derived(limits($settings.sunoVersion));
  const len = $derived($song.style.length);
  const lvl = $derived(levelFor(len, lim.style));
</script>

<div class="tab">
  <section>
    <div class="hd">
      <label for="style-ta">{$t('styleTitle')}</label>
      <span class="counter {lvl === 'ok' ? '' : lvl}">{len} / {lim.style}</span>
    </div>
    <textarea id="style-ta" class="field" rows="5" dir="ltr" value={$song.style}
              placeholder={$t('stylePlaceholder')} oninput={e => actions.setStyle(e.target.value)}></textarea>
    <div class="row">
      <select class="field sel" disabled title={$t('lockHint')}><option>{$t('allGenres')}</option></select>
      <Button icon="dice" onclick={() => toast($t('lockHint'))}>{$t('randomize')}</Button>
      <Button variant="ghost" icon="x" title={$t('clear')} onclick={() => actions.setStyle('')} />
    </div>
  </section>

  <section>
    <div class="hd"><label for="excl-ta">{$t('excludeTitle')}</label></div>
    <textarea id="excl-ta" class="field" rows="2" dir="ltr" value={$song.exclude}
              placeholder={$t('excludePlaceholder')} oninput={e => actions.setExclude(e.target.value)}></textarea>
  </section>

  <p class="hint faint">{$t('libraryComing')}</p>
</div>

<style>
  .tab { padding: 14px 14px 24px; display: flex; flex-direction: column; gap: 18px; }
  section { display: flex; flex-direction: column; gap: 8px; }
  .hd { display: flex; justify-content: space-between; align-items: baseline; }
  label { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  textarea.field { font-family: var(--font-mono); font-size: var(--fs-sm); line-height: 1.6; text-align: left; }
  .row { display: flex; gap: 6px; align-items: center; }
  .sel { flex: 1; padding: 7px 10px; font-size: var(--fs-xs); }
  .hint { font-size: var(--fs-xs); line-height: 1.6; }
</style>
