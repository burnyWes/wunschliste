<script lang="ts">
  import { Save, Trash2, X } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Name } from '../../domain/Name';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishlistNameForm from './WishlistNameForm.svelte';
  import {
    SAVED_ANNOUNCEMENT,
    wishlistDeletedAnnouncement,
    wishlistDeletionMessage,
  } from './wishTexts';

  let { wishlistId }: { wishlistId: WishlistId } = $props();

  const { watchWishlist, watchWishesOfWishlist, renameWishlist, deleteWishlist } =
    useWishlistModule();

  const wishlist = new Watched<Wishlist>();
  let wishes = $state.raw<readonly Wish[]>([]);
  let haveWishesFailed = $state(false);
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

  $effect(() =>
    watchWishlist.execute(
      wishlistId,
      (reported) => wishlist.show(reported),
      () => wishlist.fail(),
    ),
  );
  $effect(() =>
    watchWishesOfWishlist.execute(
      wishlistId,
      (reported) => (wishes = reported),
      () => (haveWishesFailed = true),
    ),
  );

  const wishlistHash = $derived(wishlistFilterMemory.hashOf(wishlistId));

  async function save(name: Name): Promise<void> {
    await renameWishlist.execute(wishlistId, name);
    navigateTo(wishlistHash);
    announce(SAVED_ANNOUNCEMENT);
  }

  async function deleteConfirmed(): Promise<void> {
    isDeleting = true;
    const deletedName = wishlist.value?.name.value ?? '';
    await deleteWishlist.execute(wishlistId);
    navigateTo(hashOf({ page: 'wishlists' }));
    announce(wishlistDeletedAnnouncement(deletedName));
  }
</script>

{#if wishlist.status === 'failed' || haveWishesFailed}
  <LoadFailed />
{:else if wishlist.value}
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
      <button class="button" type="button" onclick={() => navigateTo(wishlistHash)}>
        <X aria-hidden="true" size="1.25em" /> Abbrechen
      </button>
    {/snippet}
  </WishlistNameForm>
{:else if wishlist.status === 'missing' && !isDeleting}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}
