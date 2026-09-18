/**
 * ComfyUI bridge — the browser talks straight to a local ComfyUI (default http://127.0.0.1:8188).
 * Built-in API-format workflows for SDXL, Flux dev and Qwen-Image, or a custom API-format
 * workflow with auto-detected prompt / seed / size nodes.
 *
 * ComfyUI must be started with CORS enabled for the site, e.g.
 *   python main.py --enable-cors-header "https://suno-lyrics-studio-five.vercel.app"
 */
import { get } from 'svelte/store';
import { settings } from './settings.js';

export const ENGINES = [
  { id: 'sdxl', label: 'SDXL', size: 1024 },
  { id: 'flux', label: 'Flux dev', size: 1024 },
  { id: 'qwen', label: 'Qwen-Image', size: 1328 },
  { id: 'custom', label: 'Custom workflow', size: 1024 },
];

export const DEFAULTS = {
  sdxl: { ckpt: 'juggernautXL_juggXIByRundiffusion.safetensors', steps: 30, cfg: 6, sampler: 'dpmpp_2m', scheduler: 'karras' },
  flux: { unet: 'flux1-dev.safetensors', clip1: 't5xxl_fp8_e4m3fn.safetensors', clip2: 'clip_l.safetensors', vae: 'ae.safetensors', steps: 20, guidance: 3.5, sampler: 'euler', scheduler: 'simple' },
  qwen: { unet: 'qwen_image_2512_fp8_e4m3fn.safetensors', clip: 'qwen_2.5_vl_7b_fp8_scaled.safetensors', vae: 'qwen_image_vae.safetensors', steps: 20, cfg: 2.5, shift: 3.1, sampler: 'euler', scheduler: 'simple' },
};

const base = () => (get(settings).comfyUrl || 'http://127.0.0.1:8188').replace(/\/+$/, '');
const rndSeed = () => Math.floor(Math.random() * 2 ** 32);

/* ── built-in workflows (API format) ──────────────────────────────── */
export function buildSdxl(o, positive, negative, seed, size) {
  return {
    1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: o.ckpt }, _meta: { title: 'Checkpoint' } },
    2: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['1', 1] }, _meta: { title: 'Positive' } },
    3: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['1', 1] }, _meta: { title: 'Negative' } },
    4: { class_type: 'EmptyLatentImage', inputs: { width: size, height: size, batch_size: 1 }, _meta: { title: 'Latent' } },
    5: { class_type: 'KSampler', inputs: { seed, steps: o.steps, cfg: o.cfg, sampler_name: o.sampler, scheduler: o.scheduler, denoise: 1, model: ['1', 0], positive: ['2', 0], negative: ['3', 0], latent_image: ['4', 0] }, _meta: { title: 'KSampler' } },
    6: { class_type: 'VAEDecode', inputs: { samples: ['5', 0], vae: ['1', 2] }, _meta: { title: 'Decode' } },
    7: { class_type: 'SaveImage', inputs: { filename_prefix: 'melodraft/cover', images: ['6', 0] }, _meta: { title: 'Save' } },
  };
}
export function buildFlux(o, positive, negative, seed, size) {
  return {
    1: { class_type: 'UNETLoader', inputs: { unet_name: o.unet, weight_dtype: 'fp8_e4m3fn' }, _meta: { title: 'Flux UNET' } },
    2: { class_type: 'DualCLIPLoader', inputs: { clip_name1: o.clip1, clip_name2: o.clip2, type: 'flux' }, _meta: { title: 'CLIP' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: o.vae }, _meta: { title: 'VAE' } },
    4: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['2', 0] }, _meta: { title: 'Positive' } },
    5: { class_type: 'FluxGuidance', inputs: { guidance: o.guidance, conditioning: ['4', 0] }, _meta: { title: 'Guidance' } },
    6: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['4', 0] }, _meta: { title: 'Negative (zero)' } },
    7: { class_type: 'EmptySD3LatentImage', inputs: { width: size, height: size, batch_size: 1 }, _meta: { title: 'Latent' } },
    8: { class_type: 'KSampler', inputs: { seed, steps: o.steps, cfg: 1, sampler_name: o.sampler, scheduler: o.scheduler, denoise: 1, model: ['1', 0], positive: ['5', 0], negative: ['6', 0], latent_image: ['7', 0] }, _meta: { title: 'KSampler' } },
    9: { class_type: 'VAEDecode', inputs: { samples: ['8', 0], vae: ['3', 0] }, _meta: { title: 'Decode' } },
    10: { class_type: 'SaveImage', inputs: { filename_prefix: 'melodraft/cover', images: ['9', 0] }, _meta: { title: 'Save' } },
  };
}
export function buildQwen(o, positive, negative, seed, size) {
  return {
    1: { class_type: 'UNETLoader', inputs: { unet_name: o.unet, weight_dtype: 'default' }, _meta: { title: 'Qwen UNET' } },
    2: { class_type: 'CLIPLoader', inputs: { clip_name: o.clip, type: 'qwen_image' }, _meta: { title: 'CLIP' } },
    3: { class_type: 'VAELoader', inputs: { vae_name: o.vae }, _meta: { title: 'VAE' } },
    4: { class_type: 'ModelSamplingAuraFlow', inputs: { shift: o.shift, model: ['1', 0] }, _meta: { title: 'Shift' } },
    5: { class_type: 'CLIPTextEncode', inputs: { text: positive, clip: ['2', 0] }, _meta: { title: 'Positive' } },
    6: { class_type: 'CLIPTextEncode', inputs: { text: negative, clip: ['2', 0] }, _meta: { title: 'Negative' } },
    7: { class_type: 'EmptySD3LatentImage', inputs: { width: size, height: size, batch_size: 1 }, _meta: { title: 'Latent' } },
    8: { class_type: 'KSampler', inputs: { seed, steps: o.steps, cfg: o.cfg, sampler_name: o.sampler, scheduler: o.scheduler, denoise: 1, model: ['4', 0], positive: ['5', 0], negative: ['6', 0], latent_image: ['7', 0] }, _meta: { title: 'KSampler' } },
    9: { class_type: 'VAEDecode', inputs: { samples: ['8', 0], vae: ['3', 0] }, _meta: { title: 'Decode' } },
    10: { class_type: 'SaveImage', inputs: { filename_prefix: 'melodraft/cover', images: ['9', 0] }, _meta: { title: 'Save' } },
  };
}

