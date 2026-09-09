<script>
  /**
   * Floating per-letter nikud picker. Props: ta (textarea), hit (from letterAtCaret), onclose().
   */
  import { VOWELS, HATAFS, compose, writeMarks, caretCoords, isGuttural, isShin, isVav, canDagesh } from '../../lib/hebrew/letterNikud.js';
  import { lang, t } from '../../lib/i18n.js';

  let { ta, hit: initial, onclose } = $props();
  let hit = $state(initial);
  $effect(() => { hit = initial; });

  const pos = $derived.by(() => {
    if (!ta) return { top: 0, left: 0 };
    const c = caretCoords(ta, hit.index);
    return { top: ta.offsetTop + c.top + c.height + 4, left: ta.offsetLeft + c.left };
  });

  const base = $derived({ dagesh: hit.dagesh, shin: hit.shin, sin: hit.sin, other: hit.other });
  const glyph = m => hit.letter + m;
  const nm = v => ($lang === 'he' ? v.name : v.en);

  function set(patch) { hit = writeMarks(ta, hit, compose({ ...base, vowel: hit.vowel, ...patch })); ta.focus(); }
  function clear() { hit = writeMarks(ta, hit, ''); ta.focus(); }

  // shuruk = vav + dagesh, offered as a vowel for vav
  const vowels = $derived(isVav(hit.letter)
    ? [...VOWELS.filter(v => v.ch !== 'ֻ'), { ch: 'וֹ', name: 'חולם מלא', en: 'holam male', special: 'holam' }, { ch: 'וּ', name: 'שורוק', en: 'shuruk', special: 'shuruk' }]
    : VOWELS);
  function pick(v) {
    if (v.special === 'shuruk') return set({ vowel: '', dagesh: true });
    if (v.special === 'holam') return set({ vowel: 'ֹ', dagesh: false });
    set({ vowel: v.ch, ...(isVav(hit.letter) ? { dagesh: false } : {}) });
  }
  const isOn = v => v.special === 'shuruk' ? (hit.dagesh && !hit.vowel) : v.special === 'holam' ? (hit.vowel === 'ֹ') : (hit.vowel === v.ch && !(isVav(hit.letter) && hit.dagesh && !v.ch));
</script>

<div class="pop" style="top:{pos.top}px; left:{Math.max(4, Math.min(pos.left - 120, (ta?.clientWidth || 400) - 300))}px"
     role="dialog" tabindex="-1" onmousedown={e => e.preventDefault()} onkeydown={e => { if (e.key === 'Escape') onclose(); }}>
  <div class="hd"><span class="big">{glyph(hit.marks)}</span><span class="lbl">{$t('nikudPopTitle')}</span><button class="x" onclick={onclose}>✕</button></div>
  <div class="row">
    {#each vowels as v}
      <button class="k" class:on={isOn(v)} title={nm(v)} onclick={() => pick(v)}>
        <span class="g">{v.special ? v.ch : glyph(compose({ ...base, vowel: v.ch }))}</span><span class="n">{nm(v)}</span>
      </button>
    {/each}
  </div>
  {#if isGuttural(hit.letter)}
    <div class="row">
      {#each HATAFS as v}
        <button class="k" class:on={hit.vowel === v.ch} title={nm(v)} onclick={() => set({ vowel: v.ch })}>
          <span class="g">{glyph(compose({ ...base, vowel: v.ch }))}</span><span class="n">{nm(v)}</span>
        </button>
      {/each}
    </div>
  {/if}
  <div class="row">
    {#if canDagesh(hit.letter)}
      <button class="k" class:on={hit.dagesh} onclick={() => set({ dagesh: !hit.dagesh })}>
        <span class="g">{glyph(compose({ ...base, vowel: hit.vowel, dagesh: !hit.dagesh }))}</span><span class="n">{$lang === 'he' ? 'דגש' : 'dagesh'}</span>
      </button>
    {/if}
    {#if isShin(hit.letter)}
      <button class="k" class:on={hit.shin} onclick={() => set({ shin: !hit.shin, sin: false })}><span class="g">{glyph(compose({ ...base, vowel: hit.vowel, shin: true, sin: false }))}</span><span class="n">{$lang === 'he' ? 'שׁין' : 'shin'}</span></button>
      <button class="k" class:on={hit.sin} onclick={() => set({ sin: !hit.sin, shin: false })}><span class="g">{glyph(compose({ ...base, vowel: hit.vowel, sin: true, shin: false }))}</span><span class="n">{$lang === 'he' ? 'שׂין' : 'sin'}</span></button>
    {/if}
    <button class="k del" onclick={clear}><span class="g">{hit.letter}</span><span class="n">{$t('kbdDelete')}</span></button>
  </div>
</div>

<style>
  .pop {
    position: absolute; z-index: 40; width: 300px; max-width: calc(100% - 8px);
    padding: 8px; border-radius: var(--r2); background: var(--bg1); border: 1px solid var(--line2); box-shadow: var(--shadow);
    display: flex; flex-direction: column; gap: 5px; direction: rtl;
  }
  .hd { display: flex; align-items: center; gap: 8px; }
  .big { font-size: 26px; line-height: 1.1; font-family: 'David Libre', 'Frank Ruehl CLM', 'Noto Serif Hebrew', serif; color: var(--accent); min-width: 28px; text-align: center; }
  .lbl { flex: 1; font-size: 11px; color: var(--tx2); }
  .x { color: var(--tx2); padding: 2px 6px; }
  .row { display: flex; flex-wrap: wrap; gap: 3px; }
  .k {
    display: flex; flex-direction: column; align-items: center; min-width: 40px; padding: 2px 4px;
    border-radius: var(--r1); border: 1px solid var(--line); background: var(--bg2); color: var(--tx0);
    font-family: 'David Libre', 'Frank Ruehl CLM', 'Noto Serif Hebrew', serif;
  }
  .k:hover { border-color: var(--accent); color: var(--accent); }
  .k.on { border-color: var(--accent); background: var(--accent-bg); color: var(--accent); }
  .g { font-size: 22px; line-height: 1.2; }
  .n { font-size: 9px; font-family: var(--font-ui); color: var(--tx2); white-space: nowrap; }
  .del { color: var(--err); }
  @media (max-width: 768px) { .k { min-width: 44px; } .g { font-size: 24px; } }
</style>
