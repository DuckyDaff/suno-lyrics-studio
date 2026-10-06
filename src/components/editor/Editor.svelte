<script>
  import { song, actions } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { buildLyrics } from '../../lib/suno.js';
  import { parseLyrics } from '../../lib/lyricsParse.js';
  import { runSunoFix } from '../../lib/sunoFix.js';
  import { nikudLyrics, HEBREW_RE } from '../../lib/hebrew/nikud.js';
  import { genState as g } from '../../lib/genState.js';
  import { busy } from '../../lib/ai.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import SectionCard from './SectionCard.svelte';
  import AddSection from './AddSection.svelte';
  import SunoFixPanel from '../panel/SunoFixPanel.svelte';

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
  function revert() {
    if (!fix || fix.songId !== $song.id) return;
    actions.replaceAll(parseLyrics(fix.before), null);
    fix = null;
  }
</script>

<div class="editor">
  {#if hasText}
    <SunoFixPanel info={fix && fix.songId === $song.id ? fix : null} busy={fixBusy} disabled={$busy} text={lyrics} onRun={run} onRevert={revert} />
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
