<script>
  import { song, actions } from '../../lib/song.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { limits } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { generate, busy, phase } from '../../lib/ai.js';
  import { nikudLyrics, unvocalizedWords, HEBREW_RE } from '../../lib/hebrew/nikud.js';
  import { genState as g, setGen, blankMix, genAbort } from '../../lib/genState.js';
  import { parseLyrics, parseWild, parseLines } from '../../lib/lyricsParse.js';
  import { copyText } from '../../lib/clipboard.js';
  import { STRUCTURE_PRESETS, TIME_SIGS, SECTION_NAMES, estimateSeconds } from '../../lib/data/structures.js';
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

  let { wide = false } = $props();
  let error = $state('');
  let presetId = $state('');
  let nikudBusy = $state(false);
  let nikudProg = $state('');
  const bare = $derived(!$busy && !nikudBusy && ($g.outMode === 'song' || $g.outMode === 'wild') ? unvocalizedWords(shown).length : 0);
  async function vocalize(text) {
    nikudBusy = true; nikudProg = '';
    try { return await nikudLyrics(text, (d, n) => { nikudProg = n > 1 ? `${d}/${n}` : ''; }); }
    catch { toast($t('toastNikudFail'), 'error'); return text; }
    finally { nikudBusy = false; nikudProg = ''; }
  }
  async function vocalizeOut() {
    const before = unvocalizedWords($g.output).length;
    const text = await vocalize($g.output);
    setGen({ output: text });
    const left = unvocalizedWords(text).length;
    toast(left ? $t('aiNikudPartial', { n: left }) : $t('toastNikudDone'), left ? 'error' : 'success');
  }

  /* ── idea generator ─────────────────────────────────────────── */
  let ideas = $state([]);
  let ideasBusy = $state(false);
  async function suggestIdeas() {
    if (ideasBusy) return;
    ideasBusy = true; ideas = [];
    try {
      const r = await generate({ mode: 'ideas', model: 'fast', idea: $g.idea, form: $g.form, language: $g.language, persona: $g.persona, style: $g.useStyle ? $song.style : '' },
        (_, full) => { ideas = parseLines(full); });
      ideas = parseLines(r.text).slice(0, 3);
    } catch (e) { if (e.code !== 'aborted') toast($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error'), 'error'); }
    finally { ideasBusy = false; }
  }
  function useIdea(txt) { setGen({ idea: txt }); ideas = []; toast($t('aiIdeaSet'), 'success'); }

  /* ── musical structure ───────────────────────────────────────── */
  const styleBpm = $derived(($song.style.match(/(\d{2,3})\s*BPM/i) || [])[1] || '');
  const music = $derived($g.music);
  const totalBars = $derived(music.bars.reduce((n, r) => n + (parseInt(r.bars, 10) || 0), 0));
  const seconds = $derived(estimateSeconds(music.bars, music.sig, music.bpm || styleBpm));
  function setMusic(patch) { setGen({ music: { ...$g.music, ...patch } }); }
  function setRow(i, patch) { setMusic({ bars: $g.music.bars.map((r, j) => j === i ? { ...r, ...patch } : r) }); }
  function addRow() { setMusic({ bars: [...$g.music.bars, { name: 'Verse', bars: 8, kind: 'lyrics' }] }); }
  function delRow(i) { setMusic({ bars: $g.music.bars.filter((_, j) => j !== i) }); }
  function moveRow(i, d) {
    const a = [...$g.music.bars], j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setMusic({ bars: a });
  }
  function applyPreset(id) {
    presetId = id;
    if (id === 'sections') {
      setMusic({ bars: $song.sections.map(x => ({ name: x.name, bars: 8, kind: /intro|outro|solo|instrumental|drop|interlude/i.test(x.name) ? 'instrumental' : 'lyrics' })) });
      return;
    }
    const p = STRUCTURE_PRESETS.find(x => x.id === id); if (!p) return;
    setMusic({ sig: p.sig, linesPerBar: p.linesPerBar, bars: p.rows.map(r => ({ ...r })) });
  }
  function musicPayload() {
    if (!$g.musicOn) return {};
    const m = $g.music;
    return { music: { bpm: m.bpm || styleBpm, sig: m.sig, linesPerBar: m.linesPerBar === 'auto' ? '' : m.linesPerBar, bars: m.bars.filter(r => r.name) } };
  }

  const lim = $derived(limits($settings.sunoVersion));
  const wild = $derived($g.outMode === 'wild' ? parseWild($g.output) : null);
  const titles = $derived($g.outMode === 'titles' ? parseLines($g.output) : []);
  const shown = $derived($g.outMode === 'wild' ? (wild?.lyrics ?? '') : $g.output);

  const pick = a => a[Math.floor(Math.random() * a.length)];
  function shuffleMix() {
    const flip = Math.random() < 0.25;
    const third = Math.random() < 0.5;
    setGen({ mixOn: true, mix: {
      ...$g.mix,
      verse:  { form: pick(flip ? MELODIC : RHYTHMIC), voice: pick(flip ? SING_V : RAP_V) },
      chorus: { form: pick(flip ? RHYTHMIC : MELODIC), voice: pick(flip ? RAP_V : SING_V) },
      bridge: third ? { form: pick([...RHYTHMIC, ...MELODIC]), voice: pick([...RAP_V, ...SING_V, 'crowd chant', 'robotic vocoder voice']) } : { form: '', voice: '' },
    } });
  }
  function clearMix() { setGen({ mix: blankMix() }); }
  function mixPayload() {
    if (!$g.mixOn) return {};
    const cast = [...new Set(MIX_SLOTS.map(([k]) => $g.mix[k].voice).filter(Boolean))];
    return { mix: { ...$g.mix, cast }, blend: true };
  }

  async function run(mode) {
    if ($busy) { genAbort.current?.abort(); return; }
    error = '';
    setGen({ output: '', outMode: mode, usage: null });
    const ctrl = new AbortController(); genAbort.current = ctrl;
    const s = $g;
    const fields = {
      mode, idea: s.idea, form: s.form, language: s.language, rhyme: s.rhyme, persona: s.persona, length: s.length, extra: s.extra,
      style: s.useStyle ? $song.style : '',
      structure: s.useStructure ? $song.sections.map(x => x.name) : null,
      ...mixPayload(),
      ...musicPayload(),
    };
    if (mode === 'style') fields.limit = lim.style;
    try {
      const r = await generate(fields, (_, full) => setGen({ output: full }), { signal: ctrl.signal });
      let text = r.text;
      if ((mode === 'song' || mode === 'wild') && $settings.autoNikud && HEBREW_RE.test(text)) {
        text = await vocalize(text);
        const left = unvocalizedWords(text).length;
        if (left) toast($t('aiNikudPartial', { n: left }), 'error', 6000);
      }
      if (ctrl.signal.aborted) return;
      setGen({ output: text, usage: r.meta?.usage || null });
    } catch (e) {
      if (e.code !== 'aborted') error = e.code || 'api_error';
    } finally { if (genAbort.current === ctrl) genAbort.current = null; }
  }

  function applyLyrics(replace) {
    const secs = parseLyrics(shown);
    if (!secs.length) return toast($t('toastNothing'), 'error');
    if (replace) actions.replaceAll(secs, $g.outMode === 'wild' && wild.style ? wild.style : null);
    else secs.forEach(x => actions.add(x.name, x.text));
    if ($g.outMode === 'wild' && wild.title) actions.setTitle(wild.title);
    toast($t('toastAppliedLyrics', { n: secs.length }), 'success');
  }
  function applyStyle() {
    const st = $g.outMode === 'wild' ? wild.style : $g.output.trim();
    if (!st) return;
    actions.setStyle(st); toast($t('aiApplyStyle'), 'success');
  }
  function applyTitle(tt) { actions.setTitle(tt); toast(tt, 'success'); }
  async function copyOut() { (await copyText($g.output)) ? toast($t('toastAllCopied'), 'success') : toast($t('toastCopyFail'), 'error'); }
  function clearOut() { setGen({ output: '', outMode: '', usage: null }); }

  const errText = $derived(error ? ($t('aiErr_' + error) !== 'aiErr_' + error ? $t('aiErr_' + error) : $t('aiErr_api_error')) : '');
</script>

<div class="tab" class:wide={wide}>
  <section class="brief">
    <div class="ideaHd">
      <label for="ai-idea">{$t('aiIdea')}</label>
      <button class="ideaBtn" onclick={suggestIdeas} disabled={ideasBusy || $busy} title={$t('aiIdeasTitle')}>
        💡 {ideasBusy ? $t('aiIdeasBusy') : ideas.length ? $t('aiIdeasMore') : $t('aiIdeas')}
      </button>
    </div>
    <textarea id="ai-idea" class="field" rows="4" bind:value={$g.idea} placeholder={$t('aiIdeaPh')}></textarea>
    {#if ideas.length}
      <ul class="ideas">
        {#each ideas as it, i (i)}
          <li><button onclick={() => useIdea(it)}><span class="n">{i + 1}</span>{it}</button></li>
        {/each}
      </ul>
    {/if}

    <div class="grid">
      <label class="f"><span>{$t('aiForm')}</span>
        <select class="field" bind:value={$g.form}>{#each FORMS as f}<option value={f}>{f}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiLang')}</span>
        <select class="field" bind:value={$g.language}>{#each LANGS as l}<option value={l}>{l}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiRhyme')}</span>
        <select class="field" bind:value={$g.rhyme}>{#each RHYMES as r}<option value={r}>{r}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiLength')}</span>
        <select class="field" bind:value={$g.length}>
          <option value="short">{$t('aiShort')}</option><option value="normal">{$t('aiNormal')}</option><option value="long">{$t('aiLong')}</option>
        </select></label>
    </div>
    <input class="field" bind:value={$g.persona} placeholder={$t('aiPersonaPh')} />
    <input class="field" bind:value={$g.extra} placeholder={$t('aiExtraPh')} />

    <!-- musical structure -->
    <div class="mix" class:on={$g.musicOn}>
      <div class="mixhd">
        <label class="chk big"><input type="checkbox" bind:checked={$g.musicOn} /> 🎼 {$t('aiMusic')}</label>
        {#if $g.musicOn && music.bars.length}
          <span class="tot mono">{$t('aiTotal')} {totalBars} {$t('aiBars')}{#if seconds} · {$t('aiApprox')}{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}{/if}</span>
        {/if}
      </div>
      {#if $g.musicOn}
        <p class="faint hint">{$t('aiMusicHint')}</p>
        <div class="mrow3">
          <label class="f"><span>{$t('aiBpm')}</span><input class="field" inputmode="numeric" placeholder={styleBpm ? `${styleBpm} (${$t('aiBpmPh')})` : '—'} value={music.bpm} oninput={e => setMusic({ bpm: e.target.value.replace(/\D/g, '') })} /></label>
          <label class="f"><span>{$t('aiSig')}</span><select class="field" value={music.sig} onchange={e => setMusic({ sig: e.target.value })}>{#each TIME_SIGS as sg}<option value={sg}>{sg}</option>{/each}</select></label>
          <label class="f"><span>{$t('aiLpb')}</span><select class="field" value={music.linesPerBar} onchange={e => setMusic({ linesPerBar: e.target.value })}>
            <option value="auto">{$t('aiLpbAuto')}</option><option value="1">{$t('aiLpb1')}</option><option value="0.5">{$t('aiLpbHalf')}</option><option value="2">{$t('aiLpb2')}</option>
          </select></label>
        </div>
        <div class="mrow3">
          <label class="f wide"><span>{$t('aiPreset')}</span>
            <select class="field" value={presetId} onchange={e => applyPreset(e.target.value)}>
              <option value="">{$t('aiPresetPick')}</option>
              <option value="sections">{$t('aiFromSections')}</option>
              {#each STRUCTURE_PRESETS as pr}<option value={pr.id}>{pr.label} · {pr.sig}</option>{/each}
            </select></label>
        </div>
        {#each music.bars as r, i}
          <div class="brow">
            <input class="field name" list="secnames" value={r.name} oninput={e => setRow(i, { name: e.target.value })} />
            <input class="field bars" inputmode="numeric" value={r.bars} oninput={e => setRow(i, { bars: e.target.value.replace(/\D/g, '') })} />
            <select class="field kind" value={r.kind} onchange={e => setRow(i, { kind: e.target.value })}>
              <option value="lyrics">{$t('aiKindLyrics')}</option><option value="instrumental">{$t('aiKindInstr')}</option><option value="backing">{$t('aiKindBacking')}</option>
            </select>
            <button class="ib" onclick={() => moveRow(i, -1)} disabled={i === 0}><Icon name="arrowUp" size={13} /></button>
            <button class="ib" onclick={() => moveRow(i, 1)} disabled={i === music.bars.length - 1}><Icon name="arrowDown" size={13} /></button>
            <button class="ib del" onclick={() => delRow(i)}><Icon name="x" size={13} /></button>
          </div>
        {/each}
        <datalist id="secnames">{#each SECTION_NAMES as n}<option value={n}></option>{/each}</datalist>
        <button class="linkBtn" onclick={addRow}>+ {$t('aiAddRow')}</button>
      {/if}
    </div>

    <div class="mix" class:on={$g.mixOn}>
      <div class="mixhd">
        <label class="chk big"><input type="checkbox" bind:checked={$g.mixOn} /> 🎭 {$t('aiMix')}</label>
        <span class="mixbtns">
          <button class="linkBtn" onclick={shuffleMix}>🎲 {$t('aiMixShuffle')}</button>
          {#if $g.mixOn}<button class="linkBtn dim" onclick={clearMix}>{$t('clear')}</button>{/if}
        </span>
      </div>
      {#if $g.mixOn}
        <p class="faint hint">{$t('aiMixHint')}</p>
        {#each MIX_SLOTS as [k, lbl]}
          <div class="mixrow">
            <span class="slot">{$t(lbl)}</span>
            <select class="field" bind:value={$g.mix[k].form}>
              <option value="">{$t('aiSameAsMain')}</option>
              {#each FORMS as f}<option value={f}>{f}</option>{/each}
            </select>
            <select class="field" bind:value={$g.mix[k].voice}>
              <option value="">{$t('aiAutoVoice')}</option>
              {#each VOICES as v}<option value={v}>{v}</option>{/each}
            </select>
          </div>
        {/each}
        <input class="field" bind:value={$g.mix.notes} placeholder={$t('aiMixNotesPh')} />
      {/if}
    </div>

    <div class="opts">
      <label class="chk"><input type="checkbox" bind:checked={$g.useStyle} /> {$t('aiUseStyle')} <span class="faint mono">{$song.style ? $song.style.slice(0, 40) + ($song.style.length > 40 ? '…' : '') : '—'}</span></label>
      <label class="chk"><input type="checkbox" bind:checked={$g.useStructure} /> {$t('aiUseStructure')} <span class="faint mono">{$song.sections.map(x => x.name).join(' · ')}</span></label>
      <label class="chk"><input type="checkbox" checked={$settings.autoNikud} onchange={e => setSetting('autoNikud', e.target.checked)} /> {$t('aiAutoNikud')}</label>
      <label class="chk"><input type="checkbox" checked={$settings.producerTagOn} onchange={e => setSetting('producerTagOn', e.target.checked)} /> {$t('aiTag')}
        <input class="field tagIn" value={$settings.producerTag} oninput={e => setSetting('producerTag', e.target.value)} placeholder="It's a Denver Production" dir="ltr" /></label>
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

  <div class="result">
  {#if error}
    <div class="err"><Icon name="alert" size={14} /> {errText}</div>
  {/if}

  {#if !$g.output && !$busy && wide}
    <div class="placeholder"><Icon name="sparkles" size={26} /><p>{$t('resultHere')}</p></div>
  {/if}

  {#if $g.output || $busy}
    <section class="out">
      <div class="hd">
        <span class="lbl">{$t('aiResult')} {#if nikudBusy}<span class="ph">{$t('aiNikud')}</span><span class="dots">●●●</span>{:else if $busy}<span class="ph">{$phase === 'writing' ? $t('aiWriting') : $phase === 'fixing' ? $t('aiFixing') : $phase === 'retry' ? $t('aiRetry') : $t('aiThinking')}</span><span class="dots">●●●</span>{/if}</span>
        {#if $g.usage}<span class="counter">{$g.usage.out} tok</span>{/if}
        {#if bare}<button class="nkBtn" title={$t('aiNikudAllTitle', { n: bare })} onclick={vocalizeOut}>נ׳ {$t('aiNikudAll')} <span class="n">{bare}</span></button>{/if}
        <Button size="sm" variant="ghost" icon="copy" title={$t('copy')} onclick={copyOut} />
        <Button size="sm" variant="ghost" icon="x" title={$t('clear')} onclick={clearOut} disabled={$busy} />
      </div>

      {#if $g.outMode === 'titles'}
        <ul class="titles">{#each titles as tt}<li><button onclick={() => applyTitle(tt)}>{tt}</button></li>{/each}</ul>
      {:else}
        {#if $g.outMode === 'wild' && (wild.title || wild.style)}
          <div class="wildhd">
            {#if wild.title}<div class="wt">{wild.title}</div>{/if}
            {#if wild.style}<div class="ws mono">{wild.style}</div>{/if}
          </div>
        {/if}
        <div class="boxWrap">
          <pre class="box" class:dim={nikudBusy} dir="auto">{shown}</pre>
          {#if nikudBusy}
            <div class="nkBanner"><span class="spin"></span><span>{$t('aiNikudBanner')}</span>{#if nikudProg}<span class="mono">{nikudProg}</span>{/if}</div>
          {/if}
        </div>
      {/if}

      {#if !$busy && $g.output}
        <div class="apply">
          {#if $g.outMode === 'song' || $g.outMode === 'wild'}
            <Button variant="primary" icon="check" onclick={() => applyLyrics(true)}>{$t('aiReplace')}</Button>
            <Button icon="plus" onclick={() => applyLyrics(false)}>{$t('aiAppend')}</Button>
            {#if $g.outMode === 'wild' && wild.style}<Button variant="ghost" onclick={applyStyle}>{$t('aiApplyStyle')}</Button>{/if}
          {:else if $g.outMode === 'style'}
            <Button variant="primary" icon="check" onclick={applyStyle}>{$t('aiApplyStyle')}</Button>
          {/if}
          <Button variant="ghost" icon="undo" onclick={() => run($g.outMode)}>{$t('aiAgain')}</Button>
        </div>
      {/if}
    </section>
  {/if}
  </div>
</div>

<style>
  .tab { padding: 14px 14px 28px; display: flex; flex-direction: column; gap: 14px; }
  .tab.wide { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 380px); gap: 22px; align-items: start; padding: 18px 22px 32px; max-width: 1500px; margin: 0 auto; }
  .tab.wide .grid { grid-template-columns: repeat(4, 1fr); }
  .tab.wide textarea.field { min-height: 120px; font-size: var(--fs-lg); }
  .tab.wide .box { font-size: var(--fs-sm); }
  .tab.wide .result { position: sticky; top: 14px; display: flex; flex-direction: column; gap: 10px; }
  .tab.wide .out { border-top: none; padding-top: 0; }
  .tab.wide .box { max-height: calc(100dvh - var(--top-h) - var(--export-h) - 150px); }
  .placeholder { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); line-height: 1.6; border: 1px dashed var(--line2); border-radius: var(--r3); }
  .result:empty { display: none; }
  .brief { display: flex; flex-direction: column; gap: 8px; }
  .ideaHd { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .ideaBtn { padding: 5px 11px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent); white-space: nowrap; }
  .ideaBtn:hover:not(:disabled) { background: color-mix(in srgb, var(--warn) 22%, transparent); }
  .ideas { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .ideas button { width: 100%; display: flex; gap: 10px; align-items: flex-start; text-align: start; padding: 9px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-sm); line-height: 1.5; color: var(--tx0); }
  .ideas button:hover { border-color: var(--warn); background: color-mix(in srgb, var(--warn) 8%, var(--bg2)); }
  .ideas .n { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; background: var(--bg3); color: var(--tx1); }
  label { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  textarea.field { font-size: var(--fs-md); line-height: 1.55; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
  .f { display: flex; flex-direction: column; gap: 3px; font-size: 11px; font-weight: 600; color: var(--tx2); }
  .f select { padding: 7px 8px; font-size: var(--fs-xs); }
  .opts, .mix { display: flex; flex-direction: column; gap: 6px; padding: 8px 10px; background: var(--bg2); border-radius: var(--r2); border: 1px solid var(--line); }
  .mix.on { border-color: var(--accent-bd); }
  .mixhd { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .mixbtns { display: flex; gap: 10px; }
  .chk { display: flex; align-items: center; gap: 6px; font-size: var(--fs-xs); font-weight: 600; color: var(--tx1); cursor: pointer; min-width: 0; }
  .chk.big { font-size: var(--fs-sm); color: var(--tx0); }
  .chk span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 10px; }
  .chk input { accent-color: var(--accent); }
  .tagIn { flex: 1; padding: 4px 8px; font-size: 11px; font-family: var(--font-mono); min-width: 0; }
  .linkBtn { font-size: var(--fs-xs); font-weight: 700; color: var(--accent); white-space: nowrap; }
  .linkBtn.dim { color: var(--tx2); }
  .hint { font-size: 11px; line-height: 1.45; }
  .tot { font-size: 10px; color: var(--tx1); white-space: nowrap; }
  .mrow3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .mrow3 .field { padding: 6px 7px; font-size: 11px; min-width: 0; }
  .f.wide { grid-column: 1 / -1; }
  .brow { display: grid; grid-template-columns: 1fr 44px 92px 24px 24px 24px; gap: 3px; align-items: center; }
  .brow .field { padding: 5px 6px; font-size: 11px; min-width: 0; }
  .brow .name { direction: ltr; }
  .brow .bars { text-align: center; }
  .ib { width: 24px; height: 26px; border-radius: var(--r1); display: grid; place-items: center; color: var(--tx2); }
  .ib:hover:not(:disabled) { background: var(--bg3); color: var(--tx0); }
  .ib.del:hover { color: var(--err); }
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
  .ph { font-weight: 500; color: var(--accent); margin-inline-start: 6px; font-size: var(--fs-xs); }
  .dots { color: var(--accent); font-size: 8px; letter-spacing: 2px; animation: pulse 1s infinite; }
  @keyframes pulse { 50% { opacity: .3; } }
  .boxWrap { position: relative; }
  .box.dim { opacity: .45; }
  .nkBanner { position: absolute; inset: auto 0 0 0; margin: 0 10px 10px; display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: var(--r2); background: var(--bg1); border: 1px solid var(--accent); color: var(--tx0); font-weight: 700; font-size: var(--fs-sm); box-shadow: var(--shadow); }
  .spin { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .nkBtn { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent); }
  .nkBtn .n { font-size: 10px; padding: 0 5px; border-radius: 999px; background: var(--warn); color: var(--bg0); }
  .box { background: var(--bg2); border: 1px solid var(--line); border-radius: var(--r2); padding: 12px 14px; font-family: var(--font-ui); font-size: var(--fs-md); line-height: 1.7; white-space: pre-wrap; word-break: break-word; max-height: 50vh; overflow: auto; min-height: 60px; }
  .wildhd { display: flex; flex-direction: column; gap: 4px; }
  .wt { font-size: var(--fs-lg); font-weight: 700; }
  .ws { font-size: 11px; color: var(--tx1); direction: ltr; text-align: left; }
  .titles { list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .titles button { width: 100%; text-align: start; padding: 8px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-md); }
  .titles button:hover { border-color: var(--accent-bd); color: var(--accent); }
  .apply { display: flex; flex-wrap: wrap; gap: 6px; }
</style>
