<script>
  import Icon from './Icon.svelte';
  /**
   * variant: primary | subtle | ghost | danger | suno
   * size: sm | md | lg
   */
  let {
    variant = 'subtle', size = 'md', icon = null, iconSize = null, title = '',
    disabled = false, active = false, type = 'button', href = null, target = null,
    onclick = null, children, class: cls = '',
  } = $props();
  const iSize = $derived(iconSize ?? (size === 'sm' ? 14 : size === 'lg' ? 18 : 16));
</script>

{#if href}
  <a {href} {target} rel={target === '_blank' ? 'noopener' : undefined} {title}
     class="btn {variant} {size} {cls}" class:active class:iconOnly={!children}>
    {#if icon}<Icon name={icon} size={iSize} />{/if}
    {@render children?.()}
  </a>
{:else}
  <button {type} {title} {disabled} {onclick}
          class="btn {variant} {size} {cls}" class:active class:iconOnly={!children}>
    {#if icon}<Icon name={icon} size={iSize} />{/if}
    {@render children?.()}
  </button>
{/if}

<style>
  .btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    border-radius: var(--r2); border: 1px solid transparent;
    font-weight: 600; white-space: nowrap; text-decoration: none;
    transition: background .12s, border-color .12s, color .12s, transform .08s;
    user-select: none;
  }
  .btn:active:not(:disabled) { transform: scale(.97); }
  .sm { height: 30px; padding: 0 10px; font-size: var(--fs-xs); }
  .md { height: 36px; padding: 0 12px; font-size: var(--fs-sm); }
  .lg { height: 44px; padding: 0 16px; font-size: var(--fs-md); }
  .iconOnly.sm { width: 30px; padding: 0; }
  .iconOnly.md { width: 36px; padding: 0; }
  .iconOnly.lg { width: 44px; padding: 0; }

  .subtle { background: var(--bg3); border-color: var(--line); color: var(--tx0); }
  .subtle:hover:not(:disabled) { background: var(--bg4); border-color: var(--line2); }
  .ghost { background: transparent; color: var(--tx1); }
  .ghost:hover:not(:disabled) { background: var(--bg3); color: var(--tx0); }
  .primary { background: var(--accent); color: var(--on-accent); }
  .primary:hover:not(:disabled) { background: var(--accent-2); }
  .danger { background: transparent; color: var(--err); border-color: color-mix(in srgb, var(--err) 35%, transparent); }
  .danger:hover:not(:disabled) { background: color-mix(in srgb, var(--err) 12%, transparent); }
  .suno { background: var(--suno); color: #fff; }
  .suno:hover:not(:disabled) { filter: brightness(1.08); }
  .active { background: var(--accent-bg); border-color: var(--accent-bd); color: var(--accent); }
</style>
