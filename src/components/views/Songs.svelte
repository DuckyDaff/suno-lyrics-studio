<script>
  import { song } from '../../lib/song.js';
  import { songList, songs, openSong, newSong, duplicateSong, deleteSong, saveVersion, restoreVersion, deleteVersion } from '../../lib/songs.js';
  import { syncState, lastSync, pullAll } from '../../lib/sync.js';
  import { view, homographs, modal } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Icon from '../ui/Icon.svelte';
  import Button from '../ui/Button.svelte';

  let q = $state('');
  let openVersions = $state(null);   // song id whose versions are expanded

  const norm = s => (s || '').toLowerCase();
  const list = $derived($songList.filter(s => {
    if (!q.trim()) return true;
    const k = norm(q);
    return norm(s.title).includes(k) || norm(s.style).includes(k) || (s.sections || []).some(x => norm(x.text).includes(k));
  }));
  const words = s => (s.sections || []).reduce((n, x) => n + (x.text || '').split(/\s+/).filter(Boolean).length, 0);
  const when = ts => { const d = new Date(ts || 0), now = Date.now(), diff = now - d;
    if (diff < 60e3) return $t('justNow'); if (diff < 3600e3) return Math.round(diff / 60e3) + ' ' + $t('minAgo');
    if (diff < 86400e3) return Math.round(diff / 3600e3) + ' ' + $t('hrAgo'); return d.toLocaleDateString(); };
  const preview = s => (s.sections || []).map(x => (x.text || '').trim()).filter(Boolean).join(' / ').slice(0, 140);

  function open(id) { openSong(id); homographs.set(new Map()); view.set('editor'); }
  function create() { newSong(); homographs.set(new Map()); view.set('editor'); toast($t('toastNew'), 'success'); }
  function del(s) { if (!confirm($t('confirmDelete').replace('{t}', s.title || $t('untitled')))) return; deleteSong(s.id); toast($t('toastDeleted')); }
  function dup(id) { duplicateSong(id); toast($t('toastDuplicated'), 'success'); }
  function snap() { saveVersion(); toast($t('toastVersionSaved'), 'success'); }
  function restore(id, ts) { if (restoreVersion(id, ts)) { homographs.set(new Map()); view.set('editor'); toast($t('toastRestoredVersion'), 'success'); } }
  const versionsOf = id => ($songs.find(x => x.id === id)?.versions) || [];
</script>

