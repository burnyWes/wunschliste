<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { takeHeadingFocusRequest } from './pageFocus';
  import { showPageTitle } from './pageTitle';

  let { heading, actions }: { heading: string; actions?: Snippet } = $props();

  let headingElement: HTMLHeadingElement;

  $effect(() => showPageTitle(heading));

  onMount(() => {
    if (takeHeadingFocusRequest()) {
      headingElement.focus();
    }
  });
</script>

<div class="page-header">
  <h1 tabindex="-1" bind:this={headingElement}>{heading}</h1>
  {#if actions}
    <div class="actions">{@render actions()}</div>
  {/if}
</div>

<style>
  .page-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    margin: 1rem 0;
  }

  h1 {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-inline-start: auto;
  }
</style>
