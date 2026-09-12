<script>
  import { toasts } from '../../lib/toast.js';
  import { fly } from 'svelte/transition';
</script>

<div class="wrap" aria-live="polite">
  {#each $toasts as t (t.id)}
    <div class="toast {t.type}" transition:fly={{ y: 16, duration: 180 }}>{t.message}</div>
  {/each}
</div>

<style>
  .wrap {
    position: fixed; inset-inline: 0; bottom: calc(var(--export-h) + 14px);
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    pointer-events: none; z-index: 500;
  }
  @media (max-width: 768px) { .wrap { bottom: calc(var(--tabs-h) + 14px); } }
  .toast {
    background: var(--bg3); color: var(--tx0);
    border: 1px solid var(--line2); border-radius: var(--r2);
    padding: 9px 16px; font-size: var(--fs-sm); font-weight: 600;
    box-shadow: var(--shadow); max-width: min(92vw, 420px); text-align: center;
  }
  .success { border-color: color-mix(in srgb, var(--ok) 45%, transparent); color: var(--ok); }
  .error   { border-color: color-mix(in srgb, var(--err) 45%, transparent); color: var(--err); }
</style>
