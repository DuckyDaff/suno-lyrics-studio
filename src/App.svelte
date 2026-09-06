<script>
  import { onMount } from 'svelte';
  import { user, verify } from './lib/auth.js';
  import { settings } from './lib/settings.js';
  import { lang, dir, t } from './lib/i18n.js';
  import { restoredFromSave } from './lib/song.js';
  import { toast } from './lib/toast.js';
  import Shell from './components/layout/Shell.svelte';
  import Login from './components/views/Login.svelte';
  import Toast from './components/ui/Toast.svelte';

  onMount(() => {
    verify();
    if ($user && restoredFromSave) setTimeout(() => toast($t('toastRestored')), 500);
  });

  $effect(() => {
    let theme = $settings.theme;
    if (theme === 'system') theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = $lang;
    document.documentElement.dir = $dir;
  });
</script>

{#if $user}
  <Shell />
{:else}
  <Login />
{/if}
<Toast />
