<script>
  import { song } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor, buildLyrics, SUNO_CREATE_URL } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { copyText } from '../../lib/clipboard.js';
  import { previewOpen } from '../../lib/ui.js';
  import { sectionColor } from '../../lib/sections.js';
  import { launchSuno } from '../../lib/launch.js';
  import { validateSong } from '../../lib/validate.js';
  import { view } from '../../lib/ui.js';
  import { setSetting } from '../../lib/settings.js';
  import Button from '../ui/Button.svelte';

  let { modal = false } = $props();

  const lim = $derived(limits($settings.sunoVersion));
  const lyrics = $derived(buildLyrics($song));
  const styleLen = $derived($song.style.trim().length);
  const check = $derived(validateSong($song, lim));
  const msg = i => $t('v_' + i.code).replace('{s}', i.section || '').replace('{d}', i.detail || '');

  function launch() {
    if (!launchSuno()) return toast($t('toastNothing'), 'error');
    if (!$settings.bookmarkletSeen) { toast($t('launchFirst'), '', 6000); setSetting('bookmarkletSeen', true); previewOpen.set(false); view.set('settings'); }
    else toast($t('launchHint'), 'success', 5000);
  }
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

  <section class="block check {check.status}">
    <div class="hd">
      <span class="lbl">{$t('checkTitle')}</span>
      <span class="badge {check.status}">{check.status === 'ok' ? '✓ ' + $t('checkOk') : `${check.errs} ${$t('checkErrs')} · ${check.warns} ${$t('checkWarns')}`}</span>
    </div>
    {#if check.issues.length}
      <ul class="issues">
        {#each check.issues as i}<li class={i.level}>{i.level === 'err' ? '✖' : '⚠'} {msg(i)}</li>{/each}
      </ul>
    {:else}<p class="faint small">{$t('checkOkHint')}</p>{/if}
  </section>

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
    <Button variant="suno" icon="send" size="lg" onclick={launch}>⚡ {$t('launch')}</Button>
    <p class="faint small">{$t('launchExplain')} <button class="link" onclick={() => { previewOpen.set(false); view.set('settings'); }}>{$t('launchSetup')}</button></p>
    <Button variant="ghost" icon="external" size="sm" href={SUNO_CREATE_URL} target="_blank">{$t('openSuno')}</Button>
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
  .small { font-size: var(--fs-xs); line-height: 1.5; }
  .link { color: var(--accent); font-weight: 700; font-size: var(--fs-xs); text-decoration: underline; }
  .badge { font-size: var(--fs-xs); font-weight: 700; padding: 3px 9px; border-radius: 999px; }
  .badge.ok { color: var(--ok); background: color-mix(in srgb, var(--ok) 12%, transparent); }
  .badge.warn { color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); }
  .badge.over { color: var(--err); background: color-mix(in srgb, var(--err) 12%, transparent); }
  .issues { list-style: none; display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-sm); padding: 8px 12px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); }
  .issues .err { color: var(--err); }
  .issues .warn { color: var(--warn); }
</style>
