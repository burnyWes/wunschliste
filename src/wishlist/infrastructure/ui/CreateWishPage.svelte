<script lang="ts">
  import { announce } from '../../../shared/ui/announcements.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Person } from '../../domain/Person';
  import { perspectiveOf } from '../../domain/Perspective';
  import type { WishTraits } from '../../domain/Wish';
  import type { WishDetails } from '../../domain/WishDetails';
  import type { Wishlist } from '../../domain/Wishlist';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import { useCurrentProfile } from './currentProfile.svelte';
  import WishForm from './WishForm.svelte';
  import { secretHint, WISH_CREATED_ANNOUNCEMENT } from './wishTexts';

  let { wishlistId }: { wishlistId: WishlistId } = $props();

  const { watchWishlist, watchPerson, createWish } = useWishlistModule();
  const profile = useCurrentProfile();

  const wishlist = new Watched<Wishlist>();
  let owner = $state.raw<Person>();

  $effect(() =>
    watchWishlist.execute(
      wishlistId,
      (reported) => wishlist.show(reported),
      () => wishlist.fail(),
    ),
  );

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

  const isVisible = $derived(
    wishlist.value !== undefined && !perspectiveOf(wishlist.value, profile.me.id).wishlistIsHidden,
  );
  const isWishlistOfSomeoneElse = $derived(ownerId !== undefined && ownerId !== profile.me.id);

  async function create(details: WishDetails, traits: WishTraits): Promise<void> {
    const wishId = await createWish.execute(wishlistId, details, traits, profile.me.id);
    navigateTo(hashOf({ page: 'wish', wishId }));
    announce(WISH_CREATED_ANNOUNCEMENT);
  }
</script>

{#if wishlist.value && isVisible}
  <WishForm
    heading="Wunsch erstellen"
    focusesName
    secret={isWishlistOfSomeoneElse
      ? { initial: true, hint: secretHint(owner?.name.value ?? 'Die Besitzerin') }
      : undefined}
    repeatable={{ initial: false, locked: false }}
    cancelTarget={wishlistFilterMemory.hashOf(wishlistId)}
    onsubmit={create}
  />
{:else if wishlist.status === 'failed'}
  <LoadFailed />
{:else if wishlist.status === 'missing' || wishlist.value}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}
