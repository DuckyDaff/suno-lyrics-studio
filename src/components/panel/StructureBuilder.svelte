<script>
  /** 🧱 Song structure: sections with exact bar counts, kind (sung / rap / backing / instrumental) and a
   *  producer note, shown as a timeline. Goes to the writer and is enforced on the result (lib/structure.js). */
  import { genState as g, setGen } from '../../lib/genState.js';
  import { song, actions } from '../../lib/song.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { STRUCTURE_PRESETS, TIME_SIGS, SECTION_NAMES, estimateSeconds } from '../../lib/data/structures.js';
  import { QUICK, linesFor, tagName } from '../../lib/structure.js';
  import Icon from '../ui/Icon.svelte';

  let { styleBpm = '' } = $props();

  const music = $derived($g.music);
  const rows = $derived(music.bars);
  const totalBars = $derived(rows.reduce((n, r) => n + (parseInt(r.bars, 10) || 0), 0));
  const totalLines = $derived(rows.reduce((n, r) => n + linesFor(r, music.sig, music.linesPerBar), 0));
  const seconds = $derived(estimateSeconds(rows, music.sig, music.bpm || styleBpm));
  const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  let presetId = $state('');
  let sel = $state(-1);

  function setMusic(patch) { setGen({ music: { ...$g.music, ...patch } }); }
  function setRows(bars) { setMusic({ bars }); }
  function setRow(i, patch) { setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r))); }
  /** "Verse" → "Verse 2" when a Verse already exists */
  function nameFor(n) {
    if (!/^verse$/i.test(n)) return n;
    const k = rows.filter(r => /^verse/i.test(r.name)).length;
    return `Verse ${k + 1}`;
  }
  function add([name, bars, kind]) { setRows([...rows, { name: nameFor(name), bars, kind, note: '' }]); sel = rows.length; }
  function dup(i) { const a = [...rows]; a.splice(i + 1, 0, { ...rows[i] }); setRows(a); sel = i + 1; }
  function del(i) { setRows(rows.filter((_, j) => j !== i)); sel = -1; }
  function move(i, d) { const a = [...rows], j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setRows(a); sel = j; }
  function step(i, d) { const n = Math.max(1, (parseInt(rows[i].bars, 10) || 0) + d); setRow(i, { bars: n }); }

  function applyPreset(id) {
    presetId = id;
    if (id === 'sections') {
      setRows($song.sections.map(x => {
        const name = x.name.split(':')[0].trim();
        const instr = !(x.text || '').trim();
        const bars = parseInt((x.name.match(/(\d+)\s*bars?/i) || [])[1], 10) || Math.max(4, (x.text || '').split('\n').filter(l => l.trim()).length) || 8;
        return { name, bars, kind: instr ? 'instrumental' : 'lyrics', note: '' };
      }));
      return;
    }
    const p = STRUCTURE_PRESETS.find(x => x.id === id); if (!p) return;
    setMusic({ sig: p.sig, linesPerBar: p.linesPerBar, bars: p.rows.map(r => ({ note: '', ...r })) });
  }

  /** write the structure into the editor as empty sections with Suno tags (to fill in by hand) */
  function toEditor() {
    if (!rows.length) return;
    const has = $song.sections.some(x => (x.text || '').trim());
    if (has && !confirm($t('stToEditorConfirm'))) return;
    actions.replaceAll(rows.filter(r => r.name).map(r => ({ name: tagName(r), text: '' })), null);
    toast($t('stToEditorDone', { n: rows.length }), 'success');
  }

  const COLORS = { lyrics: 'var(--accent)', rap: 'var(--warn)', backing: '#a78bfa', instrumental: 'var(--tx2)' };
</script>

