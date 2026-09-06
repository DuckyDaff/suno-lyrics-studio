<script>
  import { settings, setSetting } from '../../lib/settings.js';
  import { SUNO_VERSIONS } from '../../lib/suno.js';
  import { user, logout } from '../../lib/auth.js';
  import { t } from '../../lib/i18n.js';
  import Button from '../ui/Button.svelte';

  const themes = $derived([
    { id: 'dark', label: $t('dark') }, { id: 'light', label: $t('light') }, { id: 'system', label: $t('system') },
  ]);
</script>

<div class="page">
  <h1>{$t('settingsTitle')}</h1>

  <section class="card">
    <h3>{$t('appearance')}</h3>
    <div class="seg">
      {#each themes as th}
        <button class:active={$settings.theme === th.id} onclick={() => setSetting('theme', th.id)}>{th.label}</button>
      {/each}
    </div>
    <h3>{$t('language')}</h3>
    <div class="seg">
      <button class:active={$settings.lang === 'he'} onclick={() => setSetting('lang', 'he')}>עברית</button>
      <button class:active={$settings.lang === 'en'} onclick={() => setSetting('lang', 'en')}>English</button>
    </div>
  </section>

  <section class="card">
    <h3>{$t('sunoVersion')}</h3>
    <p class="faint">{$t('sunoVersionHint')}</p>
    <div class="seg">
      {#each SUNO_VERSIONS as v}
        <button class:active={$settings.sunoVersion === v.id} onclick={() => setSetting('sunoVersion', v.id)}>
          {v.label}<small>{v.style} / {v.lyrics}</small>
        </button>
      {/each}
    </div>
  </section>

  <section class="card">
    <h3>{$t('account')}</h3>
    <p>{$t('signedInAs')} <b>{$user?.username}</b> {#if $user?.role === 'admin'}<span class="adm">admin</span>{/if}</p>
    <Button variant="danger" icon="logout" onclick={logout}>{$t('logout')}</Button>
  </section>

  <p class="faint ver">MeloDraft v2 · {$t('version')} 2.0.0-phase1</p>
</div>

<style>
  .page { max-width: 640px; margin: 0 auto; padding: 24px 20px 40px; display: flex; flex-direction: column; gap: 16px; }
  h1 { font-size: var(--fs-xl); }
  .card { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
  h3 { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg button {
    flex: 1; min-width: 90px; padding: 10px 12px; border-radius: var(--r2); background: var(--bg2);
    border: 1px solid var(--line); color: var(--tx1); font-weight: 600; display: flex; flex-direction: column; align-items: center; gap: 2px;
  }
  .seg button small { font-family: var(--font-mono); font-size: 10px; color: var(--tx2); }
  .seg button.active { background: var(--accent-bg); border-color: var(--accent-bd); color: var(--accent); }
  .adm { font-size: 10px; font-weight: 700; color: var(--warn); margin-inline-start: 6px; }
  .ver { font-size: var(--fs-xs); text-align: center; }
</style>
