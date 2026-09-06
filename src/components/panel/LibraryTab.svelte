<script>
  import { t } from '../../lib/i18n.js';
  import Icon from '../ui/Icon.svelte';
</script>

<div class="tab">
  <div class="search">
    <Icon name="search" size={15} />
    <input class="field" placeholder={$t('librarySearch')} disabled />
  </div>
  <div class="empty">
    <Icon name="library" size={28} />
    <p>{$t('libraryComing')}</p>
  </div>
</div>

<style>
  .tab { padding: 14px; display: flex; flex-direction: column; gap: 16px; }
  .search { position: relative; color: var(--tx2); }
  .search :global(svg) { position: absolute; inset-inline-start: 12px; top: 50%; transform: translateY(-50%); }
  .search input { padding-inline-start: 36px; }
  .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 40px 16px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); line-height: 1.6; }
</style>
