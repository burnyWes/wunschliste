<script lang="ts">
  import { ChevronRight, Gift, PackageOpen, Pencil, Plus, Trash2 } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishlistId } from '../../domain/ids';
  import type { Person } from '../../domain/Person';
  import { perspectiveOf } from '../../domain/Perspective';
  import type { Wish } from '../../domain/Wish';
  import type { Wishlist } from '../../domain/Wishlist';
  import {
    countWishes,
    viewOfWishes,
    visibleWishCount,
    type WishFilter,
  } from '../../domain/wishView';
  import { useCurrentProfile } from './currentProfile.svelte';
  import LoadFailed from './LoadFailed.svelte';
  import NotFound from './NotFound.svelte';
  import { ownerLine } from './personTexts';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishStateNotes from './WishStateNotes.svelte';
  import WishSummary from './WishSummary.svelte';
  import {
    FINAL_DELETION_LABEL,
    LOAD_FAILED_MESSAGE,
    surpriseLine,
    wishlistDeletedAnnouncement,
    wishlistDeletionMessage,
    wishlistRemovedByOwnerMessage,
  } from './wishTexts';

  let { wishlistId, filter }: { wishlistId: WishlistId; filter: WishFilter } = $props();

  const FILTERS: readonly {
    value: WishFilter;
    label: string;
    icon: typeof Gift;
    emptyText: string;
  }[] = [
    { value: 'open', label: 'Noch offen', icon: Gift, emptyText: 'Noch keine offenen Wünsche.' },
    {
      value: 'fulfilled',
      label: 'Erfüllt',
      icon: PackageOpen,
      emptyText: 'Noch keine erfüllten Wünsche.',
    },
  ];

  const { watchWishlist, watchWishesOfWishlist, watchPersons, deleteWishlist } =
    useWishlistModule();
  const profile = useCurrentProfile();

  const wishlist = new Watched<Wishlist>();
  let wishes = $state.raw<readonly Wish[]>();
  let haveWishesFailed = $state(false);
  let persons = $state.raw<readonly Person[]>([]);
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

  $effect(() =>
    watchWishlist.execute(
      wishlistId,
      (reported) => wishlist.show(reported),
      () => wishlist.fail(),
    ),
  );
  $effect(() =>
    watchWishesOfWishlist.execute(
      wishlistId,
      (reported) => (wishes = reported),
      () => (haveWishesFailed = true),
    ),
  );

  $effect(() =>
    watchPersons.execute(
      (reported) => (persons = reported),
      () => {},
    ),
  );

  $effect(() => wishlistFilterMemory.remember(wishlistId, filter));

  const owner = $derived(persons.find(({ id }) => id === wishlist.value?.ownerId));
  const perspective = $derived(wishlist.value && perspectiveOf(wishlist.value, profile.me.id));
  const createWishHash = $derived(hashOf({ page: 'createWish', wishlistId }));
  const wishesView = $derived(wishes && perspective && viewOfWishes(wishes, perspective, filter));
  const wishCounts = $derived(wishes && perspective && countWishes(wishes, perspective));
  const emptyText = $derived(FILTERS.find(({ value }) => value === filter)?.emptyText);

  async function deleteForGood(): Promise<void> {
    isDeleting = true;
    const deletedName = wishlist.value?.name.value ?? '';
    await deleteWishlist.execute(wishlistId, profile.me.id);
    navigateTo(hashOf({ page: 'wishlists' }));
    announce(wishlistDeletedAnnouncement(deletedName));
  }

  function show(chosenFilter: WishFilter): void {
    navigateTo(hashOf({ page: 'wishlist', wishlistId, filter: chosenFilter }));
  }
</script>

{#if wishlist.status === 'failed'}
  <LoadFailed />
{:else if wishlist.value && perspective && !perspective.wishlistIsHidden}
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

    {#if owner}
      <p class="owner">{ownerLine(owner, owner.id === profile.me.id)}</p>
    {/if}

    {#if wishlist.value.removedByOwner}
      <p class="warning">
        <span aria-hidden="true">⚠</span>
        {wishlistRemovedByOwnerMessage(owner?.name.value)}
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
        heading="Wunschliste endgültig löschen?"
        message={wishlistDeletionMessage(
          wishlist.value.name.value,
          visibleWishCount(wishes ?? [], perspective),
        )}
        confirmLabel="Löschen"
        onconfirm={deleteForGood}
      />
    {/if}

    <div class="filters">
      {#each FILTERS as { value, label, icon: Icon } (value)}
        <button
          class="button"
          class:button--quiet={value !== filter}
          type="button"
          aria-pressed={value === filter}
          onclick={() => show(value)}
        >
          <Icon aria-hidden="true" size="1.25em" />
          {label}
          {#if wishCounts}
            <span class="count">{wishCounts[value]}</span>
          {/if}
        </button>
      {/each}
    </div>

    {#if haveWishesFailed}
      <p>{LOAD_FAILED_MESSAGE}</p>
    {:else if wishesView}
      {@const { entries, surpriseCount } = wishesView}
      {#if entries.length === 0 && surpriseCount === 0}
        <p>{emptyText}</p>
      {:else}
        <ul class="entry-list">
          {#each entries as view (view.wish.id)}
            {@const { wish } = view}
            <li>
              <button
                type="button"
                onclick={() => navigateTo(hashOf({ page: 'wish', wishId: wish.id }))}
              >
                <span>
                  <span class="wish-name">{wish.details.name.value}</span>
                  <WishSummary details={wish.details} />
                  <WishStateNotes {view} {persons} ownerName={owner?.name.value} variant="entry" />
                </span>
                <ChevronRight aria-hidden="true" size="1.25em" />
              </button>
            </li>
          {/each}
          {#if surpriseCount > 0}
            <li class="surprise">
              <span aria-hidden="true">🎁</span>
              {surpriseLine(surpriseCount)}
            </li>
          {/if}
        </ul>
      {/if}
      {#if entries.length === 0 && filter === 'open'}
        <div class="button-row">
          <button type="button" class="button" onclick={() => navigateTo(createWishHash)}>
            <Plus aria-hidden="true" size="1.25em" /> Wunsch erstellen
          </button>
        </div>
      {/if}
    {/if}
  </div>
{:else if (wishlist.status === 'missing' || perspective?.wishlistIsHidden) && !isDeleting}
  <NotFound message="Diese Wunschliste gibt es nicht mehr." />
{/if}

<style>
  .filters {
    display: flex;
    gap: 0.5rem;
    margin: 1rem 0;
  }

  .filters > .button {
    flex: 1 1 0;
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .count {
    margin-inline-start: 0.5em;
    font-variant-numeric: tabular-nums;
  }

  .owner {
    margin: -0.5rem 0 0;
    overflow-wrap: anywhere;
  }

  .warning {
    font-weight: 700;
    overflow-wrap: anywhere;
  }

  .surprise {
    padding: 0.75rem 0;
  }

  .wish-name {
    display: block;
    font-weight: 600;
  }
</style>
