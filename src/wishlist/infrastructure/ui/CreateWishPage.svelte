<script lang="ts">
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

  let { wishlistId }: { wishlistId: WishlistId } = $props();

  const { watchWishlist, createWish } = useWishlistModule();

  const wishlist = new Watched<Wishlist>();

  $effect(() => watchWishlist.execute(wishlistId, (reported) => wishlist.show(reported)));

  async function create(details: WishDetails): Promise<void> {
    const wishId = await createWish.execute(wishlistId, details);
    navigateTo(hashOf({ page: 'wish', wishId }));
  }
</script>

{#if wishlist.value}
  <WishForm
    heading="Wunsch erstellen"
    cancelTarget={wishlistFilterMemory.hashOf(wishlistId)}
    onsubmit={create}
  />
{:else if wishlist.status === 'missing'}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}
