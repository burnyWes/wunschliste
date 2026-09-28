<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();
</script>

<div class="action-bar">{@render children()}</div>

<style>
  .action-bar {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: auto;
    margin-inline: -1rem;
    padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
    border-top: 0.1875rem solid var(--color-outline);
    background-color: var(--color-background);
  }
</style>
