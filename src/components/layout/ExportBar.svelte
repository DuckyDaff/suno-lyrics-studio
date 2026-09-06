<script>
  import { song } from '../../lib/song.js';
  import { settings } from '../../lib/settings.js';
  import { limits, levelFor, buildLyrics, SUNO_CREATE_URL } from '../../lib/suno.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { copyText } from '../../lib/clipboard.js';
  import { previewOpen } from '../../lib/ui.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  const lim = $derived(limits($settings.sunoVersion));
  const lyrics = $derived(buildLyrics($song));
  const styleLen = $derived($song.style.trim().length);
  const lyrLevel = $derived(levelFor(lyrics.length, lim.lyrics));
  const styLevel = $derived(levelFor(styleLen, lim.style));
  const status = $derived(lyrLevel === 'over' || styLevel === 'over' ? 'over' : lyrLevel === 'warn' || styLevel === 'warn' ? 'warn' : 'ok');

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
    <span class="status {status}">
      <Icon name={status === 'ok' ? 'check' : 'alert'} size={13} />
      {$t(status === 'ok' ? 'statusOk' : status === 'warn' ? 'statusWarn' : 'statusOver')}
    </span>
  </div>
  <div class="actions">
    <Button variant="ghost" icon="eye" size="sm" onclick={() => previewOpen.set(true)}>{$t('preview')}</Button>
    <Button icon="copy" size="sm" onclick={() => copy('style')}>{$t('copyStyle')}</Button>
    <Button icon="copy" size="sm" onclick={() => copy('lyrics')}>{$t('copyLyrics')}</Button>
    <Button variant="ghost" size="sm" onclick={() => copy('all')}>{$t('copyAll')}</Button>
    <Button variant="suno" icon="external" size="sm" href={SUNO_CREATE_URL} target="_blank">{$t('openSuno')}</Button>
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
  .actions { display: flex; gap: 6px; flex-shrink: 0; }
</style>
