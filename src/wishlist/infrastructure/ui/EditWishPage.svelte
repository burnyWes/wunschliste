<script lang="ts">
  import { Trash2 } from '@lucide/svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import type { Wish } from '../../domain/Wish';
  import type { WishDetails } from '../../domain/WishDetails';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishForm from './WishForm.svelte';
  import { wishDeletionMessage, wishDetailsInputOf } from './wishTexts';

  let { wishId }: { wishId: WishId } = $props();

  const { watchWish, editWish, deleteWish } = useWishlistModule();

  const wish = new Watched<Wish>();
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

  $effect(() => watchWish.execute(wishId, (reported) => wish.show(reported)));

  const wishHash = $derived(hashOf({ page: 'wish', wishId }));

  async function save(details: WishDetails): Promise<void> {
    await editWish.execute(wishId, details);
    navigateTo(wishHash);
  }

  async function deleteConfirmed(wishlistHash: string): Promise<void> {
    isDeleting = true;
    await deleteWish.execute(wishId);
    navigateTo(wishlistHash);
  }
</script>

{#if wish.value}
  {@const wishlistHash = wishlistFilterMemory.hashOf(wish.value.wishlistId)}
  <WishForm
    heading="Wunsch bearbeiten"
    initialInput={wishDetailsInputOf(wish.value.details)}
    cancelTarget={wishHash}
    onsubmit={save}
  >
    {#snippet extra()}
      <div class="button-row">
        <button
          class="button"
          type="button"
          onclick={(event) => deletionDialog?.open(event.currentTarget)}
        >
          <Trash2 aria-hidden="true" size="1.25em" /> Wunsch löschen
        </button>
      </div>
      <ConfirmDialog
        bind:this={deletionDialog}
        heading="Wunsch löschen?"
        message={wishDeletionMessage(wish.value?.details.name.value ?? '')}
        confirmLabel="Löschen"
        onconfirm={() => deleteConfirmed(wishlistHash)}
      />
    {/snippet}
  </WishForm>
{:else if wish.status === 'missing' && !isDeleting}
  <NotFound message="Diesen Wunsch gibt es nicht mehr." />
{/if}
