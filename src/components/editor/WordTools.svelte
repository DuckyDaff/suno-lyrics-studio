<script>
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';
  let { sec } = $props();
  const soon = () => toast($t('toolsHint'));
</script>

<!-- Phase 2 will wire nikud / latin / phonetic / nikud-keyboard here -->
<div class="tools" role="toolbar" tabindex="-1" onmousedown={e => e.preventDefault()}>
  <Button size="sm" variant="ghost" onclick={soon}><span class="mono">נ׳</span> {$t('toolNikud')}</Button>
  <Button size="sm" variant="ghost" onclick={soon}><span class="mono">Aa</span> {$t('toolLatin')}</Button>
  <Button size="sm" variant="ghost" onclick={soon}><span class="mono">/ˈ/</span> {$t('toolPhonetic')}</Button>
  <Button size="sm" variant="ghost" icon="keyboard" onclick={soon}>{$t('toolKeyboard')}</Button>
  <span class="soon">{$t('comingSoon')}</span>
</div>

<style>
  .tools {
    display: flex; align-items: center; gap: 2px; flex-wrap: wrap;
    margin-top: 6px; padding-top: 8px; border-top: 1px dashed var(--line2);
  }
  .soon { margin-inline-start: auto; font-size: 10px; font-weight: 700; color: var(--tx2); text-transform: uppercase; letter-spacing: .08em; }
</style>
