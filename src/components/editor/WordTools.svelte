<script>
  import { song, actions } from '../../lib/song.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import { generate, busy } from '../../lib/ai.js';
  import Button from '../ui/Button.svelte';
  import Icon from '../ui/Icon.svelte';

  let { sec } = $props();
  const soon = () => toast($t('toolsHint'));

  let menuOpen = $state(false);
  let running = $state(false);
  let abort = null;

  const OPS = ['write', 'continue', 'rewrite', 'rhyme', 'shorter', 'longer', 'rap', 'backing', 'polish', 'translate'];

  async function ai(op) {
    menuOpen = false;
    if (running) { abort?.abort(); return; }
    running = true; abort = new AbortController();
    const base = op === 'continue' ? (sec.text || '').replace(/\s+$/, '') : '';
    const lang = /[֐-׿]/.test(sec.text || $song.sections.map(s => s.text).join('')) ? 'Hebrew' : 'English';
    try {
      await generate(
        { mode: 'section', op, section: sec.name, section_text: sec.text, language: lang },
        (_, full) => actions.setText(sec.id, base ? `${base}\n${full}` : full),
        { signal: abort.signal }
      );
      toast($t('aiDone'), 'success');
    } catch (e) {
      if (e.code !== 'aborted') toast($t('aiErr_' + e.code) !== 'aiErr_' + e.code ? $t('aiErr_' + e.code) : $t('aiErr_api_error'), 'error');
    } finally { running = false; }
  }

  function clickOutside(node) {
    const h = e => { if (!node.contains(e.target)) menuOpen = false; };
    document.addEventListener('pointerdown', h, true);
    return { destroy: () => document.removeEventListener('pointerdown', h, true) };
  }
</script>

<div class="tools" role="toolbar" tabindex="-1" onmousedown={e => { if (!e.target.closest('.menu')) e.preventDefault(); }}>
  <div class="aiWrap" use:clickOutside>
    <Button size="sm" variant={running ? 'danger' : 'primary'} icon={running ? 'x' : 'sparkles'}
            onclick={() => running ? ai() : (menuOpen = !menuOpen)} disabled={$busy && !running}>
      {running ? $t('aiStop') : 'AI'}
    </Button>
    {#if menuOpen}
      <div class="menu">
        {#each OPS as op}
          <button onclick={() => ai(op)}>{$t('aiOp_' + op)}</button>
        {/each}
      </div>
    {/if}
  </div>
  <span class="sep"></span>
  <Button size="sm" variant="ghost" onclick={soon}><span class="mono">נ׳</span> {$t('toolNikud')}</Button>
  <Button size="sm" variant="ghost" onclick={soon}><span class="mono">Aa</span> {$t('toolLatin')}</Button>
  <Button size="sm" variant="ghost" onclick={soon}><span class="mono">/ˈ/</span> {$t('toolPhonetic')}</Button>
  <Button size="sm" variant="ghost" icon="keyboard" onclick={soon}>{$t('toolKeyboard')}</Button>
</div>

<style>
  .tools { display: flex; align-items: center; gap: 2px; flex-wrap: wrap; margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--line2); }
  .sep { width: 1px; height: 18px; background: var(--line2); margin: 0 4px; }
  .aiWrap { position: relative; }
  .menu {
    position: absolute; top: calc(100% + 4px); inset-inline-start: 0; z-index: 60; min-width: 190px;
    background: var(--bg2); border: 1px solid var(--line2); border-radius: var(--r2); box-shadow: var(--shadow);
    padding: 4px; display: grid; grid-template-columns: 1fr 1fr; gap: 2px;
  }
  .menu button { padding: 8px 10px; border-radius: var(--r1); font-size: var(--fs-xs); font-weight: 600; color: var(--tx0); text-align: start; }
  .menu button:hover { background: var(--bg3); color: var(--accent); }
</style>
