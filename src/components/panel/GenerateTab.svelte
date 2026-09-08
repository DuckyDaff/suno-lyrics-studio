<script>
  import { song, actions } from '../../lib/song.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { limits } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { generate, busy } from '../../lib/ai.js';
  import { parseLyrics, parseWild, parseLines } from '../../lib/lyricsParse.js';
  import { copyText } from '../../lib/clipboard.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  const FORMS = ['pop song', 'ballad', 'rap / hip-hop', 'trap', 'drill', 'rock anthem', 'punk', 'metal', 'opera', 'musical theatre',
    'mizrahi', 'israeli rock', 'piyyut / religious', 'hasidic', 'children\'s song', 'lullaby', 'folk', 'country', 'jazz', 'blues',
    'gospel', 'reggae', 'reggaeton', 'afrobeats', 'k-pop', 'synthwave', 'spoken word', 'poem', 'parody / comedy', 'wedding song',
    'birthday song', 'love song', 'breakup song', 'protest song', 'anthem', 'christmas / holiday', 'chanukah / jewish holiday'];
  const LANGS = ['Hebrew', 'English', 'Hebrew and English mixed', 'Italian', 'Spanish', 'French', 'Arabic', 'Russian', 'Yiddish', 'Ladino', 'Aramaic'];
  const RHYMES = ['auto', 'AABB', 'ABAB', 'ABCB', 'AAAA', 'free verse'];
  const VOICES = ['male rapper', 'female rapper', 'two rappers trading bars', 'male singer', 'female singer', 'male & female duet',
    'male cantor (chazan)', 'female opera soprano', 'male opera tenor', 'children choir', 'gospel choir', 'kid singer',
    'robotic vocoder voice', 'whispering narrator', 'elderly storyteller', 'crowd chant'];
  const MIX_SLOTS = [['verse', 'aiSlotVerse'], ['chorus', 'aiSlotChorus'], ['bridge', 'aiSlotBridge'], ['intro', 'aiSlotIntro'], ['outro', 'aiSlotOutro']];
  const RHYTHMIC = ['rap / hip-hop', 'trap', 'drill', 'spoken word', 'punk', 'reggaeton'];
  const MELODIC  = ['hasidic', 'opera', 'gospel', 'mizrahi', 'piyyut / religious', 'children\'s song', 'synthwave', 'ballad', 'musical theatre', 'k-pop', 'country', 'metal'];
  const RAP_V  = ['male rapper', 'female rapper', 'two rappers trading bars'];
  const SING_V = ['female singer', 'male singer', 'male cantor (chazan)', 'female opera soprano', 'male opera tenor', 'children choir', 'gospel choir', 'kid singer'];

  let idea = $state('');
  let form = $state('pop song');
  let language = $state('Hebrew');
  let rhyme = $state('auto');
  let persona = $state('');
  let length = $state('normal');
  let useStructure = $state(false);
  let useStyle = $state(true);
  let extra = $state('');

  let mixOn = $state(false);
  let mix = $state({ verse: { form: '', voice: '' }, chorus: { form: '', voice: '' }, bridge: { form: '', voice: '' },
                     intro: { form: '', voice: '' }, outro: { form: '', voice: '' }, notes: '' });

  let output = $state('');
  let outMode = $state('');       // song | wild | style | titles
  let error = $state('');
  let abort = null;
  let usage = $state(null);

  const lim = $derived(limits($settings.sunoVersion));
  const wild = $derived(outMode === 'wild' ? parseWild(output) : null);
  const titles = $derived(outMode === 'titles' ? parseLines(output) : []);

  const pick = a => a[Math.floor(Math.random() * a.length)];
  function shuffleMix() {
    const flip = Math.random() < 0.25;                       // sometimes sung verses + rapped chorus
    const third = Math.random() < 0.5;
    mix = {
      ...mix,
      verse:  { form: pick(flip ? MELODIC : RHYTHMIC), voice: pick(flip ? SING_V : RAP_V) },
      chorus: { form: pick(flip ? RHYTHMIC : MELODIC), voice: pick(flip ? RAP_V : SING_V) },
      bridge: third ? { form: pick([...RHYTHMIC, ...MELODIC]), voice: pick([...RAP_V, ...SING_V, 'crowd chant', 'robotic vocoder voice']) } : { form: '', voice: '' },
    };
    mixOn = true;
  }
  function mixPayload() {
    if (!mixOn) return {};
    const cast = [...new Set(MIX_SLOTS.map(([k]) => mix[k].voice).filter(Boolean))];
    return { mix: { ...mix, cast }, blend: true };
  }

  async function run(mode) {
    if ($busy) { abort?.abort(); return; }
    error = ''; output = ''; outMode = mode; usage = null;
    abort = new AbortController();
    const fields = {
      mode, idea, form, language, rhyme, persona, length, extra,
      style: useStyle ? $song.style : '',
      structure: useStructure ? $song.sections.map(s => s.name) : null,
      ...mixPayload(),
    };
    if (mode === 'style') fields.limit = lim.style;
    try {
      const r = await generate(fields, (_, full) => { output = full; }, { signal: abort.signal });
      output = r.text; usage = r.meta?.usage || null;
    } catch (e) {
      if (e.code !== 'aborted') error = e.code || 'api_error';
    }
  }

  function applyLyrics(replace) {
    const text = outMode === 'wild' ? wild.lyrics : output;
    const secs = parseLyrics(text);
    if (!secs.length) return toast($t('toastNothing'), 'error');
    if (replace) actions.replaceAll(secs, outMode === 'wild' && wild.style ? wild.style : null);
    else secs.forEach(s => actions.add(s.name, s.text));
    if (outMode === 'wild' && wild.title) actions.setTitle(wild.title);
    toast($t('toastAppliedLyrics', { n: secs.length }), 'success');
  }
  function applyStyle() {
    const s = outMode === 'wild' ? wild.style : output.trim();
    if (!s) return;
    actions.setStyle(s); toast($t('aiApplyStyle'), 'success');
  }
  function applyTitle(tt) { actions.setTitle(tt); toast(tt, 'success'); }
  async function copyOut() { (await copyText(output)) ? toast($t('toastAllCopied'), 'success') : toast($t('toastCopyFail'), 'error'); }

  const errText = $derived(error ? ($t('aiErr_' + error) !== 'aiErr_' + error ? $t('aiErr_' + error) : $t('aiErr_api_error')) : '');
