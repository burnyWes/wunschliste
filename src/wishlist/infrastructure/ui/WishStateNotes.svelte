<script lang="ts">
  import type { PersonId } from '../../domain/ids';
  import type { Person } from '../../domain/Person';
  import type { WishView } from '../../domain/wishView';
  import { fulfilledNote, giverNote } from './wishTexts';

  let {
    view,
    persons,
    variant,
  }: { view: WishView; persons: readonly Person[]; variant: 'entry' | 'page' } = $props();

  function nameOf(personId: PersonId | undefined): string | undefined {
    return persons.find(({ id }) => id === personId)?.name.value;
  }

  const giverName = $derived(nameOf(view.giverId));
</script>

{#if view.status === 'fulfilled'}
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
