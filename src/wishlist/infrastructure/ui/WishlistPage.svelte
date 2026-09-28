<script lang="ts">
  import { ChevronRight, Pencil, Plus } from '@lucide/svelte';
  import { replaceWith } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import { wishesMatching, type WishFilter } from '../../domain/wishOrder';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
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

  const createWishHash = $derived(hashOf({ page: 'createWish', wishlistId }));
  const shownWishes = $derived(wishes && wishesMatching(wishes, filter));
  const emptyText = $derived(FILTERS.find(({ value }) => value === filter)?.emptyText);

  function show(chosenFilter: WishFilter): void {
    replaceWith(hashOf({ page: 'wishlist', wishlistId, filter: chosenFilter }));
  }
</script>

{#if wishlist.value}
  <div class="page">
    <PageHeader
      heading={wishlist.value.name.value}
      back={{ label: 'Wunschlisten', hash: hashOf({ page: 'wishlists' }) }}
    >
      {#snippet actions()}
        <a
          class="button button--icon"
          href={hashOf({ page: 'editWishlist', wishlistId })}
          aria-label="Wunschliste bearbeiten"
        >
          <Pencil aria-hidden="true" size="1.5em" />
        </a>
        <a class="button button--icon" href={createWishHash} aria-label="Wunsch erstellen">
          <Plus aria-hidden="true" size="1.5em" />
        </a>
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
          <a class="button" href={createWishHash}>
            <Plus aria-hidden="true" size="1.25em" /> Wunsch erstellen
          </a>
        </div>
      {/if}
    {:else if shownWishes}
      <ul class="link-list">
        {#each shownWishes as wish (wish.id)}
          <li>
            <a href={hashOf({ page: 'wish', wishId: wish.id })}>
              <span>
                <span class="wish-name">{wish.details.name.value}</span>
                <WishSummary details={wish.details} />
              </span>
              <ChevronRight aria-hidden="true" size="1.25em" />
            </a>
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
