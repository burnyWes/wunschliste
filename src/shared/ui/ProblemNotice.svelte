<script lang="ts">
  import { TriangleAlert } from '@lucide/svelte';
  import { problemTexts } from './reportedProblems.svelte';
</script>

<div class="problem-notice" class:problem-notice--shown={problemTexts().length > 0} role="alert">
  {#each problemTexts() as text (text)}
    <p><TriangleAlert aria-hidden="true" size="1.25em" /> {text}</p>
  {/each}
</div>

<style>
  .problem-notice--shown {
    padding: 0.25rem 1rem;
    border-block: 0.1875rem solid var(--color-outline);
    font-size: 0.875em;
    font-weight: 700;
  }

  p {
    display: flex;
    align-items: flex-start;
    gap: 0.4em;
    margin: 0;
    overflow-wrap: anywhere;
  }

  p :global(svg) {
    flex: none;
  }
</style>
