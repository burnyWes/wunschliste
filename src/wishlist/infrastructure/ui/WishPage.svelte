<script lang="ts">
  import { ExternalLink, Pencil } from '@lucide/svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishSummary from './WishSummary.svelte';

  let { wishId }: { wishId: WishId } = $props();

  const { watchWish, watchWishlist } = useWishlistModule();

  const wish = new Watched<Wish>();
  const wishlist = new Watched<Wishlist>();

  $effect(() => watchWish.execute(wishId, (reported) => wish.show(reported)));

  const wishlistId = $derived(wish.value?.wishlistId);

  $effect(() => {
    if (wishlistId !== undefined) {
      return watchWishlist.execute(wishlistId, (reported) => wishlist.show(reported));
    }
  });

  const backToWishlist = $derived(
    wishlist.value && {
      label: wishlist.value.name.value,
      hash: hashOf({ page: 'wishlist', wishlistId: wishlist.value.id, filter: 'open' }),
    },
  );
</script>

{#if wish.value && wishlist.status !== 'loading'}
  {@const { name, link, description } = wish.value.details}
  <div class="page">
    <PageHeader heading={name.value} back={backToWishlist} />
    <p><WishSummary details={wish.value.details} /></p>
    {#if link}
      <div class="button-row">
        <a class="button" href={link.href} target="_blank" rel="noopener">
          <ExternalLink aria-hidden="true" size="1.25em" /> Zum Angebot auf {link.siteName}
        </a>
      </div>
    {/if}
    {#if description}
      <p class="description">{description.value}</p>
    {/if}
    <ActionBar>
      <a class="button" href={hashOf({ page: 'editWish', wishId })}>
        <Pencil aria-hidden="true" size="1.25em" /> Bearbeiten
      </a>
    </ActionBar>
  </div>
{:else if wish.status === 'missing'}
  <NotFound message="Diesen Wunsch gibt es nicht mehr." />
{/if}

<style>
  .description {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
</style>
