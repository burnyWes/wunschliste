<script lang="ts">
  import { ChevronLeft } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import { goBack } from './navigation';
  import { takeHeadingFocusRequest } from './pageFocus';
  import { showPageTitle } from './pageTitle';

  type BackLink = { label: string; hash: string };

  let { heading, back, actions }: { heading: string; back?: BackLink; actions?: Snippet } =
    $props();

  let headingElement: HTMLHeadingElement;

  $effect(() => showPageTitle(heading));

  onMount(() => {
    if (takeHeadingFocusRequest()) {
      headingElement.focus();
    }
  });

  function goBackTo(event: MouseEvent, target: BackLink): void {
    event.preventDefault();
    goBack(target.hash);
  }
</script>

<div class="page-header">
  {#if back}
    <a
      class="back-link"
      href={back.hash}
      aria-label="Zurück zu {back.label}"
      onclick={(event) => goBackTo(event, back)}
    >
      <ChevronLeft aria-hidden="true" size="1.25em" />
      {back.label}
    </a>
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

  .back-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    min-height: 2.75rem;
    margin-bottom: 0.25rem;
    font-weight: 600;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .back-link :global(svg) {
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
