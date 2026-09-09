<script>
  import { song, actions, hasContent } from '../../lib/song.js';
  import { newSong } from '../../lib/songs.js';
  import { modal, view, homographs } from '../../lib/ui.js';
  import { parseLyrics, parseWild } from '../../lib/lyricsParse.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';

  let text = $state('');
  let mode = $state('new');   // new | replace | append

  const parsed = $derived.by(() => {
    const w = parseWild(text);
    const secs = parseLyrics(w.lyrics || text);
    return { title: w.title, style: w.style, secs };
  });

  async function paste() {
    try { text = await navigator.clipboard.readText(); } catch { toast($t('pasteFail'), 'error'); }
  }
  async function file(e) {
    const f = e.target.files?.[0]; if (!f) return;
    text = await f.text();
    if (/\.json$/i.test(f.name)) {
      try {
        const j = JSON.parse(text);
        const secs = Array.isArray(j.sections) ? j.sections : Array.isArray(j) ? j : null;
        if (secs) text = ['TITLE: ' + (j.title || ''), 'STYLE: ' + (j.style || j.stylePrompt || ''), '',
          ...secs.map(s => `[${s.name || 'Verse'}]\n${s.text || ''}`)].join('\n');
      } catch {}
    }
  }
  function apply() {
    if (!parsed.secs.length) return toast($t('importEmpty'), 'error');
    if (mode === 'new') { newSong(); homographs.set(new Map()); }
    if (mode === 'replace' && $hasContent && !confirm($t('confirmImport'))) return;
    if (mode === 'append') parsed.secs.forEach(s => actions.add(s.name, s.text));
    else actions.replaceAll(parsed.secs, parsed.style || null);
    if (parsed.title && mode !== 'append') actions.setTitle(parsed.title);
    modal.set(''); view.set('editor');
    toast($t('toastImported').replace('{n}', parsed.secs.length), 'success');
  }
</script>

<div class="wrap">
  <header>
    <h2>{$t('importTitle')}</h2>
    <Button variant="ghost" icon="x" onclick={() => modal.set('')} />
  </header>
  <p class="faint small">{$t('importHint')}</p>

  <div class="row">
    <Button size="sm" variant="ghost" icon="copy" onclick={paste}>{$t('pasteClipboard')}</Button>
    <label class="file"><input type="file" accept=".txt,.md,.json" onchange={file} /> 📄 {$t('importFile')}</label>
  </div>
  <textarea class="field" rows="10" bind:value={text} placeholder={$t('importPh')} dir="auto"></textarea>

  {#if text.trim()}
    <div class="preview">
      <div class="hd">{$t('importPreview')}: {parsed.secs.length} {$t('sectionsN')}
        {#if parsed.title} · {$t('songTitle')}: <b>{parsed.title}</b>{/if}
        {#if parsed.style} · Style ✓{/if}
      </div>
      <div class="secs">{#each parsed.secs as s}<span class="chip">[{s.name}] <i>{s.text.split('\n').filter(Boolean).length}</i></span>{/each}</div>
    </div>
    <div class="opts">
      <label><input type="radio" bind:group={mode} value="new" /> {$t('importNew')}</label>
      <label><input type="radio" bind:group={mode} value="replace" /> {$t('importReplace')}</label>
      <label><input type="radio" bind:group={mode} value="append" /> {$t('importAppend')}</label>
    </div>
    <Button size="lg" icon="check" onclick={apply}>{$t('importBtn')}</Button>
  {/if}
</div>

<style>
  .wrap { padding: 18px 18px 24px; display: flex; flex-direction: column; gap: 12px; }
  header { display: flex; align-items: center; justify-content: space-between; }
  h2 { font-size: var(--fs-lg); }
  .small { font-size: var(--fs-xs); line-height: 1.5; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .file { font-size: var(--fs-xs); font-weight: 600; padding: 6px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); cursor: pointer; }
  .file input { display: none; }
  .field { width: 100%; font-family: var(--font-mono); font-size: var(--fs-sm); line-height: 1.6; padding: 10px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx0); resize: vertical; }
  .preview { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-sm); }
  .secs { display: flex; flex-wrap: wrap; gap: 5px; direction: ltr; }
  .chip { font-family: var(--font-mono); font-size: 11px; padding: 2px 7px; border-radius: 999px; background: var(--bg3); color: var(--tx1); }
  .chip i { color: var(--tx2); font-style: normal; }
  .opts { display: flex; gap: 14px; flex-wrap: wrap; font-size: var(--fs-sm); }
  .opts label { display: flex; align-items: center; gap: 6px; }
</style>