/* ── custom workflow: find the nodes we need to fill ─────────────── */
const TEXT_CLASSES = /^(CLIPTextEncode|TextEncodeQwenImage|CLIPTextEncodeFlux|CLIPTextEncodeSDXL)/;
export function detectNodes(wf) {
  const nodes = Object.entries(wf || {}).filter(([, n]) => n && typeof n === 'object' && n.class_type);
  const title = n => String((n._meta && n._meta.title) || '').toLowerCase();
  const texts = nodes.filter(([, n]) => TEXT_CLASSES.test(n.class_type) && typeof n.inputs?.text === 'string');
  // which text node feeds a sampler's negative input?
  const negIds = new Set(), posIds = new Set();
  for (const [, n] of nodes) {
    const i = n.inputs || {};
    for (const [k, v] of Object.entries(i)) {
      if (!Array.isArray(v)) continue;
      if (k === 'negative') negIds.add(String(v[0]));
      if (k === 'positive') posIds.add(String(v[0]));
    }
  }
  const walk = (id, seen = new Set()) => { // follow a conditioning chain back to a text node (FluxGuidance etc.)
    if (seen.has(id)) return null; seen.add(id);
    const n = wf[id]; if (!n) return null;
    if (TEXT_CLASSES.test(n.class_type)) return id;
    for (const v of Object.values(n.inputs || {})) if (Array.isArray(v)) { const r = walk(String(v[0]), seen); if (r) return r; }
    return null;
  };
  let pos = null, neg = null;
  for (const id of posIds) { pos = walk(id); if (pos) break; }
  for (const id of negIds) { neg = walk(id); if (neg) break; }
  if (!pos) pos = (texts.find(([, n]) => /pos|prompt/.test(title(n))) || texts[0] || [null])[0];
  if (!neg) neg = (texts.find(([id, n]) => id !== pos && /neg/.test(title(n))) || texts.find(([id]) => id !== pos) || [null])[0];
  const seed = nodes.filter(([, n]) => n.inputs && (typeof n.inputs.seed === 'number' || typeof n.inputs.noise_seed === 'number')).map(([id, n]) => ({ id, key: typeof n.inputs.seed === 'number' ? 'seed' : 'noise_seed' }));
  const size = (nodes.find(([, n]) => /EmptyLatentImage|EmptySD3LatentImage|EmptyHunyuanLatentVideo/.test(n.class_type)) || [null])[0];
  const save = (nodes.find(([, n]) => /SaveImage/.test(n.class_type)) || [null])[0];
  const options = texts.map(([id, n]) => ({ id, label: `#${id} ${n._meta?.title || n.class_type}`, preview: String(n.inputs.text).slice(0, 60) }));
  return { pos, neg, seed, size, save, options, ok: !!pos };
}

export function buildCustom(cfg, positive, negative, seed, size) {
  const wf = JSON.parse(JSON.stringify(cfg.json));
  const d = { ...detectNodes(wf), ...(cfg.pos ? { pos: cfg.pos } : {}), ...(cfg.neg !== undefined ? { neg: cfg.neg } : {}) };
  if (d.pos && wf[d.pos]) wf[d.pos].inputs.text = positive;
  if (d.neg && wf[d.neg] && d.neg !== d.pos) wf[d.neg].inputs.text = negative;
  for (const s of d.seed) wf[s.id].inputs[s.key] = seed;
  if (d.size && wf[d.size] && cfg.setSize) { wf[d.size].inputs.width = size; wf[d.size].inputs.height = size; }
  if (!d.save) { // make sure something is saved
    const dec = Object.entries(wf).find(([, n]) => n.class_type === 'VAEDecode');
    if (dec) wf['melodraft_save'] = { class_type: 'SaveImage', inputs: { filename_prefix: 'melodraft/cover', images: [dec[0], 0] } };
  }
  return wf;
}

