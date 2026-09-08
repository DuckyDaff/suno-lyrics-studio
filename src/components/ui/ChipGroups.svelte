<script>
  import Icon from './Icon.svelte';
  import { t } from '../../lib/i18n.js';

  /**
   * groups:   [{ name, color, items: string[] }]
   * query:    filter string (forces all matching groups open)
   * isActive: item => boolean   (highlight)
   * onpick:   (item, group) => void
   * mono:     render chips in monospace (bracket tags)
   */
  let { groups = [], query = '', isActive = () => false, onpick, mono = false, openFirst = false } = $props();

  let open = $state(new Set());
  let initialised = $state(false);
  $effect(() => {
    if (!initialised && groups.length) { open = new Set(openFirst ? [groups[0].name] : []); initialised = true; }
  });

  const q = $derived(query.trim().toLowerCase());
  const visible = $derived(
    groups.map(g => ({ ...g, items: q ? g.items.filter(i => i.toLowerCase().includes(q)) : g.items }))
          .filter(g => g.items.length)
  );
  const isOpen = name => !!q || open.has(name);
  function toggle(name) {
    const n = new Set(open);
    n.has(name) ? n.delete(name) : n.add(name);
    open = n;
  }
</script>

{#if !visible.length}
  <div class="empty"><Icon name="search" size={20} /><span>{$t('noResults')}</span></div>
{/if}

{#each visible as g (g.name)}
  <section class="grp" style="--c:{g.color}">
    <button class="hd" onclick={() => toggle(g.name)} aria-expanded={isOpen(g.name)}>
      <span class="dot"></span>
      <span class="name">{g.name}</span>
      <span class="count">{g.items.length}</span>
      <span class="chev" class:open={isOpen(g.name)}><Icon name="chevronDown" size={14} /></span>
    </button>
    {#if isOpen(g.name)}
      <div class="chips">
        {#each g.items as item (item)}
          <button class="chip" class:mono class:on={isActive(item)}
                  onmousedown={e => e.preventDefault()} onclick={() => onpick?.(item, g)}>{item}</button>
        {/each}
      </div>
    {/if}
  </section>
{/each}

<style>
  .grp { border-bottom: 1px solid var(--line); }
  .hd {
    width: 100%; display: flex; align-items: center; gap: 8px; padding: 9px 12px;
    font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); text-align: start;
  }
  .hd:hover { background: var(--bg2); color: var(--tx0); }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--c); flex-shrink: 0; }
  .name { flex: 1; }
  .count { font-family: var(--font-mono); font-size: 10px; color: var(--tx2); }
  .chev { color: var(--tx2); transition: transform .15s; display: flex; }
  .chev.open { transform: rotate(180deg); }
  .chips { display: flex; flex-wrap: wrap; gap: 5px; padding: 2px 12px 12px; }
  .chip {
    padding: 4px 10px; border-radius: 999px; font-size: var(--fs-xs); font-weight: 600;
    background: var(--bg2); border: 1px solid var(--line); color: var(--tx1); direction: ltr;
    transition: all .1s; max-width: 100%; text-align: left;
  }
  .chip.mono { font-family: var(--font-mono); border-radius: var(--r1); }
  .chip:hover { border-color: var(--c); color: var(--tx0); background: color-mix(in srgb, var(--c) 10%, var(--bg2)); }
  .chip:active { transform: scale(.96); }
  .chip.on { background: color-mix(in srgb, var(--c) 18%, var(--bg2)); border-color: var(--c); color: var(--tx0); }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 36px 16px; color: var(--tx2); font-size: var(--fs-sm); }
  @media (max-width: 768px) { .chip { padding: 7px 12px; font-size: var(--fs-sm); } }
</style>
