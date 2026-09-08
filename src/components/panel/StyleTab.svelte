<script>
  import { song, actions } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { GENRES, GENRE_GROUPS } from '../../lib/data/genres.js';
  import { FIELDS, locks, history, randomize, toggleLock, clearLocks } from '../../lib/randomizer.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  const lim = $derived(limits($settings.sunoVersion));
  const len = $derived($song.style.length);
  const lvl = $derived(levelFor(len, lim.style));

  let familyId = $state('all');
  let fusion = $state(false);
  let showHistory = $state(false);
  const anyLock = $derived(Object.values($locks).some(Boolean));

  function roll() {
    const r = randomize({ familyId, fusion });
    actions.setStyle(r.text);
    toast('🎲 ' + r.familyLabel, 'success');
  }
  function restore(h) {
    actions.setStyle(h.text);
    showHistory = false;
  }
  const fieldLabel = key => $t('field_' + key);
</script>

<div class="tab">
  <section>
    <div class="hd">
      <label for="style-ta">{$t('styleTitle')}</label>
      <span class="counter {lvl === 'ok' ? '' : lvl}">{len} / {lim.style}</span>
    </div>
    <textarea id="style-ta" class="field" rows="5" dir="ltr" value={$song.style}
              placeholder={$t('stylePlaceholder')} oninput={e => actions.setStyle(e.target.value)}></textarea>
  </section>

  <section class="rand">
    <div class="row">
      <select class="field sel" bind:value={familyId} title={$t('pickGenre')}>
        <option value="all">🎲 {$t('allGenres')}</option>
        {#each GENRE_GROUPS as grp}
          <optgroup label={grp}>
            {#each GENRES.filter(g => g.group === grp) as g}
              <option value={g.id}>{g.label}</option>
            {/each}
          </optgroup>
        {/each}
      </select>
      <Button variant="primary" icon="dice" onclick={roll}>{$t('randomize')}</Button>
    </div>

    <div class="row wrap">
      <button class="pill" class:on={fusion} onclick={() => (fusion = !fusion)} title={$t('fusionHint')}>
        <Icon name="sparkles" size={13} /> {$t('fusion')}
      </button>
      <span class="sep"></span>
      {#each FIELDS as f}
        <button class="pill lock" class:on={$locks[f.key]} onclick={() => toggleLock(f.key)} title={$t('lockHint')}>
          {$locks[f.key] ? '🔒' : '🔓'} {fieldLabel(f.key)}
        </button>
      {/each}
      {#if anyLock}<button class="pill ghost" onclick={clearLocks}>{$t('unlockAll')}</button>{/if}
    </div>

    <div class="row between">
      <button class="linkBtn" onclick={() => (showHistory = !showHistory)} disabled={!$history.length}>
        <Icon name="undo" size={13} /> {$t('history')} {#if $history.length}({$history.length}){/if}
      </button>
      <Button variant="ghost" size="sm" icon="x" onclick={() => actions.setStyle('')}>{$t('clear')}</Button>
    </div>
    {#if showHistory && $history.length}
      <ul class="hist">
        {#each $history as h (h.ts)}
          <li><button onclick={() => restore(h)}><b>{h.familyLabel}</b><span>{h.text}</span></button></li>
        {/each}
      </ul>
    {/if}
  </section>

  <section>
    <div class="hd"><label for="excl-ta">{$t('excludeTitle')}</label></div>
    <textarea id="excl-ta" class="field" rows="2" dir="ltr" value={$song.exclude}
              placeholder={$t('excludePlaceholder')} oninput={e => actions.setExclude(e.target.value)}></textarea>
  </section>
</div>

<style>
  .tab { padding: 14px 14px 24px; display: flex; flex-direction: column; gap: 18px; }
  section { display: flex; flex-direction: column; gap: 8px; }
  .hd { display: flex; justify-content: space-between; align-items: baseline; }
  label { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  textarea.field { font-family: var(--font-mono); font-size: var(--fs-sm); line-height: 1.6; text-align: left; }
  .rand { background: var(--bg2); border: 1px solid var(--line); border-radius: var(--r3); padding: 10px; gap: 8px; }
  .row { display: flex; gap: 6px; align-items: center; }
  .row.wrap { flex-wrap: wrap; }
  .row.between { justify-content: space-between; }
  .sel { flex: 1; padding: 7px 10px; font-size: var(--fs-sm); background: var(--bg1); }
  .sep { width: 1px; height: 18px; background: var(--line2); margin: 0 2px; }
  .pill {
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px;
    font-size: 11px; font-weight: 700; color: var(--tx2); background: var(--bg1); border: 1px solid var(--line);
    transition: all .12s;
  }
  .pill:hover { color: var(--tx0); border-color: var(--line2); }
  .pill.on { color: var(--accent); background: var(--accent-bg); border-color: var(--accent-bd); }
  .pill.lock.on { color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
  .pill.ghost { border-style: dashed; }
  .linkBtn { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-xs); font-weight: 600; color: var(--tx1); }
  .linkBtn:hover:not(:disabled) { color: var(--accent); }
  .hist { list-style: none; display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
  .hist button {
    width: 100%; text-align: start; padding: 7px 9px; border-radius: var(--r2); background: var(--bg1);
    border: 1px solid var(--line); display: flex; flex-direction: column; gap: 2px;
  }
  .hist button:hover { border-color: var(--accent-bd); }
  .hist b { font-size: 11px; color: var(--accent); }
  .hist span { font-family: var(--font-mono); font-size: 11px; color: var(--tx1); direction: ltr; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
</style>