export function buildWorkflow(positive, negative, seed = rndSeed()) {
  const s = get(settings);
  const eng = s.comfyEngine || 'sdxl';
  const size = s.comfySize || ENGINES.find(e => e.id === eng)?.size || 1024;
  const o = { ...DEFAULTS[eng], ...((s.comfyModels || {})[eng] || {}) };
  if (eng === 'flux') return buildFlux(o, positive, negative, seed, size);
  if (eng === 'qwen') return buildQwen(o, positive, negative, seed, size);
  if (eng === 'custom') { if (!s.comfyCustom?.json) throw Object.assign(new Error('no_workflow'), { code: 'no_workflow' }); return buildCustom(s.comfyCustom, positive, negative, seed, size); }
  return buildSdxl(o, positive, negative, seed, size);
}

/* ── talking to ComfyUI ───────────────────────────────────────────── */
async function j(url, opts) {
  let r;
  try { r = await fetch(url, opts); }
  catch (e) { throw Object.assign(new Error('unreachable'), { code: 'unreachable', detail: e.message }); }
  if (r.status === 403) throw Object.assign(new Error('cors'), { code: 'cors' });
  if (!r.ok) { let t = ''; try { t = await r.text(); } catch {} throw Object.assign(new Error('http_' + r.status), { code: 'http', status: r.status, detail: t.slice(0, 300) }); }
  return r.json();
}
export async function testConnection(url = base()) {
  const s = await j(`${url.replace(/\/+$/, '')}/system_stats`);
  return { version: s.system?.comfyui_version, gpu: s.devices?.[0]?.name, vram: s.devices?.[0]?.vram_total };
}
/** model lists for the settings page */
export async function listModels(url = base()) {
  const u = url.replace(/\/+$/, '');
  const pick = async (cls, key) => { try { const d = await j(`${u}/object_info/${cls}`); return d[cls].input.required[key][0]; } catch { return []; } };
  return { ckpt: await pick('CheckpointLoaderSimple', 'ckpt_name'), unet: await pick('UNETLoader', 'unet_name'), clip: await pick('CLIPLoader', 'clip_name'), vae: await pick('VAELoader', 'vae_name') };
}

const clientId = () => { let id = sessionStorage.getItem('melodraft_comfy_client'); if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem('melodraft_comfy_client', id); } return id; };

/**
 * Queue a prompt and wait for the image. onStatus({state, queue, elapsed}); resolves to { blob, seed, filename }.
 */
export async function generateImage(positive, negative, { seed = rndSeed(), signal, onStatus } = {}) {
  const u = base();
  const prompt = buildWorkflow(positive, negative, seed);
  const q = await j(`${u}/prompt`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, client_id: clientId() }) });
  if (q.node_errors && Object.keys(q.node_errors).length) throw Object.assign(new Error('workflow'), { code: 'workflow', detail: JSON.stringify(q.node_errors).slice(0, 400) });
  const id = q.prompt_id;
  const t0 = Date.now();
  for (;;) {
    if (signal?.aborted) { fetch(`${u}/interrupt`, { method: 'POST' }).catch(() => {}); throw Object.assign(new Error('aborted'), { code: 'aborted' }); }
    const h = await j(`${u}/history/${id}`);
    const rec = h[id];
    if (rec && rec.status && rec.status.completed === false && rec.status.status_str === 'error') {
      const msg = (rec.status.messages || []).map(m => JSON.stringify(m[1] || m)).join(' ').slice(0, 400);
      throw Object.assign(new Error('exec'), { code: 'exec', detail: msg });
    }
    if (rec && rec.outputs) {
      const imgs = Object.values(rec.outputs).flatMap(o => o.images || []).filter(i => i.type === 'output' || i.type === 'temp');
      const im = imgs.find(i => i.type === 'output') || imgs[0];
      if (im) {
        const r = await fetch(`${u}/view?filename=${encodeURIComponent(im.filename)}&subfolder=${encodeURIComponent(im.subfolder || '')}&type=${im.type}`);
        if (!r.ok) throw Object.assign(new Error('view'), { code: 'http', status: r.status });
        return { blob: await r.blob(), seed, filename: im.filename };
      }
    }
    let queue = null;
    try { const qs = await j(`${u}/queue`); const pending = qs.queue_pending || []; const pos = pending.findIndex(p => p[1] === id); queue = pos >= 0 ? pos + 1 : 0; } catch {}
    onStatus?.({ state: queue ? 'queued' : 'running', queue, elapsed: Math.round((Date.now() - t0) / 1000) });
    await new Promise(r => setTimeout(r, 1200));
  }
}
