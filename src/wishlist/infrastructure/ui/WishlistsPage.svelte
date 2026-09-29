<script lang="ts">
  import { ChevronRight, Plus } from '@lucide/svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import type { Wishlist } from '../../domain/Wishlist';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import { LOAD_FAILED_MESSAGE } from './wishTexts';

  const { watchWishlists } = useWishlistModule();

  let wishlists = $state.raw<readonly Wishlist[]>();
  let haveWishlistsFailed = $state(false);

  $effect(() =>
    watchWishlists.execute(
      (reported) => (wishlists = reported),
      () => (haveWishlistsFailed = true),
    ),
  );

  const createWishlistHash = hashOf({ page: 'createWishlist' });
</script>

<div class="page">
  <PageHeader heading="Wunschlisten">
    {#snippet actions()}
      <button
        type="button"
        class="button button--icon"
        aria-label="Wunschliste erstellen"
        onclick={() => navigateTo(createWishlistHash)}
      >
        <Plus aria-hidden="true" size="1.5em" />
      </button>
    {/snippet}
  </PageHeader>

  {#if haveWishlistsFailed}
    <p>{LOAD_FAILED_MESSAGE}</p>
  {:else if wishlists?.length === 0}
    <p>Noch keine Wunschlisten.</p>
    <div class="button-row">
      <button type="button" class="button" onclick={() => navigateTo(createWishlistHash)}>
        <Plus aria-hidden="true" size="1.25em" /> Wunschliste erstellen
      </button>
    </div>
  {:else if wishlists}
    <ul class="entry-list">
      {#each wishlists as wishlist (wishlist.id)}
        <li>
          <button
            type="button"
            onclick={() => navigateTo(wishlistFilterMemory.hashOf(wishlist.id))}
          >
            <span>{wishlist.name.value}</span>
            <ChevronRight aria-hidden="true" size="1.25em" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
