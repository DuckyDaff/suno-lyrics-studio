<script>
  import { song } from '../../lib/song.js';
  import SectionCard from './SectionCard.svelte';
  import AddSection from './AddSection.svelte';
</script>

<div class="editor">
  {#each $song.sections as sec, i (sec.id)}
    <SectionCard {sec} index={i} total={$song.sections.length} />
  {/each}
  <AddSection />
</div>

<style>
  .editor {
    max-width: 860px; margin: 0 auto; padding: 18px 20px 40px;
    display: flex; flex-direction: column; gap: 12px;
  }
  @media (max-width: 768px) { .editor { padding: 12px 12px 32px; gap: 10px; } }
</style>
