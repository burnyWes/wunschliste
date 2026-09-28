<script lang="ts">
  import CreateWishlistPage from './CreateWishlistPage.svelte';
  import CreateWishPage from './CreateWishPage.svelte';
  import EditWishlistPage from './EditWishlistPage.svelte';
  import EditWishPage from './EditWishPage.svelte';
  import type { WishlistAddress } from './wishlistAddresses';
  import WishlistPage from './WishlistPage.svelte';
  import WishlistsPage from './WishlistsPage.svelte';
  import WishPage from './WishPage.svelte';

  let { address }: { address: WishlistAddress } = $props();
</script>

{#if address.page === 'wishlists'}
  <WishlistsPage />
{:else if address.page === 'createWishlist'}
  <CreateWishlistPage />
{:else if address.page === 'wishlist'}
  <WishlistPage wishlistId={address.wishlistId} filter={address.filter} />
{:else if address.page === 'editWishlist'}
  <EditWishlistPage wishlistId={address.wishlistId} />
{:else if address.page === 'createWish'}
  <CreateWishPage wishlistId={address.wishlistId} />
{:else if address.page === 'wish'}
  <WishPage wishId={address.wishId} />
{:else}
  <EditWishPage wishId={address.wishId} />
{/if}
