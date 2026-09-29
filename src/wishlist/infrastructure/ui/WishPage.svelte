<script lang="ts">
  import { ExternalLink, Gift, Pencil, Undo2 } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishSummary from './WishSummary.svelte';
  import { GIFT_TAKEN_BACK_ANNOUNCEMENT, WISH_GIFTED_ANNOUNCEMENT } from './wishTexts';

  let { wishId }: { wishId: WishId } = $props();

  const { watchWish, watchWishlist, giftWish, takeBackGift } = useWishlistModule();

  const wish = new Watched<Wish>();
  const wishlist = new Watched<Wishlist>();

  $effect(() =>
    watchWish.execute(
      wishId,
      (reported) => wish.show(reported),
      () => wish.fail(),
    ),
  );

  const wishlistId = $derived(wish.value?.wishlistId);

  $effect(() => {
    if (wishlistId !== undefined) {
      return watchWishlist.execute(
        wishlistId,
        (reported) => wishlist.show(reported),
        () => wishlist.fail(),
      );
    }
  });

  async function toggleGift(currentWish: Wish): Promise<void> {
    if (currentWish.gifted) {
      await takeBackGift.execute(currentWish.id);
      announce(GIFT_TAKEN_BACK_ANNOUNCEMENT);
    } else {
      await giftWish.execute(currentWish.id);
      announce(WISH_GIFTED_ANNOUNCEMENT);
    }
  }

  const backToWishlist = $derived(
    wishlist.value && {
      label: wishlist.value.name.value,
      hash: wishlistFilterMemory.hashOf(wishlist.value.id),
    },
  );
</script>

{#if wish.status === 'failed' || wishlist.status === 'failed'}
  <LoadFailed />
{:else if wish.value && wishlist.status !== 'loading'}
  {@const { name, link, description } = wish.value.details}
  <div class="page">
    <PageHeader heading={name.value} back={backToWishlist} />
    <p><WishSummary details={wish.value.details} /></p>
    {#if wish.value.gifted}
      <p class="fulfilled">Erfüllt</p>
    {/if}
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
      <button
        type="button"
        class="button"
        onclick={() => navigateTo(hashOf({ page: 'editWish', wishId }))}
      >
        <Pencil aria-hidden="true" size="1.25em" /> Bearbeiten
      </button>
      <button class="button" type="button" onclick={() => wish.value && toggleGift(wish.value)}>
        {#if wish.value.gifted}
          <Undo2 aria-hidden="true" size="1.25em" /> Schenken zurücknehmen
        {:else}
          <Gift aria-hidden="true" size="1.25em" /> Schenken
        {/if}
      </button>
    </ActionBar>
  </div>
{:else if wish.status === 'missing'}
  <NotFound message="Diesen Wunsch gibt es nicht mehr." />
{/if}

<style>
  .fulfilled {
    font-weight: 700;
  }

  .description {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
</style>
