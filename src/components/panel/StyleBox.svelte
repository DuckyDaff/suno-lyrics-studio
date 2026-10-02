<script>
  /** The Style of Music box inside ✨ Create: AI Style, randomizer in the chosen form, copy, history, exclude.
   *  It uses the same form as the lyrics (one shared style list), and the active artist's signature sound. */
  import { song, actions } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { generate, busy } from '../../lib/ai.js';
  import { genState as g, setGen } from '../../lib/genState.js';
  import { activeArtist, tagSong } from '../../lib/artists.js';
  import { FIELDS, locks, history, randomize, toggleLock, clearLocks, pushHistory, mergeTags } from '../../lib/randomizer.js';
  import { FORMS } from '../../lib/data/forms.js';
  import { copyText } from '../../lib/clipboard.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  /** buildFields(mode) → the shared generation payload (form, idea, mix, music, genre hint…) */
  let { buildFields } = $props();

  const lim = $derived(limits($settings.sunoVersion));
  const len = $derived($song.style.length);
  const lvl = $derived(levelFor(len, lim.style));
  const sig = $derived(($activeArtist?.sound || '').trim());
  const anyLock = $derived(Object.values($locks).some(Boolean));

  let fusion = $state(false);
  let showHistory = $state(false);
  let exOpen = $state(false);
  let aiBusy = $state(false);
  let draft = $state('');
  let err = $state('');
  let ctrl = null;

  function roll(any = false) {
    let form = $g.form;
    if (any) { form = FORMS[Math.floor(Math.random() * FORMS.length)]; setGen({ form }); }
    pushHistory($song.style, $t('sbBefore'));
    const r = randomize({ form, fusion, prefix: sig });
    actions.setStyle(r.text);
    tagSong();
    toast('🎲 ' + r.familyLabel, 'success');
  }

  async function ai() {
    if (aiBusy) { ctrl?.abort(); return; }
    if ($busy) return;
    err = ''; aiBusy = true; draft = '';
    ctrl = new AbortController();
    const before = $song.style;
    pushHistory(before, $t('sbBefore'));
    try {
      const fields = { ...buildFields('style'), mode: 'style', limit: lim.style };
      const r = await generate(fields, (_, full) => { draft = full; }, { signal: ctrl.signal });
      const text = r.text.trim().replace(/^["'`]+|["'`]+$/g, '').replace(/\s*\n+\s*/g, ' ');
      if (!text) return;
      const out = sig ? mergeTags(sig, text) : text;
      actions.setStyle(out);
      pushHistory(out, '✨ ' + ($g.form || 'AI'));
      tagSong();
    } catch (e) {
      if (e.code !== 'aborted') err = $t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error');
    } finally { aiBusy = false; draft = ''; ctrl = null; }
  }

  function restore(h) { pushHistory($song.style, $t('sbBefore')); actions.setStyle(h.text); showHistory = false; }
  async function copyStyle() {
    const txt = $song.style.trim();
    if (!txt) return toast($t('toastNothing'), 'error');
    (await copyText(txt)) ? toast($t('toastStyleCopied'), 'success') : toast($t('toastCopyFail'), 'error');
  }
  const fieldLabel = key => $t('field_' + key);
</script>

<section class="sbox" class:busy={aiBusy}>
  <div class="hd">
    <label class="ttl" for="sb-ta">🎨 {$t('styleTitle')}</label>
    {#if sig}<span class="sig" title={sig}>{$activeArtist.emoji || '🎧'} {$t('sbSig', { name: $activeArtist.name })}</span>{/if}
    <span class="counter {lvl === 'ok' ? '' : lvl}">{aiBusy ? draft.length : len} / {lim.style}</span>
    <button class="cpy" onclick={copyStyle} disabled={!len || aiBusy}><Icon name="copy" size={13} /> {$t('copyStyle')}</button>
  </div>

  <textarea id="sb-ta" class="field" rows="4" dir="ltr" value={aiBusy ? draft : $song.style} readonly={aiBusy}
            placeholder={$t('stylePlaceholder')} oninput={e => actions.setStyle(e.target.value)}></textarea>

  <div class="row wrap">
    <Button variant="primary" size="sm" icon={aiBusy ? 'x' : 'sparkles'} onclick={ai} disabled={$busy && !aiBusy}>{aiBusy ? $t('aiStop') : $t('sbAi')}</Button>
    <Button size="sm" icon="dice" onclick={() => roll(false)} disabled={aiBusy}>{$t('sbRoll')} <span class="form mono">{$g.form}</span></Button>
    <Button size="sm" variant="ghost" onclick={() => roll(true)} disabled={aiBusy} title={$t('sbSurpriseTitle')}>🎲 {$t('sbSurprise')}</Button>
    <button class="pill" class:on={fusion} onclick={() => (fusion = !fusion)} title={$t('fusionHint')}><Icon name="sparkles" size={12} /> {$t('fusion')}</button>
  </div>
  <p class="faint hint">{$t('sbHint')}</p>

  <div class="row wrap">
    {#each FIELDS as f}
      <button class="pill lock" class:on={$locks[f.key]} onclick={() => toggleLock(f.key)} title={$t('lockHint')}>
        {$locks[f.key] ? '🔒' : '🔓'} {fieldLabel(f.key)}
      </button>
    {/each}
    {#if anyLock}<button class="pill ghost" onclick={clearLocks}>{$t('unlockAll')}</button>{/if}
  </div>

  {#if err}<div class="err"><Icon name="alert" size={13} /> {err}</div>{/if}

  <div class="row between">
    <span class="row">
      <button class="linkBtn" onclick={() => (showHistory = !showHistory)} disabled={!$history.length}>
        <Icon name="undo" size={13} /> {$t('history')} {#if $history.length}({$history.length}){/if}
      </button>
      <button class="linkBtn" onclick={() => (exOpen = !exOpen)}>🚫 {$t('excludeTitle')}{#if $song.exclude.trim()} ✓{/if}</button>
    </span>
    <Button variant="ghost" size="sm" icon="x" onclick={() => { pushHistory($song.style, $t('sbBefore')); actions.setStyle(''); }} disabled={aiBusy || !len}>{$t('clear')}</Button>
  </div>
  {#if showHistory && $history.length}
    <ul class="hist">
      {#each $history as h (h.ts)}
        <li><button onclick={() => restore(h)}><b>{h.familyLabel}</b><span>{h.text}</span></button></li>
      {/each}
    </ul>
  {/if}
  {#if exOpen}
    <textarea class="field" rows="2" dir="ltr" value={$song.exclude} placeholder={$t('excludePlaceholder')}
              oninput={e => actions.setExclude(e.target.value)}></textarea>
  {/if}
  <label class="chk"><input type="checkbox" bind:checked={$g.useStyle} /> {$t('aiUseStyle')}</label>
</section>

<style>
  .sbox { display: flex; flex-direction: column; gap: 7px; padding: 10px 12px; border-radius: var(--r3); background: var(--bg2); border: 1px solid var(--accent-bd); }
  .sbox.busy { border-color: var(--accent); }
  .hd { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .ttl { flex: 1; font-size: var(--fs-sm); font-weight: 800; color: var(--tx0); }
  .sig { font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 999px; color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-bd); max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cpy { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-xs); font-weight: 700; color: var(--accent); padding: 4px 10px; border-radius: 999px; background: var(--bg1); border: 1px solid var(--accent-bd); }
  .cpy:hover:not(:disabled) { background: var(--accent-bg); }
  .cpy:disabled { opacity: .4; }
  textarea.field { font-family: var(--font-mono); font-size: var(--fs-sm); line-height: 1.6; text-align: left; background: var(--bg1); }
  .row { display: flex; gap: 6px; align-items: center; }
  .row.wrap { flex-wrap: wrap; }
  .row.between { justify-content: space-between; }
  .form { font-size: 10px; opacity: .8; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .hint { font-size: 11px; line-height: 1.45; }
  .pill { display: inline-flex; align-items: center; gap: 4px; padding: 4px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--tx2); background: var(--bg1); border: 1px solid var(--line); }
  .pill:hover { color: var(--tx0); border-color: var(--line2); }
  .pill.on { color: var(--accent); background: var(--accent-bg); border-color: var(--accent-bd); }
  .pill.lock.on { color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
  .pill.ghost { border-style: dashed; }
  .linkBtn { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-xs); font-weight: 600; color: var(--tx1); }
  .linkBtn:hover:not(:disabled) { color: var(--accent); }
  .linkBtn:disabled { opacity: .4; }
  .err { display: flex; align-items: center; gap: 6px; color: var(--err); font-size: var(--fs-xs); }
  .hist { list-style: none; display: flex; flex-direction: column; gap: 4px; max-height: 220px; overflow-y: auto; }
  .hist button { width: 100%; text-align: start; padding: 7px 9px; border-radius: var(--r2); background: var(--bg1); border: 1px solid var(--line); display: flex; flex-direction: column; gap: 2px; }
  .hist button:hover { border-color: var(--accent-bd); }
  .hist b { font-size: 11px; color: var(--accent); }
  .hist span { font-family: var(--font-mono); font-size: 11px; color: var(--tx1); direction: ltr; text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .chk { display: flex; align-items: center; gap: 6px; font-size: var(--fs-xs); font-weight: 600; color: var(--tx1); cursor: pointer; }
  .chk input { accent-color: var(--accent); }
</style>
