<script>
  import { t } from '../../lib/i18n.js';
  import Icon from '../ui/Icon.svelte';
</script>

<div class="empty">
  <Icon name="sliders" size={28} />
  <p>{$t('studioComing')}</p>
</div>

<style>
  .empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 48px 20px; color: var(--tx2); text-align: center; font-size: var(--fs-sm); line-height: 1.6; }
</style>
