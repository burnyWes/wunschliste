<script lang="ts">
  import type { PersonId } from '../../domain/ids';
  import type { Person } from '../../domain/Person';
  import type { WishView } from '../../domain/wishView';
  import {
    fulfilledNote,
    giverNote,
    removedByOwnerNote,
    repeatedGiftsNote,
    secretNote,
  } from './wishTexts';

  let {
    view,
    persons,
    ownerName,
    variant,
  }: {
    view: WishView;
    persons: readonly Person[];
    ownerName: string | undefined;
    variant: 'entry' | 'page';
  } = $props();

  function nameOf(personId: PersonId | undefined): string | undefined {
    return persons.find(({ id }) => id === personId)?.name.value;
  }

  const giverName = $derived(nameOf(view.giverId));
  const repeatedGiverNames = $derived(
    variant === 'page'
      ? (view.repeatedGifts?.giverIds ?? [])
          .map(nameOf)
          .filter((name): name is string => name !== undefined)
      : [],
  );
  const noteElement = $derived(variant === 'page' ? 'p' : 'span');
</script>

{#if view.removedByOwner && variant === 'entry'}
  <span class="note">
    <span aria-hidden="true">⚠</span>
    {removedByOwnerNote(ownerName)}
  </span>
{/if}
{#if view.secretCreatorId !== undefined}
  <svelte:element this={noteElement} class="note">
    <span aria-hidden="true">🤫</span>
    {secretNote(nameOf(view.secretCreatorId))}
  </svelte:element>
{/if}
{#if view.repeatedGifts}
  <svelte:element this={noteElement} class="note">
    <span aria-hidden="true">🔁</span>
    {repeatedGiftsNote(view.repeatedGifts.count, repeatedGiverNames)}
  </svelte:element>
{:else if view.listedUnder.includes('fulfilled')}
  {#if variant === 'page'}
    <p class="note note--strong">{fulfilledNote(giverName)}</p>
  {:else if giverName !== undefined}
    <span class="note">{giverNote(giverName)}</span>
  {/if}
{/if}

<style>
  .note {
    display: block;
    overflow-wrap: anywhere;
  }

  .note--strong {
    font-weight: 700;
  }
</style>
