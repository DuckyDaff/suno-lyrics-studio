<script>
  import { actions } from '../../lib/song.js';
  import { activeSectionId } from '../../lib/ui.js';
  import { sectionColor } from '../../lib/sections.js';
  import { t } from '../../lib/i18n.js';
  import Button from '../ui/Button.svelte';
  import WordTools from './WordTools.svelte';
  import NikudKeyboard from './NikudKeyboard.svelte';
  import HomographBar from './HomographBar.svelte';
  import { kbdFor } from '../../lib/ui.js';
  import NikudPop from './NikudPop.svelte';
  import { letterAtCaret } from '../../lib/hebrew/letterNikud.js';
  import { NIKUD_RE } from '../../lib/hebrew/nikud.js';
  import { synMarks, markRuns } from '../../lib/synonyms.js';
  import { runSectionOp, arrangeSection } from '../../lib/sectionWrite.js';
  import { busy } from '../../lib/ai.js';
  import { toast } from '../../lib/toast.js';

  let { sec, index, total } = $props();
  let ta = $state(null);
  let editingName = $state(false);
  let pop = $state(null);        // letter hit for the nikud popover
  let popNode = $state(null);

  /* click on a Hebrew letter in a vocalized word (or with the nikud keyboard open / Alt) → popover */
  function onTaClick(e) {
    if (!ta) return;
    const v = ta.value, i = ta.selectionStart;
    if (ta.selectionStart !== ta.selectionEnd) { pop = null; return; }
    const hit = letterAtCaret(v, i);
    if (!hit) { pop = null; return; }
    let a = hit.index, b = hit.end;
    while (a > 0 && /[א-תְ-ׇֽֿׁׂ]/.test(v[a - 1])) a--;
    while (b < v.length && /[א-תְ-ׇֽֿׁׂ]/.test(v[b])) b++;
    const wordHasNikud = NIKUD_RE.test(v.slice(a, b));
    if (wordHasNikud || $kbdFor === sec.id || e.altKey) pop = hit; else pop = null;
  }
  function onDocDown(e) { if (pop && popNode && !popNode.contains(e.target) && e.target !== ta) pop = null; }
  $effect(() => { document.addEventListener('mousedown', onDocDown); return () => document.removeEventListener('mousedown', onDocDown); });
  const focus = node => { node.focus(); node.select(); };

  const color = $derived(sectionColor(sec.name));
  const active = $derived($activeSectionId === sec.id);
  const lines = $derived((sec.text || '').split('\n').filter(l => l.trim()).length);
  /* words swapped by "fresh words": shown while the text is still the one they were marked on */
  const marks = $derived($synMarks[sec.id]?.text === sec.text ? markRuns(sec.text, $synMarks[sec.id].ranges) : null);

  /* an empty sung section offers "write it": Claude writes it to fit the song and its Style */
  const empty = $derived(!(sec.text || '').trim());
  const instrumental = $derived(/instrumental|no vocals/i.test(sec.name));
  let hint = $state('');
  let writing = $state(false);
  let wAbort = null;
  async function writeIt() {
    if (writing) { wAbort?.abort(); return; }
    writing = true; wAbort = new AbortController();
    try {
      await runSectionOp(sec, 'write', { hint, signal: wAbort.signal });
      hint = '';
      toast($t('aiDone'), 'success');
    } catch (e) {
      if (e.code !== 'aborted') toast($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error'), 'error');
    } finally { writing = false; }
  }

  /* 🧩 arrange: fix the section's structure (and split it into its real parts) */
  let arranging = $state(false);
  async function arrangeIt() {
    if (arranging) return;
    arranging = true;
    try {
      const r = await arrangeSection(sec);
      toast(r.parts > 1 ? $t('arrSplit', { n: r.parts }) : $t('arrDone'), 'success');
    } catch (e) {
      if (e.code === 'changed') toast($t('arrChanged'), 'error', 5000);
      else if (e.code !== 'aborted') toast($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error'), 'error');
    } finally { arranging = false; }
  }

  function resize() {
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
  }
  $effect(() => { sec.text; resize(); });
</script>

<article class="card" class:active style="--c:{color}">
  <header>
    {#if editingName}
      <input class="name mono" value={sec.name} use:focus
             onblur={e => { actions.setName(sec.id, e.target.value.trim() || sec.name); editingName = false; }}
             onkeydown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') editingName = false; }} />
    {:else}
      <button class="badge mono" onclick={() => (editingName = true)} title={sec.name}>[{sec.name}]</button>
    {/if}
    <span class="meta">{lines} {$t('lines')} · {(sec.text || '').length} {$t('chars')}</span>
    {#if !empty || arranging}
      <button class="arr" onclick={arrangeIt} disabled={arranging || $busy} title={$t('arrTitle')}>
        {#if arranging}<span class="spin"></span> {$t('arrBusy')}{:else}🧩 {$t('arrRun')}{/if}
      </button>
    {/if}
    <div class="acts">
      <Button variant="ghost" size="sm" title={$t('dir')} onclick={() => actions.toggleDir(sec.id)}>
        <span class="mono dir">{sec.dir === 'ltr' ? 'LTR' : 'RTL'}</span>
      </Button>
      <Button variant="ghost" size="sm" icon="arrowUp" title={$t('moveUp')} disabled={index === 0} onclick={() => actions.move(sec.id, -1)} />
      <Button variant="ghost" size="sm" icon="arrowDown" title={$t('moveDown')} disabled={index === total - 1} onclick={() => actions.move(sec.id, 1)} />
      <Button variant="ghost" size="sm" icon="trash" title={$t('remove')} onclick={() => actions.remove(sec.id)} />
    </div>
  </header>

  <div class="tawrap">
    {#if marks}<div class="hl" dir={sec.dir} aria-hidden="true">{#each marks as r}{#if r.hit}<mark>{r.s}</mark>{:else}{r.s}{/if}{/each}</div>{/if}
    <textarea bind:this={ta} data-sec={sec.id} rows="3" dir={sec.dir} value={sec.text}
              placeholder={$t('lyricsPlaceholder')}
              oninput={e => { actions.setText(sec.id, e.target.value); resize(); }}
              onclick={onTaClick}
              onkeydown={e => { if (pop && (e.key === 'Escape' || e.key.length === 1 || e.key === 'Backspace')) pop = null; }}
              onfocus={() => activeSectionId.set(sec.id)}></textarea>
  </div>
  {#if (empty || writing) && !instrumental}
    <div class="write">
      <button class="wbtn" onclick={writeIt} disabled={$busy && !writing} title={$t('secWriteTitle')}>
        {#if writing}<span class="spin"></span> {$t('secWriting')}{:else}✨ {$t('secWrite')}{/if}
      </button>
      {#if !writing}
        <input class="hint" dir="auto" bind:value={hint} placeholder={$t('secWriteHint')}
               onkeydown={e => { if (e.key === 'Enter') writeIt(); }} />
      {/if}
    </div>
  {/if}
  {#if pop}<div bind:this={popNode}><NikudPop {ta} hit={pop} onclose={() => (pop = null)} /></div>{/if}

  <HomographBar {sec} />
  {#if active}<WordTools {sec} />{/if}
  {#if $kbdFor === sec.id}<NikudKeyboard getTa={() => ta} onclose={() => kbdFor.set(null)} />{/if}
</article>

<style>
  .card {
    position: relative;
    background: var(--bg1); border: 1px solid var(--line); border-radius: var(--r3);
    border-inline-start: 3px solid var(--c); padding: 10px 14px 12px;
    transition: border-color .12s, box-shadow .12s;
  }
  .card.active { border-color: var(--line2); border-inline-start-color: var(--c); box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 12%, transparent); }
  header { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
  .badge {
    font-size: var(--fs-xs); font-weight: 700; letter-spacing: .04em; color: var(--c);
    background: color-mix(in srgb, var(--c) 12%, transparent); border: 1px solid color-mix(in srgb, var(--c) 30%, transparent);
    padding: 3px 9px; border-radius: 999px; direction: ltr;
  }
  .name { font-size: var(--fs-xs); font-weight: 700; background: var(--bg2); border: 1px solid var(--accent); border-radius: 999px; padding: 3px 9px; width: 140px; direction: ltr; }
  .meta { font-size: 11px; color: var(--tx2); flex: 1; }
  .acts { display: flex; gap: 0; opacity: .55; transition: opacity .12s; }
  .card:hover .acts, .card.active .acts { opacity: 1; }
  .dir { font-size: 10px; font-weight: 700; }
  .tawrap { position: relative; }
  .arr { display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-bd); }
  .arr:hover:not(:disabled) { border-color: var(--accent); }
  .arr:disabled { opacity: .6; }
  .write { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .wbtn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 800; color: var(--accent); background: var(--accent-bg); border: 1px solid var(--accent-bd); }
  .wbtn:hover:not(:disabled) { border-color: var(--accent); }
  .wbtn:disabled { opacity: .6; }
  .hint { flex: 1; min-width: 160px; font-size: var(--fs-xs); padding: 6px 10px; border-radius: 999px; background: var(--bg2); border: 1px solid var(--line2); color: var(--tx0); outline: none; }
  .hint:focus { border-color: var(--accent); }
  .spin { width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--accent); border-top-color: transparent; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  textarea, .hl {
    width: 100%; border: none;
    font-size: 16px; line-height: 1.85; padding: 4px 2px; min-height: 84px;
    unicode-bidi: plaintext;
  }
  textarea { position: relative; display: block; background: transparent; outline: none; color: var(--tx0); }
  /* the highlight layer sits under the transparent textarea with the same text, so marks line up with the words */
  .hl {
    position: absolute; inset: 0; color: transparent; pointer-events: none;
    white-space: pre-wrap; overflow-wrap: break-word; overflow: hidden;
  }
  .hl mark { color: transparent; background: color-mix(in srgb, var(--accent) 24%, transparent); border-radius: 4px; box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 24%, transparent); }
  @media (max-width: 768px) {
    .card { padding: 8px 10px 10px; }
    .meta { display: none; }
    .acts { opacity: 1; }
  }
</style>
