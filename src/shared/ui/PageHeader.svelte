<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import { navigateTo } from './navigation';
  import { takeHeadingFocusRequest } from './pageFocus';
  import { showPageTitle } from './pageTitle';

  type BackTarget = { label: string; hash: string };

  let { heading, back, actions }: { heading: string; back?: BackTarget; actions?: Snippet } =
    $props();

  let headingElement: HTMLHeadingElement;

  $effect(() => showPageTitle(heading));

  onMount(() => {
    if (takeHeadingFocusRequest()) {
      headingElement.focus();
    }
  });
</script>

<div class="page-header">
  {#if back}
    <button
      type="button"
      class="back-button"
      aria-label="Zurück zu {back.label}"
      onclick={() => navigateTo(back.hash)}
    >
      <ChevronLeft aria-hidden="true" size="1.25em" />
      {back.label}
    </button>
  {/if}
  <div class="heading-row">
    <h1 tabindex="-1" bind:this={headingElement}>{heading}</h1>
    {#if actions}
      <div class="actions">{@render actions()}</div>
    {/if}
  </div>
</div>

<style>
  .page-header {
    margin: 1rem 0;
  }

  .back-button {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    min-height: 2.75rem;
    margin: 0 0 0.25rem;
    padding: 0;
    border: none;
    background: none;
    color: inherit;
    font: inherit;
    font-weight: 600;
    text-align: start;
    overflow-wrap: anywhere;
    cursor: pointer;
  }

  .back-button :global(svg) {
    flex: none;
  }

  .heading-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem 1rem;
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
