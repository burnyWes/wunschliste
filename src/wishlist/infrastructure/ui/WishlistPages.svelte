<script lang="ts">
  import CreateWishlistPage from './CreateWishlistPage.svelte';
  import NotFound from './NotFound.svelte';
  import type { WishlistAddress } from './wishlistAddresses';
  import WishlistPage from './WishlistPage.svelte';
  import WishlistsPage from './WishlistsPage.svelte';

  let { address }: { address: WishlistAddress } = $props();
</script>

{#if address.page === 'wishlists'}
  <WishlistsPage />
{:else if address.page === 'createWishlist'}
  <CreateWishlistPage />
{:else if address.page === 'wishlist'}
  <WishlistPage wishlistId={address.wishlistId} />
{:else}
  <NotFound message="Diese Seite gibt es noch nicht." />
{/if}
