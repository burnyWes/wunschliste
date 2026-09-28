<script lang="ts">
  import { Save, Trash2, X } from '@lucide/svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { goBack, replaceWith } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Name } from '../../domain/Name';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishlistNameForm from './WishlistNameForm.svelte';
  import { wishlistDeletionMessage } from './wishTexts';

  let { wishlistId }: { wishlistId: WishlistId } = $props();

  const { watchWishlist, watchWishesOfWishlist, renameWishlist, deleteWishlist } =
    useWishlistModule();

  const wishlist = new Watched<Wishlist>();
  let wishes = $state.raw<readonly Wish[]>([]);
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

  $effect(() => watchWishlist.execute(wishlistId, (reported) => wishlist.show(reported)));
  $effect(() => watchWishesOfWishlist.execute(wishlistId, (reported) => (wishes = reported)));

  const wishlistHash = $derived(hashOf({ page: 'wishlist', wishlistId, filter: 'open' }));

  async function save(name: Name): Promise<void> {
    await renameWishlist.execute(wishlistId, name);
    goBack(wishlistHash);
  }

  async function deleteConfirmed(): Promise<void> {
    isDeleting = true;
    await deleteWishlist.execute(wishlistId);
    replaceWith(hashOf({ page: 'wishlists' }));
  }
</script>

{#if wishlist.value}
  <WishlistNameForm
    heading="Wunschliste bearbeiten"
    initialName={wishlist.value.name.value}
    onsubmit={save}
  >
    {#snippet extra()}
      <div class="button-row">
        <button
          class="button"
          type="button"
          onclick={(event) => deletionDialog?.open(event.currentTarget)}
        >
          <Trash2 aria-hidden="true" size="1.25em" /> Wunschliste löschen
        </button>
      </div>
      <ConfirmDialog
        bind:this={deletionDialog}
        heading="Wunschliste löschen?"
        message={wishlistDeletionMessage(wishlist.value?.name.value ?? '', wishes.length)}
        confirmLabel="Löschen"
        onconfirm={deleteConfirmed}
      />
    {/snippet}
    {#snippet actions()}
      <button class="button" type="submit"
        ><Save aria-hidden="true" size="1.25em" /> Speichern</button
      >
      <button class="button" type="button" onclick={() => goBack(wishlistHash)}>
        <X aria-hidden="true" size="1.25em" /> Abbrechen
      </button>
    {/snippet}
  </WishlistNameForm>
{:else if wishlist.status === 'missing' && !isDeleting}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}
