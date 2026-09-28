<script lang="ts">
  import { ChevronRight, Plus } from '@lucide/svelte';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import type { Wishlist } from '../../domain/Wishlist';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';

  const { watchWishlists } = useWishlistModule();

  let wishlists = $state.raw<readonly Wishlist[]>();

  $effect(() => watchWishlists.execute((reported) => (wishlists = reported)));

  const createWishlistHash = hashOf({ page: 'createWishlist' });
</script>

<div class="page">
  <PageHeader heading="Wunschlisten">
    {#snippet actions()}
      <a class="button button--icon" href={createWishlistHash} aria-label="Wunschliste erstellen">
        <Plus aria-hidden="true" size="1.5em" />
      </a>
    {/snippet}
  </PageHeader>

  {#if wishlists?.length === 0}
    <p>Noch keine Wunschlisten.</p>
    <div class="button-row">
      <a class="button" href={createWishlistHash}>
        <Plus aria-hidden="true" size="1.25em" /> Wunschliste erstellen
      </a>
    </div>
  {:else if wishlists}
    <ul class="link-list">
      {#each wishlists as wishlist (wishlist.id)}
        <li>
          <a href={hashOf({ page: 'wishlist', wishlistId: wishlist.id, filter: 'open' })}>
            <span>{wishlist.name.value}</span>
            <ChevronRight aria-hidden="true" size="1.25em" />
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>
