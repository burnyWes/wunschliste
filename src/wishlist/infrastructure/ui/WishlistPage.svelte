<script lang="ts">
  import { ChevronRight, Pencil, Plus } from '@lucide/svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import { wishesMatching, type WishFilter } from '../../domain/wishOrder';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishSummary from './WishSummary.svelte';

  let { wishlistId, filter }: { wishlistId: WishlistId; filter: WishFilter } = $props();

  const FILTERS: readonly { value: WishFilter; label: string; emptyText: string }[] = [
    { value: 'open', label: 'Offene Wünsche', emptyText: 'Noch keine offenen Wünsche.' },
    { value: 'fulfilled', label: 'Erfüllte Wünsche', emptyText: 'Noch keine erfüllten Wünsche.' },
  ];

  const { watchWishlist, watchWishesOfWishlist } = useWishlistModule();

  const wishlist = new Watched<Wishlist>();
  let wishes = $state.raw<readonly Wish[]>();

  $effect(() => watchWishlist.execute(wishlistId, (reported) => wishlist.show(reported)));
  $effect(() => watchWishesOfWishlist.execute(wishlistId, (reported) => (wishes = reported)));

  $effect(() => wishlistFilterMemory.remember(wishlistId, filter));

  const createWishHash = $derived(hashOf({ page: 'createWish', wishlistId }));
  const shownWishes = $derived(wishes && wishesMatching(wishes, filter));
  const emptyText = $derived(FILTERS.find(({ value }) => value === filter)?.emptyText);

  function show(chosenFilter: WishFilter): void {
    navigateTo(hashOf({ page: 'wishlist', wishlistId, filter: chosenFilter }));
  }
</script>

{#if wishlist.value}
  <div class="page">
    <PageHeader
      heading={wishlist.value.name.value}
      back={{ label: 'Wunschlisten', hash: hashOf({ page: 'wishlists' }) }}
    >
      {#snippet actions()}
        <button
          type="button"
          class="button button--icon"
          aria-label="Wunschliste bearbeiten"
          onclick={() => navigateTo(hashOf({ page: 'editWishlist', wishlistId }))}
        >
          <Pencil aria-hidden="true" size="1.5em" />
        </button>
        <button
          type="button"
          class="button button--icon"
          aria-label="Wunsch erstellen"
          onclick={() => navigateTo(createWishHash)}
        >
          <Plus aria-hidden="true" size="1.5em" />
        </button>
      {/snippet}
    </PageHeader>

    <div class="button-row">
      {#each FILTERS as { value, label } (value)}
        <button
          class="button"
          class:button--quiet={value !== filter}
          type="button"
          aria-pressed={value === filter}
          onclick={() => show(value)}
        >
          {label}
        </button>
      {/each}
    </div>

    {#if shownWishes?.length === 0}
      <p>{emptyText}</p>
      {#if filter === 'open'}
        <div class="button-row">
          <button type="button" class="button" onclick={() => navigateTo(createWishHash)}>
            <Plus aria-hidden="true" size="1.25em" /> Wunsch erstellen
          </button>
        </div>
      {/if}
    {:else if shownWishes}
      <ul class="entry-list">
        {#each shownWishes as wish (wish.id)}
          <li>
            <button
              type="button"
              onclick={() => navigateTo(hashOf({ page: 'wish', wishId: wish.id }))}
            >
              <span>
                <span class="wish-name">{wish.details.name.value}</span>
                <WishSummary details={wish.details} />
              </span>
              <ChevronRight aria-hidden="true" size="1.25em" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{:else if wishlist.status === 'missing'}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}

<style>
  .wish-name {
    display: block;
    font-weight: 600;
  }
</style>
