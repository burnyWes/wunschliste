<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import { perspectiveOf } from '../../domain/Perspective';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import { moveTargetsOf } from '../../domain/wishMove';
  import { viewOfWish } from '../../domain/wishView';
  import { useCurrentProfile } from './currentProfile.svelte';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import {
    MOVE_WISH_HEADING,
    NO_MOVE_TARGET_MESSAGE,
    wishLocationNote,
    wishMovedAnnouncement,
  } from './wishTexts';

  let { wishId }: { wishId: WishId } = $props();

  const { watchWish, watchWishlist, watchWishlistsOwnedBy, moveWish } = useWishlistModule();
  const profile = useCurrentProfile();

  const wish = new Watched<Wish>();
  const wishlist = new Watched<Wishlist>();
  const ownedWishlists = new Watched<readonly Wishlist[]>();
  let isMoving = $state(false);

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
      return watchWishlistsOwnedBy.execute(
        ownerId,
        (reported) => ownedWishlists.show(reported),
        () => ownedWishlists.fail(),
      );
    }
  });

  const view = $derived(
    wish.value &&
      wishlist.value &&
      viewOfWish(wish.value, perspectiveOf(wishlist.value, profile.me.id)),
  );
  const isGone = $derived(
    wish.status === 'missing' ||
      wishlist.status === 'missing' ||
      (view !== undefined && view.visibility !== 'shown'),
  );
  const hasFailed = $derived(
    wish.status === 'failed' || wishlist.status === 'failed' || ownedWishlists.status === 'failed',
  );

  const back = $derived({ label: 'Wunsch bearbeiten', hash: hashOf({ page: 'editWish', wishId }) });

  async function moveInto(target: Wishlist): Promise<void> {
    isMoving = true;
    try {
      await moveWish.execute(wishId, target.id, profile.me.id);
    } catch (error) {
      isMoving = false;
      throw error;
    }
    navigateTo(hashOf({ page: 'wish', wishId }));
    announce(wishMovedAnnouncement(target.name.value));
  }
</script>

{#if !isMoving}
  {#if hasFailed}
    <LoadFailed />
  {:else if view?.visibility === 'shown' && wishlist.value}
    <div class="page">
      <PageHeader heading={MOVE_WISH_HEADING} {back} />
      <p class="location">
        {wishLocationNote(view.wish.details.name.value, wishlist.value.name.value)}
      </p>
      {#if ownedWishlists.value}
        {@const targets = moveTargetsOf(wishlist.value, ownedWishlists.value)}
        {#if targets.length === 0}
          <p>{NO_MOVE_TARGET_MESSAGE}</p>
        {:else}
          <ul class="entry-list">
            {#each targets as target (target.id)}
              <li>
                <button type="button" onclick={() => moveInto(target)}>
                  <span>{target.name.value}</span>
                  <ChevronRight aria-hidden="true" size="1.25em" />
                </button>
              </li>
            {/each}
          </ul>
        {/if}
      {/if}
    </div>
  {:else if isGone}
    <NotFound message="Diesen Wunsch gibt es nicht mehr." />
  {/if}
{/if}

<style>
  .location {
    overflow-wrap: anywhere;
  }
</style>
