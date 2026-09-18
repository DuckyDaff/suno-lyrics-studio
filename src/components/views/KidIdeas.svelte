<script>
  /** Parent side: the kid's ideas — listen, transcribe, read drawings, take into Create, send the song back. */
  import { onMount } from 'svelte';
  import { user } from '../../lib/auth.js';
  import { settings, setSetting } from '../../lib/settings.js';
  import { setGen } from '../../lib/genState.js';
  import { actions } from '../../lib/song.js';
  import { newSong } from '../../lib/songs.js';
  import { view, wsTab, mobileTab, homographs } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { copyText } from '../../lib/clipboard.js';
  import { STEPS, card, sentence, brief } from '../../kid/cards.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  let ideas = $state([]);
  let loading = $state(true);
  let filter = $state('new');   // new | used | archived | all
  let link = $state('');
  let busy = $state({});         // id → 'transcribe' | 'describe' | 'status'
  let songForm = $state(null);   // { id, url, title }

  const hdr = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${$user?.token || ''}` });
  async function call(action, body, method = 'POST') {
    const r = await fetch(`/api/kid?action=${action}`, { method, headers: hdr(), body: body ? JSON.stringify(body) : undefined });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw Object.assign(new Error(j.error || 'error'), { code: j.error, detail: j.detail });
    return j;
  }
  const fileUrl = p => `/api/kid?action=file&p=${encodeURIComponent(p)}&t=${encodeURIComponent($user?.token || '')}`;

  async function load() {
    loading = true;
    try { ideas = (await call('list', null, 'GET')).ideas || []; } catch (e) { toast($t('kidLoadFail') + (e.code === 'no_store' ? '' : ''), 'error'); }
    loading = false;
  }
  onMount(load);

  const shown = $derived(ideas.filter(i => filter === 'all' ? true : (i.status || 'new') === filter));
  const counts = $derived({ new: ideas.filter(i => (i.status || 'new') === 'new').length, used: ideas.filter(i => i.status === 'used').length, archived: ideas.filter(i => i.status === 'archived').length });

  async function makeLink() {
    try {
      const r = await call('link', { name: $settings.kidName || 'גאלה' });
      link = `${location.origin}/gala?k=${r.token}`;
      (await copyText(link)) ? toast($t('kidLinkCopied'), 'success') : null;
    } catch { toast($t('kidLinkFail'), 'error'); }
  }

  async function setStatus(it, status) {
    if (status === 'deleted' && !confirm($t('kidConfirmDelete'))) return;
    busy = { ...busy, [it.id]: 'status' };
    try {
      await call('status', { id: it.id, status });
      ideas = status === 'deleted' ? ideas.filter(x => x.id !== it.id) : ideas.map(x => x.id === it.id ? { ...x, status } : x);
    } catch { toast($t('toastToolFail'), 'error'); }
    busy = { ...busy, [it.id]: '' };
  }
  async function transcribe(it) {
    if (!it.takes?.length) return;
    busy = { ...busy, [it.id]: 'transcribe' };
    try {
      const parts = [];
      for (const tk of it.takes) { const r = await call('transcribe', { path: tk.path }); if (r.text) parts.push(r.text); }
      const transcript = parts.join('\n');
      await call('status', { id: it.id, note: it.note || '' });   // touch
      ideas = ideas.map(x => x.id === it.id ? { ...x, transcript } : x);
      await saveField(it.id, { transcript });
      toast($t('kidTranscribed'), 'success');
    } catch (e) { toast(e.code === 'no_stt' ? $t('kidNoStt') : ($t('kidSttFail') + (e.detail ? ': ' + e.detail : '')), 'error', 6000); }
    busy = { ...busy, [it.id]: '' };
  }
  async function describe(it, kind) {
    const path = kind === 'photo' ? it.photo : it.drawing; if (!path) return;
    busy = { ...busy, [it.id]: 'describe' };
    try {
      const r = await call('describe', { path, kind });
      const description = [it.description, r.text].filter(Boolean).join('\n');
      ideas = ideas.map(x => x.id === it.id ? { ...x, description } : x);
      await saveField(it.id, { description });
    } catch (e) { toast($t('kidDescribeFail') + (e.detail ? ': ' + e.detail : ''), 'error', 6000); }
    busy = { ...busy, [it.id]: '' };
  }
  // parent-side fields are saved through the idea upsert (parent may write everything)
  async function saveField(id, patch) { const it = ideas.find(x => x.id === id); if (it) await call('idea', { idea: { ...it, ...patch } }); }

  function takeToCreate(it) {
    const st = card('style', it.cards?.style);
    newSong(); homographs.set(new Map());
    if (st) actions.setStyle(st.style);
    actions.setTitle('');
    setGen({ idea: brief(it, $settings.kidName || 'Gala'), form: st?.form || "children's song", language: 'Hebrew', useStyle: !!st, output: '', outMode: '' });
    setStatus(it, 'used');
    view.set('editor'); wsTab.set('ai'); mobileTab.set('ai');
    toast($t('kidTaken'), 'success');
  }
  async function sendSong() {
    if (!songForm?.url) return;
    try {
      await call('song', { id: songForm.id, songUrl: songForm.url, title: songForm.title });
      ideas = ideas.map(x => x.id === songForm.id ? { ...x, songUrl: songForm.url, songTitle: songForm.title, status: 'used' } : x);
      toast($t('kidSongSent'), 'success'); songForm = null;
    } catch { toast($t('toastToolFail'), 'error'); }
  }
  const when = ts => new Date(ts || 0).toLocaleString();
  const mmss = n => `${Math.floor((n || 0) / 60)}:${String((n || 0) % 60).padStart(2, '0')}`;
</script>

<div class="page">
  <header class="hd">
    <h1>🧒 {$t('kidTitle', { n: $settings.kidName || 'גאלה' })}</h1>
    <Button variant="ghost" size="sm" icon="undo" onclick={load}>{$t('refresh')}</Button>
  </header>

  <section class="setup">
    <div class="row">
      <label>{$t('kidName')} <input class="field name" value={$settings.kidName || 'גאלה'} oninput={e => setSetting('kidName', e.target.value)} /></label>
      <Button icon="external" onclick={makeLink}>{$t('kidMakeLink')}</Button>
    </div>
    <p class="faint small">{$t('kidLinkHint')}</p>
    {#if link}<input class="field mono" readonly value={link} onclick={e => e.target.select()} />{/if}
  </section>

  <div class="filters">
    {#each ['new', 'used', 'archived', 'all'] as f}
      <button class="chip" class:on={filter === f} onclick={() => (filter = f)}>{$t('kidF_' + f)}{#if f !== 'all'} <span class="n">{counts[f]}</span>{/if}</button>
    {/each}
  </div>

  {#if loading}<p class="faint">{$t('loading')}</p>
  {:else if !shown.length}<div class="empty"><Icon name="sparkles" size={24} /><p>{$t('kidEmpty')}</p></div>{/if}

  <ul class="list">
    {#each shown as it (it.id)}
      <li class="card">
        <div class="top">
          <div class="emojis">{#each STEPS as s}{#if it.cards?.[s.id]}<span title={card(s.id, it.cards[s.id])?.en}>{card(s.id, it.cards[s.id])?.emoji}</span>{/if}{/each}</div>
          <div class="info">
            <div class="sent">{it.sentence || sentence(it.cards || {})}</div>
            <div class="meta faint">{when(it.createdAt)}{#if it.by} · {it.by}{/if} · <span class="st {it.status || 'new'}">{$t('kidF_' + (it.status || 'new'))}</span></div>
          </div>
        </div>

        {#if it.takes?.length}
          <div class="takes">
            {#each it.takes as tk, i (tk.id)}
              <div class="take"><span class="n">{i + 1}</span><audio controls preload="none" src={fileUrl(tk.path)}></audio><span class="faint mono">{mmss(tk.seconds)}</span></div>
            {/each}
            <Button size="sm" onclick={() => transcribe(it)} disabled={!!busy[it.id]}>{busy[it.id] === 'transcribe' ? $t('kidTranscribing') : '📝 ' + $t('kidTranscribe')}</Button>
          </div>
        {/if}
        {#if it.transcript}<blockquote class="tr" dir="auto">{it.transcript}</blockquote>{/if}

        {#if it.drawing || it.photo}
          <div class="media">
            {#if it.drawing}<figure><img src={fileUrl(it.drawing)} alt="" /><figcaption><Button size="sm" variant="ghost" onclick={() => describe(it, 'drawing')} disabled={!!busy[it.id]}>🎨 {busy[it.id] === 'describe' ? $t('kidDescribing') : $t('kidDescribe')}</Button></figcaption></figure>{/if}
            {#if it.photo}<figure><img src={fileUrl(it.photo)} alt="" /><figcaption><Button size="sm" variant="ghost" onclick={() => describe(it, 'photo')} disabled={!!busy[it.id]}>📷 {busy[it.id] === 'describe' ? $t('kidDescribing') : $t('kidDescribe')}</Button></figcaption></figure>{/if}
          </div>
        {/if}
        {#if it.description}<blockquote class="tr" dir="auto">{it.description}</blockquote>{/if}

        <label class="note">{$t('kidNote')}
          <input class="field" value={it.note || ''} placeholder={$t('kidNotePh')} onchange={e => { const note = e.target.value; ideas = ideas.map(x => x.id === it.id ? { ...x, note } : x); call('status', { id: it.id, note }).catch(() => {}); }} />
        </label>

        {#if it.songUrl}<div class="song">⭐ {$t('kidSongAttached')}: <a href={it.songUrl} target="_blank" rel="noopener">{it.songTitle || it.songUrl}</a></div>{/if}

        <div class="acts">
          <Button variant="primary" icon="sparkles" onclick={() => takeToCreate(it)}>{$t('kidTake')}</Button>
          <Button variant="ghost" size="sm" onclick={() => (songForm = songForm?.id === it.id ? null : { id: it.id, url: it.songUrl || '', title: it.songTitle || '' })}>🎁 {$t('kidSendSong')}</Button>
          {#if (it.status || 'new') !== 'archived'}<Button variant="ghost" size="sm" onclick={() => setStatus(it, 'archived')}>{$t('kidArchive')}</Button>
          {:else}<Button variant="ghost" size="sm" onclick={() => setStatus(it, 'new')}>{$t('kidUnarchive')}</Button>{/if}
          <Button variant="ghost" size="sm" icon="trash" class="danger" onclick={() => setStatus(it, 'deleted')} title={$t('delete')} />
        </div>
        {#if songForm?.id === it.id}
          <div class="songForm">
            <input class="field" placeholder={$t('kidSongUrlPh')} bind:value={songForm.url} dir="ltr" />
            <input class="field" placeholder={$t('kidSongTitlePh')} bind:value={songForm.title} />
            <Button size="sm" icon="check" onclick={sendSong}>{$t('kidSendSongBtn')}</Button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .page { max-width: 860px; margin: 0 auto; padding: 24px 20px 40px; display: flex; flex-direction: column; gap: 16px; }
  .hd { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  h1 { font-size: var(--fs-xl); }
  .setup { display: flex; flex-direction: column; gap: 8px; padding: 12px 14px; border-radius: var(--r3); background: var(--bg1); border: 1px solid var(--line); }
  .row { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .row label { display: flex; align-items: center; gap: 8px; font-size: var(--fs-sm); }
  .field { padding: 7px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx0); font-size: var(--fs-sm); width: 100%; }
  .field.name { width: 140px; }
  .small { font-size: var(--fs-xs); line-height: 1.5; }
  .filters { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip { padding: 5px 12px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 700; background: var(--bg2); border: 1px solid var(--line); color: var(--tx1); }
  .chip.on { border-color: var(--accent); color: var(--accent); background: var(--accent-bg); }
  .chip .n { opacity: .7; }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); }
  .list { list-style: none; display: flex; flex-direction: column; gap: 12px; }
  .card { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; background: var(--bg1); border: 1px solid var(--line); border-radius: var(--r3); }
  .top { display: flex; gap: 14px; align-items: center; }
  .emojis { font-size: 30px; display: flex; gap: 4px; flex-shrink: 0; }
  .info { flex: 1; min-width: 0; }
  .sent { font-weight: 800; font-size: var(--fs-md); }
  .meta { font-size: var(--fs-xs); }
  .st { font-weight: 700; }
  .st.new { color: var(--warn); } .st.used { color: var(--ok); } .st.archived { color: var(--tx2); }
  .takes { display: flex; flex-direction: column; gap: 6px; }
  .take { display: flex; align-items: center; gap: 8px; }
  .take .n { width: 22px; height: 22px; border-radius: 50%; background: var(--bg3); display: grid; place-items: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
  .take audio { flex: 1; min-width: 0; height: 36px; }
  .tr { padding: 10px 12px; border-inline-start: 3px solid var(--accent); background: var(--bg2); border-radius: var(--r2); font-size: var(--fs-sm); line-height: 1.6; white-space: pre-wrap; }
  .media { display: flex; gap: 12px; flex-wrap: wrap; }
  figure { display: flex; flex-direction: column; gap: 6px; align-items: center; }
  figure img { max-width: 260px; max-height: 220px; border-radius: var(--r2); border: 1px solid var(--line); background: #fff; }
  .note { display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-xs); color: var(--tx1); }
  .song { font-size: var(--fs-sm); font-weight: 700; color: var(--warn); }
  .song a { color: var(--accent); text-decoration: underline; }
  .acts { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
  .songForm { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; padding: 10px; border-radius: var(--r2); background: var(--bg2); border: 1px dashed var(--line); }
  .songForm .field { flex: 1; min-width: 180px; width: auto; }
</style>
