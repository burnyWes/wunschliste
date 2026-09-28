<script lang="ts">
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Wishlist } from '../../domain/Wishlist';
  import NotFound from './NotFound.svelte';
  import { useWishlistModule } from './wishlistModuleContext';

  let { wishlistId }: { wishlistId: WishlistId } = $props();

  const { watchWishlist } = useWishlistModule();

  const wishlist = new Watched<Wishlist>();

  $effect(() => watchWishlist.execute(wishlistId, (reported) => wishlist.show(reported)));
</script>

{#if wishlist.value}
  <div class="page">
    <PageHeader heading={wishlist.value.name.value} />
    <p>Noch keine offenen Wünsche.</p>
  </div>
{:else if wishlist.status === 'missing'}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}