<div class="page">
  <header class="hd">
    <h1>{$t('songsTitle')}</h1>
    <div class="sync {$syncState}" title={$lastSync ? new Date($lastSync).toLocaleTimeString() : ''}>
      <span class="dot"></span>
      {$t('sync_' + $syncState)}
      {#if $syncState === 'error' || $syncState === 'off'}<button class="link" onclick={pullAll}>{$t('syncRetry')}</button>{/if}
    </div>
  </header>

  <div class="tools">
    <div class="search"><Icon name="search" size={14} /><input placeholder={$t('searchSongs')} bind:value={q} /></div>
    <Button icon="filePlus" onclick={create}>{$t('newSong')}</Button>
    <Button variant="ghost" icon="grid" onclick={() => modal.set('templates')}>{$t('templates')}</Button>
    <Button variant="ghost" icon="upload" onclick={() => modal.set('import')}>{$t('import')}</Button>
  </div>

  {#if !list.length}
    <div class="empty">
      <Icon name="music" size={26} />
      <p>{q ? $t('noMatch') : $t('songsEmpty')}</p>
    </div>
  {/if}

  <ul class="list">
    {#each list as s (s.id)}
      {@const cur = s.id === $song.id}
      <li class="card" class:cur>
        <button class="main" onclick={() => open(s.id)}>
          <div class="ic"><Icon name="music" size={20} /></div>
          <div class="info">
            <div class="name">{s.title || $t('untitled')} {#if cur}<span class="tag">{$t('currentSong')}</span>{/if}</div>
            <div class="meta faint">{(s.sections || []).length} {$t('sectionsN')} · {words(s)} {$t('wordsN')} · {$t('edited')} {when(s.updatedAt)}{#if (s.versions || []).length} · {s.versions.length} {$t('versionsN')}{/if}</div>
            {#if s.style}<div class="style faint">{s.style.slice(0, 120)}</div>{/if}
            {#if preview(s)}<div class="prev faint" dir="auto">{preview(s)}</div>{/if}
          </div>
        </button>
        <div class="acts">
          {#if cur}<Button variant="ghost" size="sm" title={$t('saveVersionTitle')} onclick={snap}>📌 {$t('saveVersion')}</Button>{/if}
          {#if (s.versions || []).length}
            <Button variant="ghost" size="sm" onclick={() => (openVersions = openVersions === s.id ? null : s.id)} active={openVersions === s.id}>🕘 {$t('versions')}</Button>
          {/if}
          <Button variant="ghost" size="sm" icon="copy" title={$t('duplicate')} onclick={() => dup(s.id)} />
          <Button variant="ghost" size="sm" icon="trash" title={$t('delete')} onclick={() => del(s)} class="danger" />
        </div>
        {#if openVersions === s.id}
          <ul class="versions">
            {#each versionsOf(s.id) as v (v.ts)}
              <li>
                <span class="vt">{new Date(v.ts).toLocaleString()}</span>
                <span class="vn faint">{v.title || $t('untitled')} · {(v.sections || []).length} {$t('sectionsN')}</span>
                <Button size="sm" onclick={() => restore(s.id, v.ts)}>{$t('restore')}</Button>
                <Button variant="ghost" size="sm" icon="x" onclick={() => deleteVersion(s.id, v.ts)} />
              </li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .page { max-width: 820px; margin: 0 auto; padding: 24px 20px 40px; display: flex; flex-direction: column; gap: 16px; }
  .hd { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  h1 { font-size: var(--fs-xl); }
  .sync { display: inline-flex; align-items: center; gap: 7px; font-size: var(--fs-xs); color: var(--tx1); padding: 4px 10px; border-radius: 999px; background: var(--bg2); border: 1px solid var(--line); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--tx2); }
  .sync.ok .dot { background: var(--ok); }
  .sync.syncing .dot { background: var(--warn); animation: pulse 1s infinite; }
  .sync.error .dot { background: var(--err); }
  @keyframes pulse { 50% { opacity: .3; } }
  .link { color: var(--accent); font-weight: 700; text-decoration: underline; font-size: var(--fs-xs); }
  .tools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .search { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 8px; padding: 0 12px; height: 36px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx2); }
  .search input { flex: 1; background: none; border: 0; color: var(--tx0); font-size: var(--fs-sm); outline: none; }
  .list { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .card { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 12px 14px; background: var(--bg1); border: 1px solid var(--line); border-radius: var(--r3); }
  .card.cur { border-color: var(--accent-bd); }
  .card:hover { border-color: var(--accent-bd); }
  .main { flex: 1; min-width: 240px; display: flex; align-items: flex-start; gap: 12px; text-align: start; }
  .ic { width: 40px; height: 40px; flex-shrink: 0; border-radius: var(--r2); background: var(--accent-bg); color: var(--accent); display: grid; place-items: center; }
  .info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
  .name { font-weight: 700; font-size: var(--fs-md); display: flex; align-items: center; gap: 8px; }
  .meta, .style, .prev { font-size: var(--fs-xs); }
  .style { direction: ltr; text-align: start; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .prev { overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; line-height: 1.45; }
  .tag { font-size: 10px; font-weight: 700; color: var(--accent); background: var(--accent-bg); padding: 2px 8px; border-radius: 999px; }
  .acts { display: flex; gap: 4px; align-items: center; margin-inline-start: auto; }
  .versions { list-style: none; width: 100%; display: flex; flex-direction: column; gap: 4px; padding: 8px 0 0; border-top: 1px dashed var(--line); }
  .versions li { display: flex; align-items: center; gap: 10px; font-size: var(--fs-xs); padding: 4px 6px; }
  .vt { font-family: var(--font-mono); direction: ltr; }
  .vn { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 16px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); line-height: 1.6; }
</style>