</script>

<div class="tab">
  <section class="brief">
    <label for="ai-idea">{$t('aiIdea')}</label>
    <textarea id="ai-idea" class="field" rows="4" bind:value={idea} placeholder={$t('aiIdeaPh')}></textarea>

    <div class="grid">
      <label class="f"><span>{$t('aiForm')}</span>
        <select class="field" bind:value={form}>{#each FORMS as f}<option value={f}>{f}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiLang')}</span>
        <select class="field" bind:value={language}>{#each LANGS as l}<option value={l}>{l}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiRhyme')}</span>
        <select class="field" bind:value={rhyme}>{#each RHYMES as r}<option value={r}>{r}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiLength')}</span>
        <select class="field" bind:value={length}>
          <option value="short">{$t('aiShort')}</option><option value="normal">{$t('aiNormal')}</option><option value="long">{$t('aiLong')}</option>
        </select></label>
    </div>
    <input class="field" bind:value={persona} placeholder={$t('aiPersonaPh')} />
    <input class="field" bind:value={extra} placeholder={$t('aiExtraPh')} />

    <!-- style & voice blend -->
    <div class="mix" class:on={mixOn}>
      <div class="mixhd">
        <label class="chk big"><input type="checkbox" bind:checked={mixOn} /> 🎭 {$t('aiMix')}</label>
        <button class="linkBtn" onclick={shuffleMix}>🎲 {$t('aiMixShuffle')}</button>
      </div>
      {#if mixOn}
        <p class="faint hint">{$t('aiMixHint')}</p>
        {#each MIX_SLOTS as [k, lbl]}
          <div class="mixrow">
            <span class="slot">{$t(lbl)}</span>
            <select class="field" bind:value={mix[k].form}>
              <option value="">{$t('aiSameAsMain')}</option>
              {#each FORMS as f}<option value={f}>{f}</option>{/each}
            </select>
            <select class="field" bind:value={mix[k].voice}>
              <option value="">{$t('aiAutoVoice')}</option>
              {#each VOICES as v}<option value={v}>{v}</option>{/each}
            </select>
          </div>
        {/each}
        <input class="field" bind:value={mix.notes} placeholder={$t('aiMixNotesPh')} />
      {/if}
    </div>

    <div class="opts">
      <label class="chk"><input type="checkbox" bind:checked={useStyle} /> {$t('aiUseStyle')} <span class="faint mono">{$song.style ? $song.style.slice(0, 40) + ($song.style.length > 40 ? '…' : '') : '—'}</span></label>
      <label class="chk"><input type="checkbox" bind:checked={useStructure} /> {$t('aiUseStructure')} <span class="faint mono">{$song.sections.map(s => s.name).join(' · ')}</span></label>
      <div class="model">
        <span>{$t('aiModel')}</span>
        <button class:on={$settings.aiModel !== 'fast'} onclick={() => setSetting('aiModel', 'quality')}>{$t('aiQuality')}</button>
        <button class:on={$settings.aiModel === 'fast'} onclick={() => setSetting('aiModel', 'fast')}>{$t('aiFast')}</button>
      </div>
    </div>

    <div class="actions">
      <Button variant="primary" icon={$busy ? 'x' : 'sparkles'} size="lg" onclick={() => run('song')}>{$busy ? $t('aiStop') : $t('aiWriteSong')}</Button>
      <Button icon="dice" onclick={() => run('wild')} disabled={$busy}>{$t('aiWild')}</Button>
      <Button variant="ghost" icon="sliders" onclick={() => run('style')} disabled={$busy}>{$t('aiStyleOnly')}</Button>
      <Button variant="ghost" icon="pen" onclick={() => run('titles')} disabled={$busy}>{$t('aiTitles')}</Button>
    </div>
  </section>

  {#if error}
    <div class="err"><Icon name="alert" size={14} /> {errText}</div>
  {/if}

  {#if output || $busy}
    <section class="out">
      <div class="hd">
        <span class="lbl">{$t('aiResult')} {#if $busy}<span class="dots">●●●</span>{/if}</span>
        {#if usage}<span class="counter">{usage.out} tok</span>{/if}
        <Button size="sm" variant="ghost" icon="copy" title={$t('copy')} onclick={copyOut} />
      </div>

      {#if outMode === 'titles'}
        <ul class="titles">{#each titles as tt}<li><button onclick={() => applyTitle(tt)}>{tt}</button></li>{/each}</ul>
      {:else}
        {#if outMode === 'wild' && (wild.title || wild.style)}
          <div class="wildhd">
            {#if wild.title}<div class="wt">{wild.title}</div>{/if}
            {#if wild.style}<div class="ws mono">{wild.style}</div>{/if}
          </div>
        {/if}
        <pre class="box" dir="auto">{outMode === 'wild' ? wild.lyrics : output}</pre>
      {/if}

      {#if !$busy && output}
        <div class="apply">
          {#if outMode === 'song' || outMode === 'wild'}
            <Button variant="primary" icon="check" onclick={() => applyLyrics(true)}>{$t('aiReplace')}</Button>
            <Button icon="plus" onclick={() => applyLyrics(false)}>{$t('aiAppend')}</Button>
            {#if outMode === 'wild' && wild.style}<Button variant="ghost" onclick={applyStyle}>{$t('aiApplyStyle')}</Button>{/if}
          {:else if outMode === 'style'}
            <Button variant="primary" icon="check" onclick={applyStyle}>{$t('aiApplyStyle')}</Button>
          {/if}
          <Button variant="ghost" icon="undo" onclick={() => run(outMode)}>{$t('aiAgain')}</Button>
        </div>
      {/if}
    </section>
  {/if}
</div>

<style>
  .tab { padding: 14px 14px 28px; display: flex; flex-direction: column; gap: 14px; }
  .brief { display: flex; flex-direction: column; gap: 8px; }
  label { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  textarea.field { font-size: var(--fs-md); line-height: 1.55; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .f { display: flex; flex-direction: column; gap: 3px; font-size: 11px; font-weight: 600; color: var(--tx2); }
  .f select { padding: 7px 8px; font-size: var(--fs-xs); }
  .opts, .mix { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; background: var(--bg2); border-radius: var(--r2); border: 1px solid var(--line); }
  .mix.on { border-color: var(--accent-bd); }
  .mixhd { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .chk { display: flex; align-items: center; gap: 6px; font-size: var(--fs-xs); font-weight: 600; color: var(--tx1); cursor: pointer; min-width: 0; }
  .chk.big { font-size: var(--fs-sm); color: var(--tx0); }
  .chk span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
  .chk input { accent-color: var(--accent); }
  .linkBtn { font-size: var(--fs-xs); font-weight: 700; color: var(--accent); white-space: nowrap; }
  .hint { font-size: 11px; line-height: 1.45; }
  .mixrow { display: grid; grid-template-columns: 52px 1fr 1fr; gap: 4px; align-items: center; }
  .mixrow .field { padding: 6px 6px; font-size: 11px; min-width: 0; }
  .slot { font-size: 11px; font-weight: 700; color: var(--tx1); }
  .model { display: flex; align-items: center; gap: 4px; font-size: var(--fs-xs); color: var(--tx2); font-weight: 600; }
  .model button { padding: 3px 9px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--tx2); border: 1px solid var(--line); }
  .model button.on { color: var(--accent); background: var(--accent-bg); border-color: var(--accent-bd); }
  .actions { display: flex; flex-wrap: wrap; gap: 6px; }
  .err { display: flex; align-items: center; gap: 6px; color: var(--err); font-size: var(--fs-sm); background: color-mix(in srgb, var(--err) 10%, transparent); border: 1px solid color-mix(in srgb, var(--err) 30%, transparent); border-radius: var(--r2); padding: 8px 10px; line-height: 1.4; }
  .out { display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--line); padding-top: 12px; }
  .hd { display: flex; align-items: center; gap: 8px; }
  .lbl { flex: 1; font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  .dots { color: var(--accent); font-size: 8px; letter-spacing: 2px; animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity: .3; } }
  .box { background: var(--bg2); border: 1px solid var(--line); border-radius: var(--r2); padding: 12px 14px; font-family: var(--font-ui); font-size: var(--fs-md); line-height: 1.7; white-space: pre-wrap; word-break: break-word; max-height: 50vh; overflow: auto; min-height: 60px; }
  .wildhd { display: flex; flex-direction: column; gap: 4px; }
  .wt { font-size: var(--fs-lg); font-weight: 700; }
  .ws { font-size: 11px; color: var(--tx1); direction: ltr; text-align: left; }
  .titles { list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .titles button { width: 100%; text-align: start; padding: 8px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-md); }
  .titles button:hover { border-color: var(--accent-bd); color: var(--accent); }
  .apply { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
