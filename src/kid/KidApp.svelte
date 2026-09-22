<script>
  /** Gala mode — full-screen iPad app at /gala. Everything is vocalized Hebrew with big pictures. */
  import { onMount } from 'svelte';
  import { kid, draft, newDraft, api, fileUrl, say, beep, hebrewVoices, setVoice, currentVoiceName } from './kidApi.js';
  import { STEPS, CARDS, card, sentence } from './cards.js';
  import Recorder from './Recorder.svelte';
  import Draw from './Draw.svelte';

  let screen = $state('home');    // home | cards | record | draw | photo | summary | sent | mine
  let step = $state(0);
  let ideas = $state([]);
  let sending = $state(false);
  let photoBusy = $state(false);
  let starting = $state(false);
  let nowId = $state(null);       // jukebox: which song is loaded
  let playing = $state(false);
  let player = $state(null);
  const songs = $derived(ideas.filter(i => i.songPath || i.songUrl));
  const songSrc = it => it.songPath ? fileUrl(it.songPath) : it.songUrl;
  const playable = it => !!it.songPath || /\.(mp3|m4a|wav|ogg)(\?|$)/i.test(it.songUrl || '');
  function toggle(it) {
    if (!playable(it)) { window.open(it.songUrl, '_blank'); return; }
    if (nowId === it.id) { playing ? player.pause() : player.play(); return; }
    nowId = it.id; playing = false;
    setTimeout(() => { if (player) { player.src = songSrc(it); player.play().catch(() => {}); } }, 0);
  }
  async function loadJukebox() { screen = 'jukebox'; try { ideas = (await api.list()).ideas || []; } catch { ideas = []; } if (songs.length) say('השירים שלך'); else say('עוד אין שירים מוכנים'); }

  const name = $derived($kid?.name || 'גָּאלָה');
  const d = $derived($draft);
  const pick = $derived(d?.cards || {});
  const stepDef = $derived(STEPS[step]);

  onMount(() => { document.documentElement.dataset.theme = 'light'; document.documentElement.dir = 'rtl'; document.documentElement.lang = 'he'; });

  function startNew() {
    if (d && (Object.keys(d.cards || {}).length || d.takes?.length || d.drawing || d.photo)) { screen = 'resume'; return; }
    draft.set(newDraft()); step = 0; screen = 'cards'; say(STEPS[0].q);
  }
  function resume() { step = 0; screen = 'cards'; say(STEPS[0].q); }
  function discard() { draft.set(newDraft()); step = 0; screen = 'cards'; say(STEPS[0].q); }

  function choose(id) {
    beep(880, 80);
    if (id === 'none') { draft.update(x => { const cards = { ...x.cards }; delete cards[stepDef.id]; return { ...x, cards }; }); setTimeout(next, 200); return; }
    draft.update(x => ({ ...x, cards: { ...x.cards, [stepDef.id]: id } }));
    const c = card(stepDef.id, id); if (c) say(c.he);
    setTimeout(next, 450);
  }
  function next() {
    if (step < STEPS.length - 1) { step++; say(STEPS[step].q); }
    else { screen = 'record'; say('עכשיו ספרי לי את הרעיון בקול'); }
  }
  function back() {
    if (screen === 'cards' && step > 0) { step--; return; }
    if (screen === 'cards') { screen = 'home'; return; }
    if (screen === 'record') { screen = 'cards'; step = STEPS.length - 1; return; }
    if (screen === 'draw') { screen = 'record'; return; }
    if (screen === 'photo') { screen = 'draw'; return; }
    if (screen === 'summary') { screen = 'photo'; return; }
    screen = 'home';
  }
  function randomAll() {
    beep(660, 80); setTimeout(() => beep(880, 80), 120); setTimeout(() => beep(1100, 120), 240);
    const cards = {};
    for (const s of STEPS) { const list = CARDS[s.id].filter(c => c.id !== 'none'); if (s.id === 'world' && Math.random() < 0.5) continue; cards[s.id] = list[Math.floor(Math.random() * list.length)].id; }
    draft.update(x => ({ ...(x || newDraft()), cards }));
    screen = 'summary'; setTimeout(() => say(sentence(cards)), 300);
  }

  async function photo(e) {
    const f = e.target.files?.[0]; if (!f) return;
    photoBusy = true;
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = URL.createObjectURL(f); });
      const max = 1280, k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      const blob = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.85));
      const r = await api.upload(blob, 'img');
      draft.update(x => ({ ...x, photo: r.path }));
      say('התמונה נשמרה');
      screen = 'summary'; setTimeout(() => say(sentence(pick)), 600);
    } catch { say('לא הצלחתי לשמור את התמונה'); }
    photoBusy = false; e.target.value = '';
  }

  async function send() {
    if (sending) return;
    sending = true;
    try {
      await api.saveIdea({ ...d, sentence: sentence(pick), sentAt: Date.now() });
      draft.set(null);
      screen = 'sent'; beep(880, 100); setTimeout(() => beep(1320, 220), 140);
      say(`מעולה ${name}! הרעיון נשלח לאבא`);
    } catch { say('אופס, לא הצלחתי לשלוח. ננסה שוב'); }
    sending = false;
  }
  async function loadMine() {
    screen = 'mine';
    try { ideas = (await api.list()).ideas || []; } catch { ideas = []; }
  }
  const when = ts => new Date(ts || 0).toLocaleDateString('he-IL');

  // voice picker (small, for the parent): Hebrew voices installed on this device
  let voices = $state([]);
  let voiceName = $state('');
  let voicesOpen = $state(false);
  function refreshVoices() { voices = hebrewVoices(); voiceName = currentVoiceName(); }
  onMount(() => { refreshVoices(); if ('speechSynthesis' in window) speechSynthesis.addEventListener('voiceschanged', refreshVoices); });
  function chooseVoice(n) { setVoice(n); voiceName = currentVoiceName(); say(`שלום ${name}, אני הקול החדש שלך`); }
