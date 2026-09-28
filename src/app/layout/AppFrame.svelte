<script lang="ts">
  import type { Snippet } from 'svelte';

  let { header, children }: { header?: Snippet; children?: Snippet } = $props();
</script>

<header>
  <div class="status-bar-backdrop"></div>
  {@render header?.()}
</header>

<main>
  {@render children?.()}
</main>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--color-background);
  }

  .status-bar-backdrop {
    height: env(safe-area-inset-top);
    background-color: var(--color-status-bar);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 1rem calc(1rem + env(safe-area-inset-bottom));
  }

  main:has(:global(.action-bar)) {
    padding-bottom: 0;
  }
</style>
