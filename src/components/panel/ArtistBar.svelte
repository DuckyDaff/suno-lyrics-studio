<script>
  /** 🎧 Artist ("hat") picker + editor at the top of ✨ Create. */
  import { artistList, activeArtist, blankArtist, saveArtist, deleteArtist, useArtist, parseArtist } from '../../lib/artists.js';
  import { genState as g, setGen } from '../../lib/genState.js';
  import { song, actions } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { generate, busy } from '../../lib/ai.js';
  import { FORMS, FORM_GROUPS } from '../../lib/data/forms.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';

  let editing = $state(null);     // draft artist being edited, or null
  let desc = $state('');
  let aiBusy = $state(false);

  const isNew = $derived(editing && !$artistList.some(a => a.id === editing.id));
  const songEmpty = () => !$song.title && !$song.style.trim() && !$song.sections.some(x => (x.text || '').trim());

  function pick(a) {
    useArtist(a?.id || '');
    if (!a) return;
    if (a.form && FORMS.includes(a.form) && a.form !== $g.form) setGen({ form: a.form });
    if (a.exclude && !$song.exclude.trim()) actions.setExclude(a.exclude);
    if (songEmpty() || !$song.artist) actions.setArtist(a);
    toast(`${a.emoji || '🎧'} ${a.name}`, 'success');
  }
  function startNew() { editing = blankArtist(); desc = ''; }
  function startEdit(a) { editing = { ...a }; desc = ''; }
  function save() {
    if (!editing.name.trim()) return toast($t('arNameNeeded'), 'error');
    const e = saveArtist({ ...editing, name: editing.name.trim() });
    editing = null;
    pick(e);
  }
  function remove() {
    if (!confirm($t('arConfirmDelete', { name: editing.name || '' }))) return;
    deleteArtist(editing.id); editing = null;
  }
  const matchForm = f => FORMS.find(x => x.toLowerCase() === String(f || '').toLowerCase().trim()) || '';

  async function aiFill(fromSong) {
    if (aiBusy || $busy) return;
    aiBusy = true;
    try {
      const r = await generate({
        mode: 'artist', idea: desc, fromSong, formList: FORMS.join(' | '),
        language: $settings.lang === 'he' ? 'Hebrew' : 'English', artist: null, producerTag: '',
      }, () => {});
      const p = parseArtist(r.text);
      if (!p.sound && !p.name) throw Object.assign(new Error('empty'), { code: 'api_error' });
      const keep = Object.fromEntries(Object.entries(p).filter(([, v]) => v));
      if (keep.form) keep.form = matchForm(keep.form);
      // a name the user already typed wins
      if (editing.name.trim()) delete keep.name;
      editing = { ...editing, ...keep };
      toast($t('arAiDone'), 'success');
    } catch (e) {
      if (e.code !== 'aborted') toast($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error'), 'error');
    } finally { aiBusy = false; }
  }
</script>

<section class="abar" class:on={$activeArtist}>
  <div class="row">
    <span class="lbl">🎧 {$t('arTitle')}</span>
    <div class="chips">
      <button class="chip" class:on={!$activeArtist} onclick={() => pick(null)}>{$t('arNone')}</button>
      {#each $artistList as a (a.id)}
        <button class="chip" class:on={$activeArtist?.id === a.id} onclick={() => pick(a)} title={a.sound}>{a.emoji || '🎧'} {a.name}</button>
      {/each}
      {#if !editing}<button class="chip add" onclick={startNew}>+ {$t('arNew')}</button>{/if}
    </div>
    {#if $activeArtist && !editing}<button class="linkBtn" onclick={() => startEdit($activeArtist)}>✏️ {$t('arEdit')}</button>{/if}
  </div>

  {#if $activeArtist && !editing}
    <div class="sum">
      {#if $activeArtist.sound}<span class="mono" dir="ltr">{$activeArtist.sound}</span>{/if}
      {#if $activeArtist.voice}<span class="mono dim" dir="ltr">🎙 {$activeArtist.voice}</span>{/if}
      {#if $activeArtist.tag}<span class="mono dim" dir="ltr">🔊 {$activeArtist.tag}</span>{/if}
      {#if $activeArtist.notes}<span class="dim" dir="auto">📝 {$activeArtist.notes}</span>{/if}
    </div>
  {:else if !$artistList.length && !editing}
    <p class="faint hint">{$t('arIntro')}</p>
  {/if}

  {#if editing}
    <div class="ed">
      <div class="aiRow">
        <input class="field" bind:value={desc} placeholder={$t('arDescPh')} dir="auto" />
        <Button size="sm" variant="primary" icon="sparkles" onclick={() => aiFill(false)} disabled={aiBusy || $busy}>{aiBusy ? $t('arAiBusy') : $t('arAi')}</Button>
        <Button size="sm" variant="ghost" onclick={() => aiFill(true)} disabled={aiBusy || $busy} title={$t('arFromSongTitle')}>🎵 {$t('arFromSong')}</Button>
      </div>

      <div class="g2">
        <label class="f"><span>{$t('arName')}</span><input class="field" bind:value={editing.name} dir="auto" placeholder="DJ Denver" /></label>
        <label class="f em"><span>{$t('arEmoji')}</span><input class="field" bind:value={editing.emoji} maxlength="4" /></label>
      </div>
      <label class="f"><span>{$t('arForm')}</span>
        <select class="field" bind:value={editing.form}>
          <option value="">{$t('arFormAny')}</option>
          {#each FORM_GROUPS as fg}<optgroup label={$settings.lang === 'he' ? fg.he : fg.en}>{#each fg.items as f}<option value={f}>{f}</option>{/each}</optgroup>{/each}
        </select></label>
      <label class="f"><span>{$t('arSound')}</span>
        <textarea class="field" rows="2" dir="ltr" bind:value={editing.sound} placeholder="dark melodic techno, warm analog bass, oriental string motif, wide reverb, 124 BPM"></textarea>
        <small>{$t('arSoundHint')}</small></label>
      <label class="f"><span>{$t('arVoice')}</span><input class="field" dir="ltr" bind:value={editing.voice} placeholder="deep male baritone, half-spoken, dark reverb" /></label>
      <label class="f"><span>{$t('arWriting')}</span><textarea class="field" rows="2" dir="auto" bind:value={editing.writing} placeholder={$t('arWritingPh')}></textarea></label>
      <div class="g2">
        <label class="f"><span>{$t('arTag')}</span><input class="field" dir="ltr" bind:value={editing.tag} placeholder="It's a Denver Production" /></label>
        <label class="f"><span>{$t('arExclude')}</span><input class="field" dir="ltr" bind:value={editing.exclude} placeholder="acoustic guitar, country" /></label>
      </div>
      <label class="f"><span>{$t('arLook')}</span><input class="field" dir="ltr" bind:value={editing.look} placeholder="neon magenta on black, grainy film photo, a recurring golden mask" /></label>
      <label class="f"><span>{$t('arNotes')}</span><input class="field" dir="auto" bind:value={editing.notes} placeholder={$t('arNotesPh')} /></label>

      <div class="btns">
        <Button variant="primary" icon="check" onclick={save}>{$t('arSave')}</Button>
        <Button variant="ghost" onclick={() => (editing = null)}>{$t('cancel')}</Button>
        {#if !isNew}<Button variant="ghost" icon="trash" onclick={remove}>{$t('delete')}</Button>{/if}
      </div>
    </div>
  {/if}
</section>

<style>
  .abar { display: flex; flex-direction: column; gap: 7px; padding: 9px 12px; border-radius: var(--r3); background: var(--bg2); border: 1px solid var(--line); }
  .abar.on { border-color: var(--accent-bd); background: color-mix(in srgb, var(--accent) 5%, var(--bg2)); }
  .row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .lbl { font-size: var(--fs-sm); font-weight: 800; color: var(--tx0); }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; flex: 1; }
  .chip { padding: 4px 11px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); background: var(--bg1); border: 1px solid var(--line); }
  .chip:hover { border-color: var(--line2); color: var(--tx0); }
  .chip.on { color: var(--accent); background: var(--accent-bg); border-color: var(--accent); }
  .chip.add { border-style: dashed; color: var(--accent); }
  .linkBtn { font-size: var(--fs-xs); font-weight: 700; color: var(--accent); white-space: nowrap; }
  .sum { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--tx1); line-height: 1.45; }
  .sum .mono { text-align: left; }
  .dim { color: var(--tx2); }
  .hint { font-size: 11px; line-height: 1.5; }
  .ed { display: flex; flex-direction: column; gap: 7px; padding-top: 4px; border-top: 1px solid var(--line); }
  .aiRow { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .aiRow .field { flex: 1; min-width: 180px; padding: 7px 10px; font-size: var(--fs-xs); }
  .g2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .g2 .f.em { max-width: 90px; }
  .g2:has(.em) { grid-template-columns: 1fr 90px; }
  .f { display: flex; flex-direction: column; gap: 3px; font-size: 11px; font-weight: 600; color: var(--tx2); }
  .f .field { padding: 6px 8px; font-size: var(--fs-xs); }
  .f textarea.field { font-family: var(--font-mono); line-height: 1.5; }
  .f small { font-size: 10px; color: var(--tx2); font-weight: 500; line-height: 1.4; }
  .btns { display: flex; gap: 6px; flex-wrap: wrap; }
  @media (max-width: 520px) { .g2 { grid-template-columns: 1fr; } }
</style>
