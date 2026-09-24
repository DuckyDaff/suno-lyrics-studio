<script>
  /** 🎤 Cover: take an existing song (library / pasted / idea) and re-imagine it. */
  import { song, actions } from '../../lib/song.js';
  import { songList, songs, newSong, openSong } from '../../lib/songs.js';
  import { settings } from '../../lib/settings.js';
  import { coverState as cv, setCover } from '../../lib/coverState.js';
  import { RECIPES, TOUCH, COVER_LANGS, recipe as getRecipe, touch as getTouch } from '../../lib/coverRecipes.js';
  import { GENRES, GENRE_GROUPS } from '../../lib/data/genres.js';
  import { generate, busy, phase } from '../../lib/ai.js';
  import { parseLyrics, parseWild, parseLines } from '../../lib/lyricsParse.js';
  import { buildLyrics } from '../../lib/suno.js';
  import { nikudLyrics, unvocalizedWords, HEBREW_RE } from '../../lib/hebrew/nikud.js';
  import { copyText } from '../../lib/clipboard.js';
  import { toast } from '../../lib/toast.js';
  import { t } from '../../lib/i18n.js';
  import { homographs } from '../../lib/ui.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  let { wide = false } = $props();
  let error = $state('');
  let ideasBusy = $state(false);
  let nikudBusy = $state(false);
  let ctrl = null;

  const rec = $derived(getRecipe($cv.recipe));
  const lib = $derived($songList);
  const srcSong = $derived($cv.source === 'library' ? lib.find(s => s.id === $cv.songId) || null : null);
  const secondSong = $derived(lib.find(s => s.id === $cv.secondId) || null);
  const srcTitle = $derived($cv.source === 'library' ? (srcSong?.title || '') : $cv.source === 'paste' ? $cv.title : '');
  const srcLyrics = $derived($cv.source === 'library' ? (srcSong ? buildLyrics(srcSong) : '') : $cv.source === 'paste' ? $cv.lyrics : '');
  const hasSource = $derived($cv.source === 'idea' ? !!$cv.idea.trim() : !!srcLyrics.trim());
  const targetLabel = $derived($cv.targetText.trim() || GENRES.find(g => g.id === $cv.targetFamily)?.label || '');
  const wild = $derived($cv.outMode === 'cover' ? parseWild($cv.output) : { title: '', style: '', lyrics: '' });
  const ideas = $derived($cv.outMode === 'ideas' ? parseLines($cv.output) : []);
  const bare = $derived(!$busy && !nikudBusy && $cv.outMode === 'cover' ? unvocalizedWords(wild.lyrics).length : 0);

  function fields(mode) {
    const r = getRecipe($cv.recipe), tc = getTouch($cv.touch);
    const target = r.needsTarget ? targetLabel : $cv.targetText.trim();
    return {
      mode, model: $settings.aiModel === 'fast' ? 'fast' : 'quality',
      idea: $cv.source === 'idea' ? $cv.idea : '',
      srcTitle, srcLyrics, srcStyle: srcSong?.style || '',
      secondTitle: r.needsSecond ? secondSong?.title || '' : '', secondLyrics: r.needsSecond && secondSong ? buildLyrics(secondSong) : '',
      recipe: r.prompt, target, touchRule: tc.prompt,
      targetLanguage: r.needsLang ? $cv.language : ($cv.language !== 'Hebrew' ? $cv.language : ''),
      language: $cv.language, topic: r.needsTopic ? $cv.topic : '', notes: $cv.notes,
      // the server's default context (current song lyrics) must not leak into the cover
      lyrics: srcLyrics, title: srcTitle, style: '',
    };
  }
  async function run() {
    if ($busy) { ctrl?.abort(); return; }
    if (!hasSource) return toast($t('cvNoSource'), 'error');
    error = ''; setCover({ output: '', outMode: 'cover' });
    ctrl = new AbortController();
    try {
      const r = await generate(fields('coverSong'), (_, full) => setCover({ output: full }), { signal: ctrl.signal });
      let text = r.text;
      if ($settings.autoNikud && HEBREW_RE.test(text)) { nikudBusy = true; try { text = await nikudLyrics(text); } catch {} nikudBusy = false; }
      setCover({ output: text });
    } catch (e) { if (e.code !== 'aborted') error = ($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error')) + (e.detail ? ' — ' + e.detail : ''); }
    finally { ctrl = null; }
  }
  async function suggest() {
    if (ideasBusy || $busy) return;
    if (!hasSource) return toast($t('cvNoSource'), 'error');
    ideasBusy = true; setCover({ output: '', outMode: 'ideas' });
    try { const r = await generate({ ...fields('coverIdeas'), model: 'fast' }, (_, full) => setCover({ output: full })); setCover({ output: r.text }); }
    catch (e) { if (e.code !== 'aborted') toast($t('aiErr_api_error'), 'error'); }
    finally { ideasBusy = false; }
  }
  function useIdea(line) { setCover({ recipe: 'free', notes: line, outMode: '', output: '' }); toast($t('cvUseIdea'), 'success'); }

  function applyNew() {
    const secs = parseLyrics(wild.lyrics); if (!secs.length) return toast($t('toastNothing'), 'error');
    const of = srcSong ? { id: srcSong.id, title: srcSong.title } : srcTitle ? { title: srcTitle } : null;
    newSong(); homographs.set(new Map());
    actions.replaceAll(secs, wild.style || null);
    actions.setTitle(wild.title || (srcTitle ? `${srcTitle} (${rec.he})` : ''));
    if (of) song.update(s => ({ ...s, coverOf: of }));
    toast($t('cvSaved'), 'success');
  }
  function applyReplace() {
    const secs = parseLyrics(wild.lyrics); if (!secs.length) return toast($t('toastNothing'), 'error');
    if (!confirm($t('confirmTemplate'))) return;
    actions.replaceAll(secs, wild.style || null); if (wild.title) actions.setTitle(wild.title);
    toast($t('toastAppliedLyrics', { n: secs.length }), 'success');
  }
  async function copyOut() { (await copyText([wild.style, wild.lyrics].filter(Boolean).join('\n\n'))) ? toast($t('toastAllCopied'), 'success') : toast($t('toastCopyFail'), 'error'); }
  async function vocalize() { nikudBusy = true; try { const w = parseWild($cv.output); const l = await nikudLyrics(w.lyrics); setCover({ output: `TITLE: ${w.title}\nSTYLE: ${w.style}\n\n${l}` }); } catch {} nikudBusy = false; }
  const groups = GENRE_GROUPS.map(g => ({ g, items: GENRES.filter(x => x.group === g) }));
</script>

<div class="tab" class:wide>
  <div class="brief">
    <h2 class="ttl">🎤 {$t('cvTitle')}</h2>

    <div class="block">
      <div class="lbl">{$t('cvSource')}</div>
      <div class="seg">
        <button class:on={$cv.source === 'library'} onclick={() => setCover({ source: 'library' })}>📚 {$t('cvSrcLibrary')}</button>
        <button class:on={$cv.source === 'paste'} onclick={() => setCover({ source: 'paste' })}>📋 {$t('cvSrcPaste')}</button>
        <button class:on={$cv.source === 'idea'} onclick={() => setCover({ source: 'idea' })}>💡 {$t('cvSrcIdea')}</button>
      </div>
      {#if $cv.source === 'library'}
        <select class="field" bind:value={$cv.songId}>
          <option value="">{$t('cvPick')}</option>
          {#each lib as s (s.id)}<option value={s.id}>{s.title || $t('untitled')} · {(s.sections || []).length} {$t('sectionsN')}</option>{/each}
        </select>
        {#if srcSong && !srcLyrics.trim()}<p class="warn">{$t('cvNoLyrics')}</p>{/if}
        {#if srcSong?.coverOf}<p class="faint small">{$t('cvCoverOf')}: {srcSong.coverOf.title}</p>{/if}
      {:else if $cv.source === 'paste'}
        <input class="field" placeholder={$t('cvPasteTitle')} bind:value={$cv.title} />
        <textarea class="field" rows="7" placeholder={$t('cvPasteLyrics')} bind:value={$cv.lyrics} dir="auto"></textarea>
      {:else}
        <textarea class="field" rows="3" placeholder={$t('cvIdeaPh')} bind:value={$cv.idea}></textarea>
      {/if}
    </div>

    <div class="block">
      <div class="lbl">{$t('cvRecipe')}</div>
      <div class="chips">
        {#each RECIPES as r (r.id)}<button class="chip" class:on={$cv.recipe === r.id} onclick={() => setCover({ recipe: r.id })} title={r.en}>{$settings.lang === 'he' ? r.he : r.en}</button>{/each}
      </div>
      {#if rec.needsTarget}
        <div class="lbl">{$t('cvTarget')}</div>
        <div class="row">
          <select class="field" bind:value={$cv.targetFamily}>
            <option value="">—</option>
            {#each groups as gr}<optgroup label={gr.g}>{#each gr.items as g}<option value={g.id}>{g.label}</option>{/each}</optgroup>{/each}
          </select>
          <input class="field" placeholder={$t('cvTargetFree')} bind:value={$cv.targetText} dir="ltr" />
        </div>
      {/if}
      {#if rec.needsSecond}
        <select class="field" bind:value={$cv.secondId}>
          <option value="">{$t('cvPickSecond')}</option>
          {#each lib as s (s.id)}{#if s.id !== $cv.songId}<option value={s.id}>{s.title || $t('untitled')}</option>{/if}{/each}
        </select>
      {/if}
      {#if rec.needsTopic}<input class="field" placeholder={$t('cvTopic')} bind:value={$cv.topic} />{/if}
    </div>

    <div class="block">
      <div class="lbl">{$t('cvTouch')}</div>
      <div class="seg">
        {#each TOUCH as tc (tc.id)}<button class:on={$cv.touch === tc.id} onclick={() => setCover({ touch: tc.id })}>{$settings.lang === 'he' ? tc.he : tc.en}</button>{/each}
      </div>
      <div class="row">
        <label class="lbl2">{$t('cvLang')} <select class="field" bind:value={$cv.language}>{#each COVER_LANGS as l}<option value={l}>{l}</option>{/each}</select></label>
      </div>
      <textarea class="field" rows="2" placeholder={$t('cvNotes')} bind:value={$cv.notes}></textarea>
      <p class="faint small">{$t('cvHint')}</p>
    </div>

    <div class="actions">
      <Button variant={$busy ? 'danger' : 'primary'} icon="sparkles" onclick={run}>{$busy ? $t('aiStop') : $t('cvRun')}</Button>
      <Button variant="ghost" onclick={suggest} disabled={ideasBusy || $busy}>💡 {ideasBusy ? $t('cvIdeasBusy') : $t('cvIdeas')}</Button>
    </div>
    {#if error}<div class="err"><Icon name="alert" size={14} /> {error}</div>{/if}
  </div>

  <div class="result">
    {#if $cv.output || $busy || ideasBusy}
      <section class="out">
        <div class="hd">
          <span class="lbl">{$t('cvResult')} {#if nikudBusy}<span class="ph">{$t('aiNikud')}</span>{:else if $busy || ideasBusy}<span class="ph">{$phase === 'writing' ? $t('aiWriting') : $t('aiConnecting')}</span>{/if}</span>
          {#if bare}<button class="nkBtn" onclick={vocalize}>נ׳ {$t('aiNikudAll')} <span class="n">{bare}</span></button>{/if}
          <Button size="sm" variant="ghost" icon="copy" title={$t('copy')} onclick={copyOut} />
          <Button size="sm" variant="ghost" icon="x" title={$t('clear')} onclick={() => setCover({ output: '', outMode: '' })} disabled={$busy} />
        </div>
        {#if $cv.outMode === 'ideas'}
          <ul class="ideas">{#each ideas as it, i (i)}<li><button onclick={() => useIdea(it)}><span class="n">{i + 1}</span>{it}</button></li>{/each}</ul>
        {:else}
          {#if wild.title || wild.style}
            <div class="wildhd">
              {#if wild.title}<div class="wt">{wild.title}</div>{/if}
              {#if wild.style}<div class="wstyle mono">{wild.style}</div>{/if}
            </div>
          {/if}
          <pre class="box" class:dim={nikudBusy} dir="auto">{wild.lyrics || $cv.output}</pre>
          {#if !$busy && wild.lyrics}
            <div class="apply">
              <Button variant="primary" icon="check" onclick={applyNew}>{$t('cvSaveNew')}</Button>
              <Button variant="ghost" onclick={applyReplace}>{$t('cvReplace')}</Button>
              <Button variant="ghost" icon="undo" onclick={run}>{$t('aiAgain')}</Button>
            </div>
          {/if}
        {/if}
      </section>
    {:else if wide}
      <div class="placeholder"><Icon name="music" size={26} /><p>{$t('cvTitle')}</p></div>
    {/if}
  </div>
</div>

<style>
  .tab { display: flex; flex-direction: column; gap: 14px; padding: 12px 12px 24px; }
  .tab.wide { display: grid; grid-template-columns: minmax(0, 1fr) minmax(300px, 380px); gap: 18px; padding: 14px 18px 28px; align-items: start; }
  .tab.wide .result { position: sticky; top: 14px; }
  .brief { display: flex; flex-direction: column; gap: 12px; }
  .ttl { font-size: var(--fs-lg); }
  .block { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: var(--r3); background: var(--bg1); border: 1px solid var(--line); }
  .lbl { font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); }
  .lbl2 { display: flex; align-items: center; gap: 8px; font-size: var(--fs-xs); font-weight: 700; color: var(--tx1); }
  .field { width: 100%; padding: 8px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx0); font-size: var(--fs-sm); }
  textarea.field { resize: vertical; line-height: 1.55; }
  .row { display: flex; gap: 8px; flex-wrap: wrap; }
  .row .field { flex: 1; min-width: 160px; }
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg button { padding: 7px 12px; border-radius: 999px; background: var(--bg2); border: 1px solid var(--line); color: var(--tx1); font-size: var(--fs-sm); font-weight: 600; }
  .seg button.on { background: var(--accent-bg); border-color: var(--accent-bd); color: var(--accent); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { padding: 6px 11px; border-radius: 999px; background: var(--bg2); border: 1px solid var(--line); color: var(--tx1); font-size: var(--fs-xs); font-weight: 600; }
  .chip.on { background: var(--accent-bg); border-color: var(--accent); color: var(--accent); }
  .warn { font-size: var(--fs-xs); color: var(--warn); font-weight: 700; }
  .small { font-size: var(--fs-xs); line-height: 1.5; }
  .actions { display: flex; gap: 8px; flex-wrap: wrap; }
  .err { display: flex; gap: 6px; align-items: flex-start; font-size: var(--fs-sm); color: var(--err); }
  .out { display: flex; flex-direction: column; gap: 8px; padding: 12px; border-radius: var(--r3); background: var(--bg1); border: 1px solid var(--line); }
  .hd { display: flex; align-items: center; gap: 6px; }
  .hd .lbl { flex: 1; display: flex; gap: 8px; align-items: center; }
  .ph { font-size: var(--fs-xs); color: var(--accent); font-weight: 600; }
  .nkBtn { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); border: 1px solid color-mix(in srgb, var(--warn) 40%, transparent); }
  .nkBtn .n { font-size: 10px; padding: 0 5px; border-radius: 999px; background: var(--warn); color: var(--bg0); }
  .wildhd { display: flex; flex-direction: column; gap: 4px; }
  .wt { font-weight: 800; font-size: var(--fs-md); }
  .wstyle { font-size: var(--fs-xs); color: var(--tx1); direction: ltr; text-align: start; }
  .box { background: var(--bg2); border: 1px solid var(--line); border-radius: var(--r2); padding: 12px 14px; font-family: var(--font-ui); font-size: var(--fs-md); line-height: 1.7; white-space: pre-wrap; word-break: break-word; max-height: 50vh; overflow: auto; min-height: 60px; }
  .tab.wide .box { max-height: calc(100dvh - var(--top-h) - var(--export-h) - 200px); font-size: var(--fs-sm); }
  .box.dim { opacity: .45; }
  .apply { display: flex; flex-wrap: wrap; gap: 6px; }
  .ideas { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .ideas button { width: 100%; display: flex; gap: 10px; align-items: flex-start; text-align: start; padding: 9px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-sm); line-height: 1.5; color: var(--tx0); }
  .ideas button:hover { border-color: var(--accent); }
  .ideas .n { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center; font-size: 11px; font-weight: 700; background: var(--bg3); color: var(--tx1); }
  .placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 40px 16px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); border: 1px dashed var(--line); border-radius: var(--r3); }
</style>