<div class="st" class:on={$g.musicOn}>
  <div class="hd">
    <label class="chk big"><input type="checkbox" bind:checked={$g.musicOn} /> 🧱 {$t('stTitle')}</label>
    {#if rows.length}
      <span class="tot mono">{totalBars} {$t('aiBars')} · {totalLines} {$t('stLines')}{#if seconds} · {$t('aiApprox')}{fmt(seconds)}{/if}</span>
    {/if}
  </div>

  {#if rows.length}
    <div class="tl" title={$t('stTimelineTitle')}>
      {#each rows as r, i}
        <button class="blk {r.kind}" class:sel={sel === i} style="flex: {Math.max(1, parseInt(r.bars, 10) || 1)}; --c: {COLORS[r.kind] || COLORS.lyrics}"
                onclick={() => (sel = sel === i ? -1 : i)} title="{r.name} · {r.bars} {$t('aiBars')}">
          <span class="bn">{r.name}</span><span class="bb mono">{r.bars}</span>
        </button>
      {/each}
    </div>
  {/if}

  {#if $g.musicOn}
    <p class="faint hint">{$t('stHint')}</p>
    <div class="g3">
      <label class="f"><span>{$t('aiBpm')}</span><input class="field" inputmode="numeric" placeholder={styleBpm ? `${styleBpm} (${$t('aiBpmPh')})` : '—'} value={music.bpm} oninput={e => setMusic({ bpm: e.target.value.replace(/\D/g, '') })} /></label>
      <label class="f"><span>{$t('aiSig')}</span><select class="field" value={music.sig} onchange={e => setMusic({ sig: e.target.value })}>{#each TIME_SIGS as sg}<option value={sg}>{sg}</option>{/each}</select></label>
      <label class="f"><span>{$t('aiLpb')}</span><select class="field" value={music.linesPerBar} onchange={e => setMusic({ linesPerBar: e.target.value })}>
        <option value="auto">{$t('aiLpbAuto')}</option><option value="1">{$t('aiLpb1')}</option><option value="0.5">{$t('aiLpbHalf')}</option><option value="2">{$t('aiLpb2')}</option>
      </select></label>
    </div>
    <div class="row">
      <select class="field preset" value={presetId} onchange={e => applyPreset(e.target.value)}>
        <option value="">{$t('aiPresetPick')}</option>
        <option value="sections">{$t('aiFromSections')}</option>
        {#each STRUCTURE_PRESETS as pr}<option value={pr.id}>{pr.label} · {pr.sig}</option>{/each}
      </select>
      <button class="lnk" onclick={toEditor} disabled={!rows.length} title={$t('stToEditorTitle')}>📥 {$t('stToEditor')}</button>
      {#if rows.length}<button class="lnk dim" onclick={() => { setRows([]); sel = -1; }}>{$t('clear')}</button>{/if}
    </div>

    <div class="quick">
      <span class="ql">{$t('stAdd')}</span>
      {#each QUICK as q}<button class="qb {q[2]}" onclick={() => add(q)}>+ {q[0]}</button>{/each}
    </div>

    {#each rows as r, i}
      <div class="r" class:sel={sel === i}>
        <span class="dot" style="--c: {COLORS[r.kind] || COLORS.lyrics}"></span>
        <input class="field name" list="st-names" value={r.name} oninput={e => setRow(i, { name: e.target.value })} onfocus={() => (sel = i)} />
        <span class="bars">
          <button class="sb" onclick={() => step(i, -4)} title="-4">−</button>
          <input class="field n mono" inputmode="numeric" value={r.bars} oninput={e => setRow(i, { bars: e.target.value.replace(/\D/g, '') })} />
          <button class="sb" onclick={() => step(i, 4)} title="+4">+</button>
        </span>
        <select class="field kind" value={r.kind} onchange={e => setRow(i, { kind: e.target.value })}>
          <option value="lyrics">{$t('aiKindLyrics')}</option><option value="rap">{$t('stKindRap')}</option>
          <option value="backing">{$t('aiKindBacking')}</option><option value="instrumental">{$t('aiKindInstr')}</option>
        </select>
        <span class="ln mono" title={$t('stLinesTitle')}>{r.kind === 'instrumental' ? '♪' : '≈' + linesFor(r, music.sig, music.linesPerBar)}</span>
        <span class="acts">
          <button class="ib" onclick={() => move(i, -1)} disabled={i === 0} title="↑"><Icon name="arrowUp" size={12} /></button>
          <button class="ib" onclick={() => move(i, 1)} disabled={i === rows.length - 1} title="↓"><Icon name="arrowDown" size={12} /></button>
          <button class="ib" onclick={() => dup(i)} title={$t('duplicate')}><Icon name="copy" size={12} /></button>
          <button class="ib del" onclick={() => del(i)} title={$t('delete')}><Icon name="x" size={12} /></button>
        </span>
        <input class="field note" dir="ltr" value={r.note || ''} oninput={e => setRow(i, { note: e.target.value })} placeholder={$t('stNotePh')} />
        <code class="tag" dir="ltr">[{tagName(r)}]</code>
      </div>
    {/each}
    <datalist id="st-names">{#each SECTION_NAMES as n}<option value={n}></option>{/each}</datalist>
  {/if}
</div>

<style>
  .st { display: flex; flex-direction: column; gap: 7px; padding: 9px 11px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); }
  .st.on { border-color: var(--accent-bd); }
  .hd { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .chk { display: flex; align-items: center; gap: 6px; font-size: var(--fs-sm); font-weight: 800; color: var(--tx0); cursor: pointer; }
  .chk input { accent-color: var(--accent); }
  .tot { font-size: 10px; color: var(--tx1); }
  .hint { font-size: 11px; line-height: 1.45; }
  .tl { display: flex; gap: 2px; height: 34px; direction: ltr; border-radius: var(--r1); overflow: hidden; }
  .blk { min-width: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 0 2px;
         background: color-mix(in srgb, var(--c) 22%, var(--bg1)); border-bottom: 3px solid var(--c); color: var(--tx0); overflow: hidden; }
  .blk.instrumental { background: repeating-linear-gradient(135deg, var(--bg1) 0 5px, color-mix(in srgb, var(--c) 18%, var(--bg1)) 5px 10px); }
  .blk.sel { outline: 2px solid var(--accent); outline-offset: -2px; }
  .bn { font-size: 9.5px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .bb { font-size: 9px; color: var(--tx1); }
  .g3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 4px; }
  .f { display: flex; flex-direction: column; gap: 3px; font-size: 11px; font-weight: 600; color: var(--tx2); }
  .f .field, .preset { padding: 6px 7px; font-size: 11px; min-width: 0; }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .preset { flex: 1; min-width: 150px; }
  .lnk { font-size: var(--fs-xs); font-weight: 700; color: var(--accent); white-space: nowrap; }
  .lnk.dim { color: var(--tx2); }
  .lnk:disabled { opacity: .4; }
  .quick { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .ql { font-size: 11px; font-weight: 700; color: var(--tx2); }
  .qb { padding: 2px 8px; border-radius: 999px; font-size: 10.5px; font-weight: 700; color: var(--tx1); background: var(--bg1); border: 1px solid var(--line); direction: ltr; }
  .qb:hover { border-color: var(--accent-bd); color: var(--accent); }
  .qb.instrumental { border-style: dashed; }
  .r { display: grid; grid-template-columns: 10px minmax(70px, 1fr) 92px 96px 30px auto; grid-template-areas: "d n b k l a" ". note note note note note" ". tag tag tag tag tag";
       gap: 3px 4px; align-items: center; padding: 5px 6px; border-radius: var(--r1); border: 1px solid transparent; }
  .r.sel { border-color: var(--accent-bd); background: var(--bg1); }
  .dot { grid-area: d; width: 8px; height: 8px; border-radius: 50%; background: var(--c); }
  .name { grid-area: n; direction: ltr; }
  .bars { grid-area: b; display: flex; align-items: center; gap: 2px; }
  .kind { grid-area: k; }
  .ln { grid-area: l; font-size: 10px; color: var(--tx2); text-align: center; }
  .acts { grid-area: a; display: flex; }
  .note { grid-area: note; }
  .tag { grid-area: tag; font-size: 10px; color: var(--tx2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; text-align: left; }
  .r .field { padding: 5px 6px; font-size: 11px; min-width: 0; }
  .n { width: 38px; text-align: center; }
  .sb { width: 22px; height: 24px; border-radius: var(--r1); background: var(--bg1); border: 1px solid var(--line); font-weight: 800; color: var(--tx1); }
  .sb:hover { color: var(--accent); border-color: var(--accent-bd); }
  .ib { width: 22px; height: 24px; border-radius: var(--r1); display: grid; place-items: center; color: var(--tx2); }
  .ib:hover:not(:disabled) { background: var(--bg3); color: var(--tx0); }
  .ib.del:hover { color: var(--err); }
  @media (max-width: 520px) {
    .r { grid-template-columns: 10px 1fr 92px; grid-template-areas: "d n b" ". k l" ". a a" ". note note" ". tag tag"; }
  }
</style>
