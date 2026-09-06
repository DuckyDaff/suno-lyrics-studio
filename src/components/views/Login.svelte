<script>
  import { login, register } from '../../lib/auth.js';
  import { t } from '../../lib/i18n.js';
  import Button from '../ui/Button.svelte';

  let mode = $state('login');
  let username = $state('');
  let password = $state('');
  let email = $state('');
  let error = $state('');
  let busy = $state(false);

  async function submit(e) {
    e.preventDefault();
    error = ''; busy = true;
    try {
      mode === 'login' ? await login(username.trim(), password) : await register(username.trim(), password, email.trim());
    } catch (err) { error = err.message || $t('loginError'); }
    busy = false;
  }
</script>

<div class="wrap">
  <form class="card" onsubmit={submit}>
    <img src="/icon-192.png" alt="" width="64" height="64" />
    <h1>MeloDraft</h1>
    <h2>{$t(mode === 'login' ? 'loginTitle' : 'registerTitle')}</h2>

    <input class="field" placeholder={$t('username')} bind:value={username} autocomplete="username" required />
    {#if mode === 'register'}
      <input class="field" type="email" placeholder={$t('email')} bind:value={email} autocomplete="email" required />
    {/if}
    <input class="field" type="password" placeholder={$t('password')} bind:value={password}
           autocomplete={mode === 'login' ? 'current-password' : 'new-password'} required />

    {#if error}<p class="err">{error}</p>{/if}

    <Button type="submit" variant="primary" size="lg" disabled={busy}>{$t(mode === 'login' ? 'loginBtn' : 'registerBtn')}</Button>
    <button type="button" class="switch" onclick={() => { mode = mode === 'login' ? 'register' : 'login'; error = ''; }}>
      {$t(mode === 'login' ? 'noAccount' : 'haveAccount')} <b>{$t(mode === 'login' ? 'registerBtn' : 'loginBtn')}</b>
    </button>
  </form>
</div>

<style>
  .wrap { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
  .card {
    width: min(380px, 100%); display: flex; flex-direction: column; gap: 12px; align-items: stretch;
    background: var(--bg1); border: 1px solid var(--line); border-radius: var(--r4); padding: 32px 28px;
    box-shadow: var(--shadow);
  }
  img { border-radius: 16px; align-self: center; }
  h1 { text-align: center; font-size: var(--fs-xl); letter-spacing: .02em; }
  h2 { text-align: center; font-size: var(--fs-sm); color: var(--tx1); font-weight: 500; margin-bottom: 8px; }
  .err { color: var(--err); font-size: var(--fs-sm); text-align: center; }
  .switch { color: var(--tx1); font-size: var(--fs-sm); margin-top: 4px; }
  .switch b { color: var(--accent); }
</style>
