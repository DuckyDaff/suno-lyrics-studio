<script>
  import { song, actions } from '../../lib/song.js';
  import { homographs, kbdFor } from '../../lib/ui.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { generate, busy } from '../../lib/ai.js';
  import { genState } from '../../lib/genState.js';
  import { nikudWithHomographs, nakdan, nikudLyrics } from '../../lib/hebrew/nikud.js';
  import { settings } from '../../lib/settings.js';
  import { latinize, phonetic } from '../../lib/hebrew/translit.js';
  import { wordAtCursor } from '../../lib/hebrew/marks.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  let { sec } = $props();

  let aiOpen = $state(false);
  let toolOpen = $state(false);
  let running = $state(false);   // AI streaming
  let working = $state('');      // 'nikud' | 'latin' | 'phonetic'
  let abort = null;

  const OPS = ['write', 'continue', 'rewrite', 'rhyme', 'shorter', 'longer', 'rap', 'backing', 'polish', 'translate'];
  const getTa = () => document.querySelector(`textarea[data-sec="${sec.id}"]`);

  /* ── Hebrew tools ─────────────────────────────────────────────── */
  async function apply(kind, scope) {
    const ta = getTa();
    if (!ta) return;
    let range = null, text;
    if (scope === 'word') {
      range = wordAtCursor(ta);
      if (!range) return toast($t('toastNoWord'), 'error');
      text = range.text;
    } else {
      text = ta.value;
      if (!text.trim()) return toast($t('toastEmpty'), 'error');
    }
    working = kind;
    try {
      let out, ambiguous = [];
      if (kind === 'nikud') { const r = await nikudWithHomographs(text); out = r.text; ambiguous = r.ambiguous; }
      else if (kind === 'latin') { let src = text; try { src = await nakdan(text); } catch {} out = latinize(src); }
      else out = phonetic(text);

      if (range) ta.setRangeText(out, range.start, range.end, 'end');
      else { ta.setRangeText(out, 0, ta.value.length, 'end'); }
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      ta.focus();

      if (kind === 'nikud') {
        homographs.update(m => {
          const nm = new Map(m);
          if (ambiguous.length) nm.set(sec.id, ambiguous.map(a => ({ ...a, current: a.masc, gender: 'masc' })));
          else nm.delete(sec.id);
          return nm;
        });
        toast(ambiguous.length ? $t('toastHomographs', { n: ambiguous.length }) : $t('toastNikudDone'), 'success');
      } else toast($t(kind === 'latin' ? 'toastLatinDone' : 'toastPhoneticDone'), 'success');
    } catch (e) {
      toast($t(kind === 'nikud' ? 'toastNikudFail' : 'toastToolFail'), 'error');
    } finally { working = ''; toolOpen = false; }
  }

  /* ── AI ────────────────────────────────────────────────────────── */
  async function ai(op) {
    aiOpen = false;
    if (running) { abort?.abort(); return; }
    running = true; abort = new AbortController();
    const base = op === 'continue' ? (sec.text || '').replace(/\s+$/, '') : '';
    const lang = /[א-ת]/.test(sec.text || $song.sections.map(s => s.text).join('')) ? 'Hebrew' : 'English';
    try {
      const r = await generate(
        { mode: 'section', op, section: sec.name, section_text: sec.text, language: lang,
          ...($genState.musicOn ? { music: { ...$genState.music, bars: [] }, bars: $genState.music.bars.find(r => r.name.toLowerCase() === sec.name.split(':')[0].trim().toLowerCase())?.bars } : {}) },
        (_, full) => actions.setText(sec.id, base ? `${base}\n${full}` : full),
        { signal: abort.signal }
      );
      let out = base ? `${base}\n${r.text}` : r.text;
      if ($settings.autoNikud && /[א-ת]/.test(r.text) && op !== 'translate' && op !== 'backing') {
        working = 'nikud';
        try { out = base ? `${base}\n${await nikudLyrics(r.text)}` : await nikudLyrics(r.text); } catch {}
        finally { working = ''; }
        actions.setText(sec.id, out);
      }
      toast($t('aiDone'), 'success');
    } catch (e) {
      if (e.code !== 'aborted') toast($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error'), 'error');
    } finally { running = false; }
  }

  function clickOutside(node) {
    const h = e => { if (!node.contains(e.target)) { aiOpen = false; toolOpen = false; } };
    document.addEventListener('pointerdown', h, true);
    return { destroy: () => document.removeEventListener('pointerdown', h, true) };
  }
  const kbdOn = $derived($kbdFor === sec.id);
</script>

<div class="tools" role="toolbar" tabindex="-1" use:clickOutside onmousedown={e => { if (!e.target.closest('.menu')) e.preventDefault(); }}>
  <div class="wrap">
    <Button size="sm" variant={running ? 'danger' : 'primary'} icon={running ? 'x' : 'sparkles'}
            onclick={() => running ? ai() : (aiOpen = !aiOpen, toolOpen = false)} disabled={$busy && !running}>
      {running ? $t('aiStop') : 'AI'}
    </Button>
    {#if aiOpen}
      <div class="menu two">{#each OPS as op}<button onclick={() => ai(op)}>{$t('aiOp_' + op)}</button>{/each}</div>
    {/if}
  </div>
  <span class="sep"></span>

  <Button size="sm" variant="ghost" title={$t('nikudWordTitle')} disabled={!!working} onclick={() => apply('nikud', 'word')}>
    <span class="mono">{working === 'nikud' ? '…' : 'נ׳'}</span> {$t('toolNikud')}
  </Button>
  <Button size="sm" variant="ghost" title={$t('latinWordTitle')} disabled={!!working} onclick={() => apply('latin', 'word')}>
    <span class="mono">{working === 'latin' ? '…' : 'Aa'}</span> {$t('toolLatin')}
  </Button>
  <Button size="sm" variant="ghost" title={$t('phoneticWordTitle')} disabled={!!working} onclick={() => apply('phonetic', 'word')}>
    <span class="mono">/ˈ/</span> {$t('toolPhonetic')}
  </Button>

  <div class="wrap">
    <Button size="sm" variant="ghost" icon="chevronDown" title={$t('menuSection')} onclick={() => (toolOpen = !toolOpen, aiOpen = false)} />
    {#if toolOpen}
      <div class="menu">
        <div class="mh">{$t('menuSection')}</div>
        <button onclick={() => apply('nikud', 'all')}>נ׳ {$t('toolNikud')}</button>
        <button onclick={() => apply('latin', 'all')}>Aa {$t('toolLatin')}</button>
        <button onclick={() => apply('phonetic', 'all')}>/ˈ/ {$t('toolPhonetic')}</button>
      </div>
    {/if}
  </div>

  <Button size="sm" variant="ghost" icon="keyboard" active={kbdOn} title={$t('toolKeyboard')}
          onclick={() => kbdFor.set(kbdOn ? null : sec.id)}>{$t('toolKeyboard')}</Button>
</div>

<style>
  .tools { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--line2); }
  .sep { width: 1px; height: 18px; background: var(--line2); margin: 0 4px; }
  .wrap { position: relative; }
  .menu {
    position: absolute; top: calc(100% + 4px); inset-inline-start: 0; z-index: 60; min-width: 170px;
    background: var(--bg2); border: 1px solid var(--line2); border-radius: var(--r2); box-shadow: var(--shadow);
    padding: 4px; display: flex; flex-direction: column; gap: 2px;
  }
  .menu.two { display: grid; grid-template-columns: 1fr 1fr; min-width: 200px; }
  .menu button { padding: 8px 10px; border-radius: var(--r1); font-size: var(--fs-xs); font-weight: 600; color: var(--tx0); text-align: start; }
  .menu button:hover { background: var(--bg3); color: var(--accent); }
  .mh { font-size: 10px; font-weight: 700; color: var(--tx2); padding: 4px 10px 2px; letter-spacing: .05em; }
</style>
