<script>
  import { settings, setSetting } from '../../lib/settings.js';
  import { ENGINES, DEFAULTS, testConnection, listModels, detectNodes } from '../../lib/comfy.js';
  import { t } from '../../lib/i18n.js';
  import { toast } from '../../lib/toast.js';
  import Button from '../ui/Button.svelte';

  let status = $state('');      // '' | 'ok' | 'cors' | 'unreachable' | 'http'
  let info = $state(null);
  let models = $state(null);
  let testing = $state(false);

  const eng = $derived($settings.comfyEngine || 'sdxl');
  const model = (e, k) => (($settings.comfyModels || {})[e] || {})[k] ?? DEFAULTS[e]?.[k];
  function setModel(e, k, v) { const all = { ...($settings.comfyModels || {}) }; all[e] = { ...(all[e] || {}), [k]: v }; setSetting('comfyModels', all); }

  async function test() {
    testing = true; status = ''; info = null;
    try { info = await testConnection($settings.comfyUrl); status = 'ok'; models = await listModels($settings.comfyUrl); }
    catch (e) { status = e.code === 'cors' ? 'cors' : e.code === 'unreachable' ? 'unreachable' : 'http'; }
    testing = false;
  }
  const origin = $derived(location.origin);
  const cmd = $derived(`python main.py --enable-cors-header "${origin}"`);

  let custom = $derived($settings.comfyCustom || null);
  let det = $derived(custom?.json ? detectNodes(custom.json) : null);
  async function loadWorkflow(e) {
    const f = e.target.files?.[0]; if (!f) return; e.target.value = '';
    try {
      const json = JSON.parse(await f.text());
      if (json.nodes && json.links) return toast($t('comfyUiFormat'), 'error', 7000);
      const d = detectNodes(json);
      if (!d.ok) return toast($t('comfyNoPrompt'), 'error', 6000);
      setSetting('comfyCustom', { name: f.name, json, pos: d.pos, neg: d.neg, setSize: !!d.size });
      setSetting('comfyEngine', 'custom');
      toast($t('comfyLoaded'), 'success');
    } catch { toast($t('comfyBadJson'), 'error'); }
  }
  const opt = (list, cur) => (list && list.length ? (list.includes(cur) ? list : [cur, ...list]) : [cur]);
</script>

