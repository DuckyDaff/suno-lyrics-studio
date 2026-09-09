<script>
  import { song } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor, buildLyrics, SUNO_CREATE_URL } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { copyText } from '../../lib/clipboard.js';
  import { previewOpen, view } from '../../lib/ui.js';
  import { launchSuno } from '../../lib/launch.js';
  import { validateSong } from '../../lib/validate.js';
  import { setSetting } from '../../lib/settings.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  const lim = $derived(limits($settings.sunoVersion));
  const lyrics = $derived(buildLyrics($song));
  const styleLen = $derived($song.style.trim().length);
  const lyrLevel = $derived(levelFor(lyrics.length, lim.lyrics));
  const styLevel = $derived(levelFor(styleLen, lim.style));
  const check = $derived(validateSong($song, lim));
  const status = $derived(check.status === 'over' || lyrLevel === 'over' || styLevel === 'over' ? 'over' : check.status === 'warn' || lyrLevel === 'warn' || styLevel === 'warn' ? 'warn' : 'ok');
  const issueTitle = $derived(check.issues.map(i => (i.level === 'err' ? '✖ ' : '⚠ ') + $t('v_' + i.code).replace('{s}', i.section || '').replace('{d}', i.detail || '')).join('\n'));

  function launch() {
    if (!launchSuno()) return toast($t('toastNothing'), 'error');
    if (!$settings.bookmarkletSeen) { toast($t('launchFirst'), '', 6000); setSetting('bookmarkletSeen', true); view.set('settings'); }
    else toast($t('launchHint'), 'success', 5000);
  }
  async function copy(kind) {
    const text = kind === 'style' ? $song.style.trim()
      : kind === 'lyrics' ? lyrics
      : [$song.style.trim(), lyrics].filter(Boolean).join('\n\n');
    if (!text) return toast($t('toastNothing'), 'error');
    (await copyText(text))
      ? toast($t(kind === 'style' ? 'toastStyleCopied' : kind === 'lyrics' ? 'toastLyricsCopied' : 'toastAllCopied'), 'success')
      : toast($t('toastCopyFail'), 'error');
  }
</script>

<div class="bar">
  <div class="stats">
    <span class="lbl">{$t('lyrics')}</span><span class="counter {lyrLevel === 'ok' ? '' : lyrLevel}">{lyrics.length} / {lim.lyrics}</span>
    <span class="sep">·</span>
    <span class="lbl">{$t('style')}</span><span class="counter {styLevel === 'ok' ? '' : styLevel}">{styleLen} / {lim.style}</span>
    <button class="status {status}" title={issueTitle} onclick={() => previewOpen.set(true)}>
      <Icon name={status === 'ok' ? 'check' : 'alert'} size={13} />
      {$t(status === 'ok' ? 'statusOk' : lyrLevel === 'over' || styLevel === 'over' ? 'statusOver' : check.errs ? 'statusErrs' : check.warns ? 'statusWarns' : 'statusWarn')}
      {#if check.issues.length}<span class="n">{check.issues.length}</span>{/if}
    </button>
  </div>
  <div class="actions">
    <Button variant="ghost" icon="eye" size="sm" onclick={() => previewOpen.set(true)}>{$t('preview')}</Button>
    <Button icon="copy" size="sm" onclick={() => copy('style')}>{$t('copyStyle')}</Button>
    <Button icon="copy" size="sm" onclick={() => copy('lyrics')}>{$t('copyLyrics')}</Button>
    <Button variant="ghost" size="sm" onclick={() => copy('all')}>{$t('copyAll')}</Button>
    <Button variant="ghost" icon="external" size="sm" href={SUNO_CREATE_URL} target="_blank" title={$t('openSuno')} />
    <Button variant="suno" icon="send" size="sm" onclick={launch} title={$t('launchTitle')}>⚡ {$t('launch')}</Button>
  </div>
</div>

<style>
  .bar { height: 100%; display: flex; align-items: center; gap: 12px; padding: 0 16px; }
  .stats { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; overflow: hidden; }
  .sep { color: var(--tx2); }
  .lbl { font-size: var(--fs-xs); color: var(--tx1); font-weight: 600; }
  .status { display: inline-flex; align-items: center; gap: 5px; font-size: var(--fs-xs); font-weight: 700; padding: 3px 9px; border-radius: 999px; margin-inline-start: 6px; }
  .status.ok   { color: var(--ok);   background: color-mix(in srgb, var(--ok) 12%, transparent); }
  .status.warn { color: var(--warn); background: color-mix(in srgb, var(--warn) 12%, transparent); }
  .status.over { color: var(--err);  background: color-mix(in srgb, var(--err) 12%, transparent); }
  .status .n { font-size: 10px; padding: 0 5px; border-radius: 999px; background: currentColor; color: var(--bg0); line-height: 15px; }
  .actions { display: flex; gap: 6px; flex-shrink: 0; }
</style>
