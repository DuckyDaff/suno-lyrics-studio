<script>
  import { song, actions } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { buildLyrics } from '../../lib/suno.js';
  import { parseLyrics } from '../../lib/lyricsParse.js';
  import { runSunoFix } from '../../lib/sunoFix.js';
  import { nikudLyrics, regenderLyrics, HEBREW_RE } from '../../lib/hebrew/nikud.js';
  import VoicePick from '../ui/VoicePick.svelte';
  import { genState as g } from '../../lib/genState.js';
  import { busy } from '../../lib/ai.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import SectionCard from './SectionCard.svelte';
  import AddSection from './AddSection.svelte';
  import SunoFixPanel from '../panel/SunoFixPanel.svelte';
  import SynonymPanel from '../panel/SynonymPanel.svelte';
  import { runSynonyms, changedRanges, synMarks } from '../../lib/synonyms.js';
  import { get } from 'svelte/store';

  const lyrics = $derived(buildLyrics($song));
  const hasText = $derived($song.sections.some(x => (x.text || '').trim()));
  let fix = $state(null);          // { before, changes, songId }
  let fixBusy = $state(false);

  /** the editor holds the user's own words: change only how they are written */
  async function run() {
    if (fixBusy || $busy || !hasText) return;
    fixBusy = true;
    const before = lyrics, songId = $song.id;
    try {
      const r = await runSunoFix(before, { keepWords: true, style: $song.style, form: $g.form, language: HEBREW_RE.test(before) ? 'Hebrew' : '' });
      let text = r.lyrics;
      if ($settings.autoNikud && HEBREW_RE.test(text)) { try { text = await nikudLyrics(text); } catch {} }
      if ($song.id !== songId) return;           // the user opened another song meanwhile
      const secs = parseLyrics(text);
      if (!secs.length) throw Object.assign(new Error('bad_fix'), { code: 'bad_fix' });
      actions.replaceAll(secs, null);
      fix = { before, changes: r.changes, songId };
      toast($t('fxDone'), 'success');
    } catch (e) { if (e.code !== 'aborted') toast($t('fxFail'), 'error', 5000); }
    finally { fixBusy = false; }
  }
  /* who sings to whom changed: re-vocalize only the gendered words of every section */
  let vBusy = $state(false);
  async function regender(v) {
    const secs = $song.sections.filter(x => HEBREW_RE.test(x.text || ''));
    if (!secs.length) return;
    vBusy = true; let n = 0;
    try {
      for (const x of secs) { const r = await regenderLyrics(x.text, v); if (r.changed) { actions.setText(x.id, r.text); n += r.changed; } }
      toast(n ? $t('vpFixed', { n }) : $t('vpNothing'), 'success');
    } catch { toast($t('toastNikudFail'), 'error'); }
    finally { vBusy = false; }
  }
  function revert() {
    if (!fix || fix.songId !== $song.id) return;
    actions.replaceAll(parseLyrics(fix.before), null);
    fix = null;
  }

  /* fresh words: Claude swaps words for synonyms; the new words are highlighted until the section is edited */
  let syn = $state(null);          // { before, after, changes, songId, on }
  let synBusy = $state(false);
  const marked = $derived(Object.keys($synMarks).length > 0);
  /** put `text` in the editor; with `marks`, highlight every word that differs from `before` */
  function applySyn(text, before, marks) {
    actions.replaceAll(parseLyrics(text), null);
    const old = parseLyrics(before), out = {};
    if (marks) get(song).sections.forEach((x, i) => {
      const ranges = changedRanges(old[i]?.text || '', x.text);
      if (ranges.length) out[x.id] = { text: x.text, ranges };
    });
    synMarks.set(out);
  }
  async function runSyn() {
    if (synBusy || $busy || !hasText) return;
    synBusy = true;
    const before = lyrics, songId = $song.id;
    try {
      const r = await runSynonyms(before, { language: HEBREW_RE.test(before) ? 'Hebrew' : '' });
      let text = r.lyrics;
      if ($settings.autoNikud && HEBREW_RE.test(text)) { try { text = await nikudLyrics(text); } catch {} }
      if ($song.id !== songId) return;
      if (parseLyrics(text).length !== parseLyrics(before).length) throw Object.assign(new Error('bad_syn'), { code: 'bad_syn' });
      applySyn(text, before, true);
      syn = { before, after: text, changes: r.changes, songId, on: true };
      toast(r.changes.length ? $t('synDone', { n: r.changes.length }) : $t('synNone'), 'success');
    } catch (e) { if (e.code !== 'aborted') toast($t('synFail'), 'error', 5000); }
    finally { synBusy = false; }
  }
  function synUndo() {
    if (!syn || syn.songId !== $song.id) return;
    applySyn(syn.before, syn.before, false);
    syn = { ...syn, on: false };
  }
  function synRedo() {
    if (!syn || syn.songId !== $song.id) return;
    applySyn(syn.after, syn.before, true);
    syn = { ...syn, on: true };
  }
</script>

<div class="editor">
  <VoicePick onChange={regender} busy={vBusy} />
  {#if hasText}
    <SunoFixPanel info={fix && fix.songId === $song.id ? fix : null} busy={fixBusy} disabled={$busy} text={lyrics} onRun={run} onRevert={revert} />
    <SynonymPanel info={syn && syn.songId === $song.id ? { ...syn, marked } : null} busy={synBusy} disabled={$busy}
                  onRun={runSyn} onUndo={synUndo} onRedo={synRedo} onHide={() => synMarks.set({})} />
  {/if}
  {#each $song.sections as sec, i (sec.id)}
    <SectionCard {sec} index={i} total={$song.sections.length} />
  {/each}
  <AddSection />
</div>

<style>
  .editor {
    max-width: 860px; margin: 0 auto; padding: 18px 20px 40px;
    display: flex; flex-direction: column; gap: 12px;
  }
  @media (max-width: 768px) { .editor { padding: 12px 12px 32px; gap: 10px; } }
</style>
