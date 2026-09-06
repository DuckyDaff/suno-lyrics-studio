<script>
  import { song } from '../../lib/song.js';
  import { view } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import Icon from '../ui/Icon.svelte';
  import Button from '../ui/Button.svelte';

  const words = $derived($song.sections.reduce((n, s) => n + (s.text || '').split(/\s+/).filter(Boolean).length, 0));
</script>

<div class="page">
  <h1>{$t('songsTitle')}</h1>

  <button class="songCard" onclick={() => view.set('editor')}>
    <div class="ic"><Icon name="music" size={22} /></div>
    <div class="info">
      <div class="name">{$song.title || $t('untitled')}</div>
      <div class="meta faint">{$song.sections.length} sections · {words} words · {$t('edited')} {new Date($song.updatedAt).toLocaleString()}</div>
    </div>
    <span class="tag">{$t('currentSong')}</span>
  </button>

  <div class="empty">
    <Icon name="sparkles" size={26} />
    <p>{$t('songsComing')}</p>
  </div>
</div>

<style>
  .page { max-width: 760px; margin: 0 auto; padding: 24px 20px; display: flex; flex-direction: column; gap: 18px; }
  h1 { font-size: var(--fs-xl); }
  .songCard {
    display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-align: start;
    background: var(--bg1); border: 1px solid var(--line); border-radius: var(--r3);
  }
  .songCard:hover { border-color: var(--accent-bd); }
  .ic { width: 44px; height: 44px; border-radius: var(--r2); background: var(--accent-bg); color: var(--accent); display: grid; place-items: center; }
  .info { flex: 1; min-width: 0; }
  .name { font-weight: 700; font-size: var(--fs-md); }
  .meta { font-size: var(--fs-xs); }
  .tag { font-size: 10px; font-weight: 700; color: var(--accent); background: var(--accent-bg); padding: 3px 8px; border-radius: 999px; }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 16px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); line-height: 1.6; }
</style>