</script>

{#if !$kid}
  <main class="kid center">
    <div class="logo">🎵</div>
    <h1>מֶלוֹדְרַאפְט לִילָדִים</h1>
    <p class="p">צְרִיכִים קִשּׁוּר מֵאַבָּא כְּדֵי לְהִכָּנֵס 😊</p>
  </main>
{:else}
<main class="kid">
  {#if screen !== 'home'}
    <header class="bar">
      <button class="nav" onclick={back}>➡️ חֲזָרָה</button>
      {#if screen === 'cards'}
        <div class="dots">{#each STEPS as s, i}<span class="dotStep" class:on={i === step} class:done={pick[s.id]}>{s.emoji}</span>{/each}</div>
      {/if}
      <button class="nav" onclick={() => (screen = 'home')}>🏠</button>
    </header>
  {/if}

  {#if screen === 'home'}
    <section class="center">
      <div class="logo">🎵</div>
      <h1>הַיי {name}!</h1>
      <p class="p">בּוֹאִי נַמְצִיא שִׁיר</p>
      <div class="menu">
        <button class="tile pink" onclick={startNew}><span class="big">✨</span>רַעְיוֹן חָדָשׁ</button>
        <button class="tile purple" onclick={randomAll}><span class="big">🎲</span>מְכוֹנַת רַעְיוֹנוֹת</button>
        <button class="tile blue" onclick={loadMine}><span class="big">📚</span>הָרַעְיוֹנוֹת שֶׁלִּי</button>
        <button class="tile gold" onclick={loadJukebox}><span class="big">🎧</span>הַשִּׁירִים שֶׁלִּי</button>
      </div>
      <div class="voiceBox">
        <button class="voiceBtn" onclick={() => { refreshVoices(); voicesOpen = !voicesOpen; }}>🔈 קוֹל: {voiceName || 'אוטומטי'}</button>
        {#if voicesOpen}
          <div class="voiceList">
            {#if !voices.length}<span class="faintk">לא נמצאו קולות בעברית במכשיר</span>{/if}
            {#each voices as v (v.name)}
              <button class="voiceOpt" class:on={v.name === voiceName} onclick={() => chooseVoice(v.name)}>{v.name}</button>
            {/each}
          </div>
        {/if}
      </div>
    </section>

  {:else if screen === 'resume'}
    <section class="center">
      <div class="logo">🤔</div>
      <h2>יֵשׁ רַעְיוֹן שֶׁלֹּא סִיַּמְנוּ</h2>
      <div class="menu">
        <button class="tile green" onclick={resume}><span class="big">▶️</span>לְהַמְשִׁיךְ אוֹתוֹ</button>
        <button class="tile pink" onclick={discard}><span class="big">🆕</span>לְהַתְחִיל חָדָשׁ</button>
      </div>
    </section>

  {:else if screen === 'cards'}
    <section>
      <h2 class="q"><button class="speak" onclick={() => say(stepDef.q)}>🔊</button> {stepDef.q}</h2>
      <div class="grid">
        {#each CARDS[stepDef.id] as c (c.id)}
          <button class="card" class:on={pick[stepDef.id] === c.id} onclick={() => choose(c.id)}>
            <span class="em">{c.emoji}</span><span class="lb">{c.he}</span>
          </button>
        {/each}
      </div>
      <div class="row">
        <button class="pill" onclick={() => { draft.update(x => { const cards = { ...x.cards }; delete cards[stepDef.id]; return { ...x, cards }; }); next(); }}>לֹא יוֹדַעַת, הַלְאָה ⏭</button>
        <button class="pill" onclick={() => choose(CARDS[stepDef.id][Math.floor(Math.random() * CARDS[stepDef.id].length)].id)}>🎲 תִּבְחַר בִּשְׁבִילִי</button>
      </div>
    </section>

  {:else if screen === 'record'}
    <section>
      <h2 class="q"><button class="speak" onclick={() => say('ספרי לי את הרעיון בקול. אפשר גם לשיר!')}>🔊</button> סַפְּרִי לִי אֶת הָרַעְיוֹן בְּקוֹל 🎤</h2>
      <p class="p small">אֶפְשָׁר גַּם לָשִׁיר! יֵשׁ זְמַן, בְּלִי לְמַהֵר.</p>
      <Recorder takes={d?.takes || []} onchange={t => draft.update(x => ({ ...x, takes: t }))} />
      <div class="row">
        <button class="pill" onclick={() => { screen = 'draw'; say('רוצה לצייר את השיר?'); }}>{d?.takes?.length ? '✅ הַלְאָה' : 'בְּלִי הַקְלָטָה ⏭'}</button>
      </div>
    </section>

  {:else if screen === 'draw'}
    <section>
      <h2 class="q"><button class="speak" onclick={() => say('רוצה לצייר את השיר?')}>🔊</button> רוֹצָה לְצַיֵּר אֶת הַשִּׁיר? 🎨</h2>
      {#if d?.drawing}
        <div class="preview"><img src={fileUrl(d.drawing)} alt="" /></div>
        <div class="row">
          <button class="pill" onclick={() => { api.deleteFile(d.drawing); draft.update(x => ({ ...x, drawing: null })); }}>🗑️ לְצַיֵּר מֵחָדָשׁ</button>
          <button class="pill go" onclick={() => (screen = 'photo')}>✅ הַלְאָה</button>
        </div>
      {:else}
        <Draw onsaved={p => { draft.update(x => ({ ...x, drawing: p })); screen = 'photo'; }} onskip={() => (screen = 'photo')} />
      {/if}
    </section>

  {:else if screen === 'photo'}
    <section class="center">
      <h2 class="q"><button class="speak" onclick={() => say('רוצה לצלם משהו לשיר?')}>🔊</button> רוֹצָה לְצַלֵּם מַשֶּׁהוּ לַשִּׁיר? 📷</h2>
      <p class="p small">בֻּבָּה, צַעֲצוּעַ, אוֹ מַשֶּׁהוּ שֶׁאַתְּ אוֹהֶבֶת</p>
      {#if d?.photo}
        <div class="preview"><img src={fileUrl(d.photo)} alt="" /></div>
        <div class="row">
          <button class="pill" onclick={() => { api.deleteFile(d.photo); draft.update(x => ({ ...x, photo: null })); }}>🗑️ לְצַלֵּם מֵחָדָשׁ</button>
          <button class="pill go" onclick={() => { screen = 'summary'; say(sentence(pick)); }}>✅ הַלְאָה</button>
        </div>
      {:else}
        <label class="tile blue camera">
          <span class="big">📷</span>{photoBusy ? 'שׁוֹמְרִים…' : 'לְצַלֵּם'}
          <input type="file" accept="image/*" capture="environment" onchange={photo} disabled={photoBusy} />
        </label>
        <button class="pill" onclick={() => { screen = 'summary'; say(sentence(pick)); }}>בְּלִי תְּמוּנָה ⏭</button>
      {/if}
    </section>

  {:else if screen === 'summary'}
    <section class="center">
      <h2 class="q">הִנֵּה הָרַעְיוֹן שֶׁלָּךְ:</h2>
      <div class="sum">
        <div class="emojis">{#each STEPS as s}{#if pick[s.id]}<span>{card(s.id, pick[s.id]).emoji}</span>{/if}{/each}</div>
        <p class="sentence">{sentence(pick)}</p>
        <button class="speak lg" onclick={() => say(sentence(pick))}>🔊 תַּקְרִיא לִי</button>
        <div class="extras">
          {#if d?.takes?.length}<span>🎤 {d.takes.length} הַקְלָטוֹת</span>{/if}
          {#if d?.drawing}<span>🎨 צִיּוּר</span>{/if}
          {#if d?.photo}<span>📷 תְּמוּנָה</span>{/if}
        </div>
      </div>
      <div class="menu">
        <button class="tile green" onclick={send} disabled={sending}><span class="big">📨</span>{sending ? 'שׁוֹלְחִים…' : 'לִשְׁלֹחַ לְאַבָּא!'}</button>
        <button class="tile purple" onclick={() => { step = 0; screen = 'cards'; }}><span class="big">🔁</span>לְשַׁנּוֹת</button>
      </div>
    </section>

  {:else if screen === 'sent'}
    <section class="center">
      <div class="logo party">🎉</div>
      <h1>נִשְׁלַח לְאַבָּא!</h1>
      <p class="p">כָּל הַכָּבוֹד {name}! אַבָּא יַהֲפֹךְ אֶת זֶה לְשִׁיר 🎶</p>
      <div class="menu">
        <button class="tile pink" onclick={startNew}><span class="big">✨</span>עוֹד רַעְיוֹן</button>
        <button class="tile blue" onclick={loadMine}><span class="big">📚</span>הָרַעְיוֹנוֹת שֶׁלִּי</button>
      </div>
    </section>

  {:else if screen === 'mine'}
    <section>
      <h2 class="q">הָרַעְיוֹנוֹת שֶׁלִּי 📚</h2>
      {#if !ideas.length}<p class="p">עוֹד אֵין רַעְיוֹנוֹת. בּוֹאִי נַמְצִיא אֶחָד! ✨</p>{/if}
      <ul class="mine">
        {#each ideas as it (it.id)}
          <li class:song={it.songUrl}>
            <div class="emojis sm">{#each STEPS as s}{#if it.cards?.[s.id]}<span>{card(s.id, it.cards[s.id])?.emoji}</span>{/if}{/each}</div>
            <div class="mt">
              <div class="ms">{it.sentence || sentence(it.cards || {})}</div>
              <div class="md">{when(it.createdAt)} {#if it.status === 'used' && !it.songUrl}· אַבָּא עוֹבֵד עַל זֶה 🎧{/if}</div>
              {#if it.songPath || it.songUrl}
                <div class="songbox">⭐ הַשִּׁיר שֶׁלָּךְ מוּכָן: <b>{it.songTitle || ''}</b>
                  {#if playable(it)}<audio controls preload="none" src={songSrc(it)}></audio>
                  {:else}<a class="pill go" href={it.songUrl} target="_blank" rel="noopener">▶️ לְהַאֲזִין</a>{/if}
                </div>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {:else if screen === 'jukebox'}
    <section>
      <h2 class="q">הַשִּׁירִים שֶׁלִּי 🎧</h2>
      {#if !songs.length}<p class="p">עוֹד אֵין שִׁירִים מוּכָנִים. כְּשֶׁאַבָּא יְסַיֵּם שִׁיר הוּא יוֹפִיעַ כָּאן ⭐</p>{/if}
      <audio bind:this={player} onplay={() => (playing = true)} onpause={() => (playing = false)} onended={() => (playing = false)}></audio>
      <ul class="juke">
        {#each songs as it (it.id)}
          <li class:now={nowId === it.id}>
            <button class="play" onclick={() => toggle(it)} aria-label="ניגון">{nowId === it.id && playing ? '⏸' : '▶️'}</button>
            <div class="jt">
              <div class="emojis sm">{#each STEPS as s}{#if it.cards?.[s.id]}<span>{card(s.id, it.cards[s.id])?.emoji}</span>{/if}{/each}</div>
              <div class="jn">{it.songTitle || it.sentence || 'שִׁיר'}</div>
              {#if nowId === it.id && playing}<div class="eq"><i></i><i></i><i></i><i></i></div>{/if}
            </div>
            <button class="speak" onclick={() => say(it.songTitle || it.sentence || '')}>🔊</button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</main>
{/if}

<style>
  :global(body) { background: #fff8f0; }
  .kid { min-height: 100dvh; padding: max(16px, env(safe-area-inset-top)) 20px 40px; font-family: 'Heebo', system-ui, sans-serif; color: #1f2937; background: linear-gradient(180deg, #fff8f0, #ffe9f3 60%, #e9f3ff); display: flex; flex-direction: column; gap: 16px; -webkit-user-select: none; user-select: none; }
  .center { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 16px; }
  .logo { font-size: 110px; line-height: 1; }
  .party { animation: bounce 1s infinite; }
  @keyframes bounce { 50% { transform: translateY(-14px) rotate(8deg); } }
  h1 { font-size: 46px; font-weight: 900; }
  h2 { font-size: 34px; font-weight: 900; }
  .p { font-size: 28px; font-weight: 700; color: #4b5563; }
  .p.small { font-size: 22px; text-align: center; }
  .bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .nav { font-size: 22px; font-weight: 900; padding: 10px 18px; border-radius: 999px; background: #fff; border: 3px solid #e5e7eb; }
  .dots { display: flex; gap: 6px; }
  .dotStep { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; font-size: 22px; background: #fff; border: 3px solid #e5e7eb; opacity: .55; }
  .dotStep.done { opacity: 1; border-color: #22c55e; }
  .dotStep.on { opacity: 1; border-color: #ff3d71; transform: scale(1.15); }
  .menu { display: flex; flex-wrap: wrap; gap: 18px; justify-content: center; margin-top: 10px; }
  .tile { width: 240px; height: 200px; border-radius: 32px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; font-size: 28px; font-weight: 900; color: #fff; border: 6px solid #fff; box-shadow: 0 14px 36px rgba(0,0,0,.16); position: relative; }
  .tile:active { transform: scale(.96); }
  .tile .big { font-size: 74px; line-height: 1; }
  .pink { background: linear-gradient(145deg, #ff6b9d, #ff3d71); }
  .purple { background: linear-gradient(145deg, #a78bfa, #7c3aed); }
  .blue { background: linear-gradient(145deg, #38bdf8, #0284c7); }
  .green { background: linear-gradient(145deg, #4ade80, #16a34a); }
  .gold { background: linear-gradient(145deg, #fbbf24, #f59e0b); }
  .voiceBox { margin-top: 26px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .voiceBtn { font-size: 15px; font-weight: 700; color: #6b7280; padding: 6px 14px; border-radius: 999px; background: rgba(255,255,255,.7); border: 2px solid #e5e7eb; }
  .voiceList { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; max-width: 720px; }
  .voiceOpt { font-size: 15px; padding: 6px 12px; border-radius: 999px; background: #fff; border: 2px solid #e5e7eb; color: #374151; }
  .voiceOpt.on { border-color: #ff3d71; color: #ff3d71; }
  .faintk { font-size: 15px; color: #9ca3af; }
  .juke { list-style: none; display: flex; flex-direction: column; gap: 14px; max-width: 760px; margin: 0 auto; width: 100%; }
  .juke li { display: flex; align-items: center; gap: 16px; background: #fff; border: 5px solid #fde68a; border-radius: 28px; padding: 14px 18px; }
  .juke li.now { border-color: #f59e0b; background: #fffbeb; box-shadow: 0 10px 30px rgba(245,158,11,.25); }
  .play { width: 92px; height: 92px; border-radius: 50%; font-size: 44px; background: linear-gradient(145deg, #fbbf24, #f59e0b); border: 6px solid #fff; box-shadow: 0 8px 24px rgba(245,158,11,.4); flex-shrink: 0; }
  .play:active { transform: scale(.94); }
  .jt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .jn { font-size: 26px; font-weight: 900; }
  .eq { display: flex; gap: 4px; align-items: flex-end; height: 22px; }
  .eq i { width: 6px; background: #f59e0b; border-radius: 3px; animation: eq .8s ease-in-out infinite; }
  .eq i:nth-child(2) { animation-delay: .15s; } .eq i:nth-child(3) { animation-delay: .3s; } .eq i:nth-child(4) { animation-delay: .45s; }
  @keyframes eq { 0%, 100% { height: 6px; } 50% { height: 22px; } }
  .tile:disabled { filter: grayscale(.6); }
  .camera input { position: absolute; inset: 0; opacity: 0; }
  .q { display: flex; align-items: center; gap: 12px; justify-content: center; text-align: center; margin-bottom: 8px; }
  .speak { font-size: 26px; width: 54px; height: 54px; border-radius: 50%; background: #fff; border: 3px solid #e5e7eb; }
  .speak.lg { width: auto; height: auto; padding: 10px 22px; border-radius: 999px; font-size: 24px; font-weight: 900; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 14px; }
  .card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 8px 12px; border-radius: 26px; background: #fff; border: 5px solid #e5e7eb; box-shadow: 0 6px 18px rgba(0,0,0,.07); }
  .card:active { transform: scale(.95); }
  .card.on { border-color: #ff3d71; background: #fff0f5; }
  .em { font-size: 64px; line-height: 1.1; }
  .lb { font-size: 22px; font-weight: 900; text-align: center; line-height: 1.25; }
  .row { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; margin-top: 16px; }
  .pill { font-size: 24px; font-weight: 900; padding: 12px 26px; border-radius: 999px; background: #fff; border: 4px solid #e5e7eb; color: #374151; text-decoration: none; }
  .pill.go { background: #22c55e; color: #fff; border-color: #fff; box-shadow: 0 8px 22px rgba(34,197,94,.35); }
  .preview img { max-width: min(100%, 520px); max-height: 50vh; border-radius: 24px; border: 5px solid #fff; box-shadow: 0 8px 24px rgba(0,0,0,.12); display: block; margin: 0 auto; }
  .sum { background: #fff; border-radius: 30px; padding: 24px; border: 5px solid #ffd6e2; display: flex; flex-direction: column; align-items: center; gap: 14px; max-width: 640px; width: 100%; }
  .emojis { font-size: 56px; display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; }
  .emojis.sm { font-size: 34px; gap: 4px; }
  .sentence { font-size: 32px; font-weight: 900; line-height: 1.5; text-align: center; }
  .extras { display: flex; gap: 14px; font-size: 20px; font-weight: 800; color: #6b7280; flex-wrap: wrap; justify-content: center; }
  .mine { list-style: none; display: flex; flex-direction: column; gap: 12px; max-width: 760px; margin: 0 auto; width: 100%; }
  .mine li { display: flex; gap: 14px; align-items: center; background: #fff; border: 4px solid #e5e7eb; border-radius: 24px; padding: 14px 16px; }
  .mine li.song { border-color: #facc15; background: #fffbeb; }
  .mt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .ms { font-size: 22px; font-weight: 900; }
  .md { font-size: 16px; font-weight: 700; color: #6b7280; }
  .songbox { display: flex; flex-direction: column; gap: 8px; font-size: 20px; font-weight: 800; margin-top: 6px; }
  .songbox audio { width: 100%; }
  @media (max-width: 700px) { .tile { width: 46%; height: 160px; font-size: 22px; } .tile .big { font-size: 56px; } h1 { font-size: 36px; } .grid { grid-template-columns: repeat(3, 1fr); } .em { font-size: 48px; } .lb { font-size: 18px; } }
</style>
