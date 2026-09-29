<script lang="ts">
  import { Check, ExternalLink, Gift, Pencil, Trash2, Undo2 } from '@lucide/svelte';
  import type { Component } from 'svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import type { Person } from '../../domain/Person';
  import { perspectiveOf } from '../../domain/Perspective';
  import type { Wish } from '../../domain/Wish';
  import type { WishAction } from '../../domain/wishActions';
  import type { Wishlist } from '../../domain/Wishlist';
  import { viewOfWish } from '../../domain/wishView';
  import { useCurrentProfile } from './currentProfile.svelte';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishStateNotes from './WishStateNotes.svelte';
  import WishSummary from './WishSummary.svelte';
  import {
    BRAND_PREFIX,
    FINAL_DELETION_LABEL,
    WISH_ACTION_ANNOUNCEMENTS,
    WISH_ACTION_LABELS,
    wishDeletedAnnouncement,
    wishDeletionMessage,
    wishRemovedByOwnerMessage,
  } from './wishTexts';

  let { wishId }: { wishId: WishId } = $props();

  const WISH_ACTION_ICONS: Record<
    WishAction,
    Component<{ 'aria-hidden': 'true'; size: string }>
  > = {
    gift: Gift,
    takeBackGift: Undo2,
    receive: Check,
    undoReceive: Undo2,
    handOver: Check,
    undoHandOver: Undo2,
  };

  const { watchWish, watchWishlist, watchPersons, changeWishState, deleteWish } =
    useWishlistModule();
  const profile = useCurrentProfile();

  const wish = new Watched<Wish>();
  const wishlist = new Watched<Wishlist>();
  let persons = $state.raw<readonly Person[]>([]);
  let editButton = $state<HTMLButtonElement>();
  let stateButton = $state<HTMLButtonElement>();
  let focusesStateButtonOnChange = false;
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

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

  $effect(() =>
    watchPersons.execute(
      (reported) => (persons = reported),
      () => {},
    ),
  );

  const view = $derived(
    wish.value &&
      wishlist.value &&
      viewOfWish(wish.value, perspectiveOf(wishlist.value, profile.me.id)),
  );

  $effect(() => {
    if (view && focusesStateButtonOnChange) {
      focusesStateButtonOnChange = false;
      (stateButton ?? editButton)?.focus();
    }
  });

  async function perform(action: WishAction): Promise<void> {
    focusesStateButtonOnChange = true;
    await changeWishState.execute(wishId, profile.me.id, action);
    announce(WISH_ACTION_ANNOUNCEMENTS[action]);
  }

  const ownerName = $derived(persons.find(({ id }) => id === wishlist.value?.ownerId)?.name.value);

  async function deleteForGood(wishlistHash: string): Promise<void> {
    isDeleting = true;
    const deletedName = wish.value?.details.name.value ?? '';
    await deleteWish.execute(wishId, profile.me.id);
    navigateTo(wishlistHash);
    announce(wishDeletedAnnouncement(deletedName));
  }

  const backToWishlist = $derived(
    wishlist.value && {
      label: wishlist.value.name.value,
      hash: wishlistFilterMemory.hashOf(wishlist.value.id),
    },
  );
</script>

{#snippet actionLabel(action: WishAction)}
  {@const Icon = WISH_ACTION_ICONS[action]}
  <Icon aria-hidden="true" size="1.25em" />
  {WISH_ACTION_LABELS[action]}
{/snippet}

{#if wish.status === 'failed' || wishlist.status === 'failed'}
  <LoadFailed />
{:else if view?.visibility === 'shown'}
  {@const { name, brand, link, description, rating, price } = view.wish.details}
  {@const { primaryAction, secondaryAction } = view}
  <div class="page">
    <PageHeader heading={name.value} back={backToWishlist} />
    {#if view.removedByOwner}
      {@const wishlistHash = wishlistFilterMemory.hashOf(view.wish.wishlistId)}
      <p class="warning">
        <span aria-hidden="true">⚠</span>
        {wishRemovedByOwnerMessage(ownerName)}
      </p>
      <div class="button-row">
        <button
          class="button"
          type="button"
          onclick={(event) => deletionDialog?.open(event.currentTarget)}
        >
          <Trash2 aria-hidden="true" size="1.25em" />
          {FINAL_DELETION_LABEL}
        </button>
      </div>
      <ConfirmDialog
        bind:this={deletionDialog}
        heading="Wunsch endgültig löschen?"
        message={wishDeletionMessage(name.value)}
        confirmLabel="Löschen"
        onconfirm={() => deleteForGood(wishlistHash)}
      />
    {/if}
    <WishStateNotes {view} {persons} {ownerName} variant="page" />
    {#if brand}
      <p class="brand"><span class="visually-hidden">{BRAND_PREFIX}</span>{brand.value}</p>
    {/if}
    {#if rating || price}
      <p><WishSummary details={view.wish.details} includesBrand={false} /></p>
    {/if}
    {#if secondaryAction}
      <div class="button-row">
        <button class="button" type="button" onclick={() => perform(secondaryAction)}>
          {@render actionLabel(secondaryAction)}
        </button>
      </div>
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
        bind:this={editButton}
        type="button"
        class="button"
        onclick={() => navigateTo(hashOf({ page: 'editWish', wishId }))}
      >
        <Pencil aria-hidden="true" size="1.25em" /> Bearbeiten
      </button>
      {#if primaryAction}
        <button
          bind:this={stateButton}
          class="button"
          type="button"
          onclick={() => perform(primaryAction)}
        >
          {@render actionLabel(primaryAction)}
        </button>
      {/if}
    </ActionBar>
  </div>
{:else if (wish.status === 'missing' || wishlist.status === 'missing' || view) && !isDeleting}
  <NotFound message="Diesen Wunsch gibt es nicht mehr." />
{/if}

<style>
  .warning {
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .brand {
    overflow-wrap: anywhere;
  }

  .description {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
</style>
