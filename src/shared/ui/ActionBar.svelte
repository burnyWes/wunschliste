<script lang="ts">
  import type { Snippet } from 'svelte';
  import { OnScreenKeyboard } from './onScreenKeyboard.svelte';

  let { children }: { children: Snippet } = $props();

  const keyboard = new OnScreenKeyboard();

  $effect(() => keyboard.follow());
</script>

<div class="action-bar" class:action-bar--in-flow={keyboard.isOpen}>{@render children()}</div>

<style>
  .action-bar {
    position: sticky;
    bottom: 0;
    z-index: 1;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.5rem;
    margin-top: auto;
    margin-inline: -1rem;
    padding: 0.5rem 1rem calc(0.5rem + env(safe-area-inset-bottom));
    border-top: 0.1875rem solid var(--color-outline);
    background-color: var(--color-background);
  }

  .action-bar--in-flow {
    position: static;
  }
</style>
