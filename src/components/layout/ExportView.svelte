<script>
  import { song } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor, buildLyrics, SUNO_CREATE_URL } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { copyText } from '../../lib/clipboard.js';
  import { previewOpen } from '../../lib/ui.js';
  import { sectionColor } from '../../lib/sections.js';
  import Button from '../ui/Button.svelte';

  let { modal = false } = $props();

  const lim = $derived(limits($settings.sunoVersion));
  const lyrics = $derived(buildLyrics($song));
  const styleLen = $derived($song.style.trim().length);

  async function copy(kind) {
    const text = kind === 'style' ? $song.style.trim() : lyrics;
    if (!text) return toast($t('toastNothing'), 'error');
    (await copyText(text))
      ? toast($t(kind === 'style' ? 'toastStyleCopied' : 'toastLyricsCopied'), 'success')
      : toast($t('toastCopyFail'), 'error');
  }
</script>

<div class="view">
  <header>
    <h2>{$t('exportTitle')}</h2>
    {#if modal}<Button variant="ghost" icon="x" onclick={() => previewOpen.set(false)} />{/if}
  </header>

  <section class="block">
    <div class="hd">
      <span class="lbl">{$t('step1')}</span>
      <span class="counter {levelFor(styleLen, lim.style) === 'ok' ? '' : levelFor(styleLen, lim.style)}">{styleLen} / {lim.style}</span>
    </div>
    <pre class="box style">{$song.style.trim() || $t('emptyPreview')}</pre>
    <Button icon="copy" size="lg" onclick={() => copy('style')}>{$t('copyStyle')}</Button>
  </section>

  <section class="block">
    <div class="hd">
      <span class="lbl">{$t('step2')}</span>
      <span class="counter {levelFor(lyrics.length, lim.lyrics) === 'ok' ? '' : levelFor(lyrics.length, lim.lyrics)}">{lyrics.length} / {lim.lyrics}</span>
    </div>
    <div class="box lyrics" dir="auto">
      {#if !lyrics}<span class="faint">{$t('emptyPreview')}</span>{/if}
      {#each $song.sections as sec}
        {@const text = (sec.text || '').trim()}
        {#if !text.startsWith('[')}<span class="tag" style="color:{sectionColor(sec.name)}">[{sec.name}]</span>{/if}
        <span class="txt" dir={sec.dir}>{text}</span>
      {/each}
    </div>
    <Button icon="copy" size="lg" onclick={() => copy('lyrics')}>{$t('copyLyrics')}</Button>
  </section>

  <section class="block">
    <span class="lbl">{$t('step3')}</span>
    <Button variant="suno" icon="external" size="lg" href={SUNO_CREATE_URL} target="_blank">{$t('openSuno')}</Button>
  </section>
</div>

<style>
  .view { padding: 18px 16px 28px; display: flex; flex-direction: column; gap: 18px; max-width: 760px; margin: 0 auto; }
  header { display: flex; align-items: center; justify-content: space-between; }
  h2 { font-size: var(--fs-lg); }
  .block { display: flex; flex-direction: column; gap: 8px; }
  .hd { display: flex; justify-content: space-between; align-items: baseline; }
  .lbl { font-size: var(--fs-sm); font-weight: 600; color: var(--tx1); }
  .box {
    background: var(--bg2); border: 1px solid var(--line); border-radius: var(--r2);
    padding: 12px 14px; font-family: var(--font-mono); font-size: var(--fs-sm); line-height: 1.7;
    white-space: pre-wrap; word-break: break-word; max-height: 40vh; overflow: auto;
  }
  .style { min-height: 44px; direction: ltr; text-align: left; }
  .lyrics { display: flex; flex-direction: column; gap: 2px; font-family: var(--font-ui); font-size: var(--fs-md); }
  .tag { font-family: var(--font-mono); font-size: var(--fs-xs); font-weight: 700; margin-top: 8px; direction: ltr; }
  .tag:first-child { margin-top: 0; }
  .txt { white-space: pre-wrap; }
</style>
