<script lang="ts">
  import { ArrowRightLeft, Trash2 } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import type { Person } from '../../domain/Person';
  import { perspectiveOf } from '../../domain/Perspective';
  import { canChangeRepeatability, type Wish, type WishTraits } from '../../domain/Wish';
  import type { WishDetails } from '../../domain/WishDetails';
  import type { Wishlist } from '../../domain/Wishlist';
  import { moveTargetsOf } from '../../domain/wishMove';
  import { viewOfWish } from '../../domain/wishView';
  import { useCurrentProfile } from './currentProfile.svelte';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishForm from './WishForm.svelte';
  import {
    MOVE_WISH_LABEL,
    SAVED_ANNOUNCEMENT,
    secretHint,
    wishDeletedAnnouncement,
    wishDeletionMessage,
    wishDetailsInputOf,
  } from './wishTexts';

  let { wishId }: { wishId: WishId } = $props();

  const { watchWish, watchWishlist, watchWishlistsOwnedBy, watchPerson, editWish, deleteWish } =
    useWishlistModule();
  const profile = useCurrentProfile();

  const wish = new Watched<Wish>();
  const wishlist = new Watched<Wishlist>();
  let owner = $state.raw<Person>();
  let ownedWishlists = $state.raw<readonly Wishlist[]>();
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

  $effect(() =>
    watchWish.execute(
      wishId,
      (reported) => wish.show(reported),
      () => wish.fail(),
    ),
  );

  const wishlistId = $derived(wish.value?.wishlistId);

  $effect(() => {
    if (wishlistId !== undefined) {
      return watchWishlist.execute(
        wishlistId,
        (reported) => wishlist.show(reported),
        () => wishlist.fail(),
      );
    }
  });

  const ownerId = $derived(wishlist.value?.ownerId);

  $effect(() => {
    if (ownerId !== undefined) {
      return watchPerson.execute(
        ownerId,
        (reported) => (owner = reported),
        () => {},
      );
    }
  });

  $effect(() => {
    if (ownerId !== undefined) {
      return watchWishlistsOwnedBy.execute(
        ownerId,
        (reported) => (ownedWishlists = reported),
        () => {},
      );
    }
  });

  const moveTargets = $derived(
    wishlist.value ? moveTargetsOf(wishlist.value, ownedWishlists ?? []) : [],
  );

  const view = $derived(
    wish.value &&
      wishlist.value &&
      viewOfWish(wish.value, perspectiveOf(wishlist.value, profile.me.id)),
  );
  const isShown = $derived(view?.visibility === 'shown');
  const isGone = $derived(
    wish.status === 'missing' ||
      wishlist.status === 'missing' ||
      (view !== undefined && view.visibility !== 'shown'),
  );

  const wishHash = $derived(hashOf({ page: 'wish', wishId }));

  async function save(details: WishDetails, traits: WishTraits): Promise<void> {
    await editWish.execute(wishId, details, traits, profile.me.id);
    navigateTo(wishHash);
    announce(SAVED_ANNOUNCEMENT);
  }

  async function deleteConfirmed(wishlistHash: string): Promise<void> {
    isDeleting = true;
    const deletedName = wish.value?.details.name.value ?? '';
    await deleteWish.execute(wishId, profile.me.id);
    navigateTo(wishlistHash);
    announce(wishDeletedAnnouncement(deletedName));
  }
</script>

{#if wish.status === 'failed' || wishlist.status === 'failed'}
  <LoadFailed />
{:else if view && isShown}
  {@const wishlistHash = wishlistFilterMemory.hashOf(view.wish.wishlistId)}
  <WishForm
    heading="Wunsch bearbeiten"
    initialInput={wishDetailsInputOf(view.wish.details)}
    secret={view.wish.secret
      ? { initial: true, hint: secretHint(owner?.name.value ?? 'Die Besitzerin') }
      : undefined}
    repeatable={{
      initial: view.wish.repeatable,
      locked: !canChangeRepeatability(view.wish),
    }}
    cancelTarget={wishHash}
    onsubmit={save}
  >
    {#snippet extra()}
      {#if moveTargets.length > 0}
        <div class="button-row">
          <button
            class="button"
            type="button"
            onclick={() => navigateTo(hashOf({ page: 'moveWish', wishId }))}
          >
            <ArrowRightLeft aria-hidden="true" size="1.25em" />
            {MOVE_WISH_LABEL}
          </button>
        </div>
      {/if}
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
{:else if isGone && !isDeleting}
  <NotFound message="Diesen Wunsch gibt es nicht mehr." />
{/if}
