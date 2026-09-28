<script lang="ts">
  import { announce } from '../../../shared/ui/announcements.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { WishDetails } from '../../domain/WishDetails';
  import type { Wishlist } from '../../domain/Wishlist';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishForm from './WishForm.svelte';
  import { WISH_CREATED_ANNOUNCEMENT } from './wishTexts';

  let { wishlistId }: { wishlistId: WishlistId } = $props();

  const { watchWishlist, createWish } = useWishlistModule();

  const wishlist = new Watched<Wishlist>();

  $effect(() => watchWishlist.execute(wishlistId, (reported) => wishlist.show(reported)));

  async function create(details: WishDetails): Promise<void> {
    const wishId = await createWish.execute(wishlistId, details);
    navigateTo(hashOf({ page: 'wish', wishId }));
    announce(WISH_CREATED_ANNOUNCEMENT);
  }
</script>

{#if wishlist.value}
  <WishForm
    heading="Wunsch erstellen"
    focusesName
    cancelTarget={wishlistFilterMemory.hashOf(wishlistId)}
    onsubmit={create}
  />
{:else if wishlist.status === 'missing'}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}
