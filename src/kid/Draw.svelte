<script>
  /** Finger-painting canvas → PNG upload. */
  import { onMount } from 'svelte';
  import { api, say } from './kidApi.js';

  let { onsaved, onskip } = $props();
  const COLORS = ['#111827', '#ef4444', '#f97316', '#facc15', '#22c55e', '#0ea5e9', '#8b5cf6', '#ec4899', '#a16207', '#ffffff'];
  let color = $state('#ef4444');
  let size = $state(14);
  let canvas = $state(null);
  let ctx, drawing = false, last = null;
  let undoStack = [];
  let dirty = $state(false);
  let saving = $state(false);

  onMount(() => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  });
  const pos = e => { const r = canvas.getBoundingClientRect(); const p = e.touches ? e.touches[0] : e; return { x: p.clientX - r.left, y: p.clientY - r.top }; };
  function down(e) { e.preventDefault(); undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (undoStack.length > 20) undoStack.shift(); drawing = true; last = pos(e); dot(last); }
  function move(e) { if (!drawing) return; e.preventDefault(); const p = pos(e); ctx.strokeStyle = color; ctx.lineWidth = size; ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke(); last = p; dirty = true; }
  function up() { drawing = false; }
  function dot(p) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2); ctx.fill(); dirty = true; }
  function undo() { const im = undoStack.pop(); if (im) ctx.putImageData(im, 0, 0); }
  function clear() { undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  async function save() {
    if (!dirty || saving) return;
    saving = true;
    try {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const r = await api.upload(blob, 'img');
      say('הציור נשמר');
      onsaved?.(r.path);
    } catch { say('לא הצלחתי לשמור'); }
    saving = false;
  }
</script>

<div class="draw">
  <div class="tools">
    {#each COLORS as c}
      <button class="sw" class:on={color === c} style="background:{c}" onclick={() => (color = c)} aria-label="צבע"></button>
    {/each}
    <span class="sep"></span>
    {#each [6, 14, 28] as s}
      <button class="sz" class:on={size === s} onclick={() => (size = s)} aria-label="עובי"><span style="width:{s}px;height:{s}px"></span></button>
    {/each}
    <span class="sep"></span>
    <button class="tb" onclick={undo}>↩️</button>
    <button class="tb" onclick={clear}>🧽</button>
  </div>
  <canvas bind:this={canvas}
          onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} onpointerleave={up}
          ontouchstart={down} ontouchmove={move} ontouchend={up}></canvas>
  <div class="acts">
    <button class="big ghost" onclick={onskip}>בְּלִי צִיּוּר</button>
    <button class="big go" onclick={save} disabled={!dirty || saving}>{saving ? 'שׁוֹמְרִים…' : '✅ סִיַּמְתִּי לְצַיֵּר'}</button>
  </div>
</div>

<style>
  .draw { display: flex; flex-direction: column; gap: 12px; width: 100%; }
  .tools { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
  .sw { width: 44px; height: 44px; border-radius: 50%; border: 4px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.25); }
  .sw.on { outline: 4px solid #111827; outline-offset: 2px; }
  .sep { width: 12px; }
  .sz { width: 44px; height: 44px; border-radius: 12px; background: #fff; border: 3px solid #e5e7eb; display: grid; place-items: center; }
  .sz span { display: block; border-radius: 50%; background: #111827; }
  .sz.on { border-color: #111827; }
  .tb { font-size: 26px; width: 44px; height: 44px; border-radius: 12px; background: #fff; border: 3px solid #e5e7eb; }
  canvas { width: 100%; height: min(58vh, 560px); border-radius: 24px; background: #fff; border: 5px solid #e5e7eb; touch-action: none; box-shadow: inset 0 2px 8px rgba(0,0,0,.06); }
  .acts { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
  .big { font-size: 26px; font-weight: 900; padding: 14px 30px; border-radius: 999px; border: 5px solid #fff; color: #fff; box-shadow: 0 8px 24px rgba(0,0,0,.15); }
  .go { background: #22c55e; }
  .go:disabled { background: #9ca3af; box-shadow: none; }
  .ghost { background: #94a3b8; }
</style>