<section class="card">
  <h3>🖼️ {$t('comfyTitle')}</h3>
  <p class="faint">{$t('comfyWhy')}</p>

  <div class="row">
    <input class="field" dir="ltr" value={$settings.comfyUrl || 'http://127.0.0.1:8188'} onchange={e => setSetting('comfyUrl', e.target.value.trim())} placeholder="http://127.0.0.1:8188" />
    <Button size="sm" onclick={test} disabled={testing}>{testing ? '…' : $t('comfyTest')}</Button>
  </div>
  {#if status === 'ok'}<p class="ok">✓ ComfyUI {info?.version}{#if info?.gpu} · {info.gpu}{/if}</p>
  {:else if status === 'cors'}<p class="bad">{$t('comfyCors')}</p>
  {:else if status === 'unreachable'}<p class="bad">{$t('comfyUnreachable')}</p>
  {:else if status === 'http'}<p class="bad">{$t('comfyHttp')}</p>{/if}

  <details class="help" open={status === 'cors'}>
    <summary>{$t('comfySetup')}</summary>
    <p class="faint small">{$t('comfySetupText')}</p>
    <pre class="mono cmd" dir="ltr">{cmd}</pre>
    <p class="faint small">{$t('comfySetupNote')}</p>
  </details>

  <h4>{$t('comfyEngine')}</h4>
  <div class="seg">
    {#each ENGINES as e}<button class:active={eng === e.id} onclick={() => setSetting('comfyEngine', e.id)}>{e.label}</button>{/each}
  </div>

  {#if eng === 'sdxl'}
    <label class="lbl">{$t('comfyCheckpoint')}
      <select class="field" dir="ltr" value={model('sdxl', 'ckpt')} onchange={e => setModel('sdxl', 'ckpt', e.target.value)}>{#each opt(models?.ckpt, model('sdxl', 'ckpt')) as m}<option value={m}>{m}</option>{/each}</select></label>
    <div class="row3">
      <label class="lbl">Steps <input class="field" type="number" min="4" max="80" value={model('sdxl', 'steps')} onchange={e => setModel('sdxl', 'steps', +e.target.value)} /></label>
      <label class="lbl">CFG <input class="field" type="number" step="0.5" min="1" max="15" value={model('sdxl', 'cfg')} onchange={e => setModel('sdxl', 'cfg', +e.target.value)} /></label>
    </div>
  {:else if eng === 'flux'}
    <label class="lbl">UNET <select class="field" dir="ltr" value={model('flux', 'unet')} onchange={e => setModel('flux', 'unet', e.target.value)}>{#each opt(models?.unet, model('flux', 'unet')) as m}<option value={m}>{m}</option>{/each}</select></label>
    <div class="row3">
      <label class="lbl">T5 <select class="field" dir="ltr" value={model('flux', 'clip1')} onchange={e => setModel('flux', 'clip1', e.target.value)}>{#each opt(models?.clip, model('flux', 'clip1')) as m}<option value={m}>{m}</option>{/each}</select></label>
      <label class="lbl">CLIP-L <select class="field" dir="ltr" value={model('flux', 'clip2')} onchange={e => setModel('flux', 'clip2', e.target.value)}>{#each opt(models?.clip, model('flux', 'clip2')) as m}<option value={m}>{m}</option>{/each}</select></label>
      <label class="lbl">VAE <select class="field" dir="ltr" value={model('flux', 'vae')} onchange={e => setModel('flux', 'vae', e.target.value)}>{#each opt(models?.vae, model('flux', 'vae')) as m}<option value={m}>{m}</option>{/each}</select></label>
    </div>
    <div class="row3">
      <label class="lbl">Steps <input class="field" type="number" min="4" max="50" value={model('flux', 'steps')} onchange={e => setModel('flux', 'steps', +e.target.value)} /></label>
      <label class="lbl">Guidance <input class="field" type="number" step="0.5" min="1" max="10" value={model('flux', 'guidance')} onchange={e => setModel('flux', 'guidance', +e.target.value)} /></label>
    </div>
  {:else if eng === 'qwen'}
    <label class="lbl">UNET <select class="field" dir="ltr" value={model('qwen', 'unet')} onchange={e => setModel('qwen', 'unet', e.target.value)}>{#each opt(models?.unet, model('qwen', 'unet')) as m}<option value={m}>{m}</option>{/each}</select></label>
    <div class="row3">
      <label class="lbl">CLIP <select class="field" dir="ltr" value={model('qwen', 'clip')} onchange={e => setModel('qwen', 'clip', e.target.value)}>{#each opt(models?.clip, model('qwen', 'clip')) as m}<option value={m}>{m}</option>{/each}</select></label>
      <label class="lbl">VAE <select class="field" dir="ltr" value={model('qwen', 'vae')} onchange={e => setModel('qwen', 'vae', e.target.value)}>{#each opt(models?.vae, model('qwen', 'vae')) as m}<option value={m}>{m}</option>{/each}</select></label>
    </div>
    <div class="row3">
      <label class="lbl">Steps <input class="field" type="number" min="4" max="50" value={model('qwen', 'steps')} onchange={e => setModel('qwen', 'steps', +e.target.value)} /></label>
      <label class="lbl">CFG <input class="field" type="number" step="0.5" min="1" max="10" value={model('qwen', 'cfg')} onchange={e => setModel('qwen', 'cfg', +e.target.value)} /></label>
    </div>
  {:else}
    <p class="faint small">{$t('comfyCustomHint')}</p>
    <label class="upl"><input type="file" accept=".json,application/json" onchange={loadWorkflow} />📄 {custom?.name ? custom.name : $t('comfyCustomLoad')}</label>
    {#if det}
      <div class="det">
        <label class="lbl">{$t('comfyPosNode')} <select class="field" dir="ltr" value={custom.pos} onchange={e => setSetting('comfyCustom', { ...custom, pos: e.target.value })}>{#each det.options as o}<option value={o.id}>{o.label} — {o.preview}</option>{/each}</select></label>
        <label class="lbl">{$t('comfyNegNode')} <select class="field" dir="ltr" value={custom.neg || ''} onchange={e => setSetting('comfyCustom', { ...custom, neg: e.target.value || null })}><option value="">—</option>{#each det.options as o}<option value={o.id}>{o.label} — {o.preview}</option>{/each}</select></label>
        <p class="faint small">{$t('comfyDetected', { seed: det.seed.length, size: det.size ? '✓' : '✗', save: det.save ? '✓' : '+' })}</p>
      </div>
    {/if}
  {/if}

  <label class="lbl">{$t('comfySize')}
    <select class="field" value={$settings.comfySize || ''} onchange={e => setSetting('comfySize', e.target.value ? +e.target.value : null)}>
      <option value="">{$t('comfySizeAuto')}</option>
      {#each [768, 1024, 1152, 1328, 1536] as s}<option value={s}>{s} × {s}</option>{/each}
    </select></label>
</section>

<style>
  .card { padding: 18px; display: flex; flex-direction: column; gap: 10px; }
  h3 { font-size: var(--fs-sm); font-weight: 700; color: var(--tx1); }
  h4 { font-size: var(--fs-xs); font-weight: 700; color: var(--tx2); margin-top: 6px; }
  .row { display: flex; gap: 8px; align-items: center; }
  .row .field { flex: 1; }
  .row3 { display: flex; gap: 8px; flex-wrap: wrap; }
  .row3 .lbl { flex: 1; min-width: 140px; }
  .field { padding: 7px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx0); font-size: var(--fs-sm); width: 100%; }
  .lbl { display: flex; flex-direction: column; gap: 4px; font-size: var(--fs-xs); color: var(--tx1); }
  .ok { color: var(--ok); font-size: var(--fs-sm); font-weight: 700; }
  .bad { color: var(--err); font-size: var(--fs-sm); font-weight: 700; line-height: 1.5; }
  .help summary { cursor: pointer; font-size: var(--fs-sm); font-weight: 700; color: var(--accent); }
  .cmd { padding: 8px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); font-size: var(--fs-xs); white-space: pre-wrap; word-break: break-all; text-align: left; margin: 6px 0; user-select: all; }
  .small { font-size: var(--fs-xs); line-height: 1.5; }
  .seg { display: flex; gap: 6px; flex-wrap: wrap; }
  .seg button { flex: 1; min-width: 90px; padding: 8px 10px; border-radius: var(--r2); background: var(--bg2); border: 1px solid var(--line); color: var(--tx1); font-weight: 600; }
  .seg button.active { background: var(--accent-bg); border-color: var(--accent-bd); color: var(--accent); }
  .upl { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: var(--r2); background: var(--accent-bg); color: var(--accent); border: 1px solid var(--accent-bd); font-size: var(--fs-sm); font-weight: 700; cursor: pointer; align-self: flex-start; }
  .upl input { display: none; }
  .det { display: flex; flex-direction: column; gap: 6px; }
</style>
