<script lang="ts">
  import { ChevronRight, Plus } from '@lucide/svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import type { WishlistGroup } from '../../domain/wishlistOverview';
  import { useCurrentProfile } from './currentProfile.svelte';
  import { ownerGroupHeading } from './personTexts';
  import { hashOf } from './wishlistAddresses';
  import { wishlistFilterMemory } from './wishlistFilterMemory';
  import { useWishlistModule } from './wishlistModuleContext';
  import { LOAD_FAILED_MESSAGE, removedByOwnerNote } from './wishTexts';

  const { watchWishlistOverview } = useWishlistModule();
  const profile = useCurrentProfile();
  const id = $props.id();

  let groups = $state.raw<readonly WishlistGroup[]>();
  let haveWishlistsFailed = $state(false);

  $effect(() =>
    watchWishlistOverview.execute(
      profile.me.id,
      (reported) => (groups = reported),
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
  {:else if groups?.length === 0}
    <p>Noch keine Wunschlisten.</p>
    <div class="button-row">
      <button type="button" class="button" onclick={() => navigateTo(createWishlistHash)}>
        <Plus aria-hidden="true" size="1.25em" /> Wunschliste erstellen
      </button>
    </div>
  {:else if groups}
    {#each groups as group, index (group.owner?.id ?? '')}
      <section aria-labelledby="{id}-group-{index}">
        <h2 id="{id}-group-{index}">{ownerGroupHeading(group)}</h2>
        <ul class="entry-list">
          {#each group.wishlists as wishlist (wishlist.id)}
            <li>
              <button
                type="button"
                onclick={() => navigateTo(wishlistFilterMemory.hashOf(wishlist.id))}
              >
                <span>
                  <span class="wishlist-name">{wishlist.name.value}</span>
                  {#if wishlist.removedByOwner}
                    <span class="note">
                      <span aria-hidden="true">⚠</span>
                      {removedByOwnerNote(group.owner?.name.value)}
                    </span>
                  {/if}
                </span>
                <ChevronRight aria-hidden="true" size="1.25em" />
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</div>

<style>
  .wishlist-name,
  .note {
    display: block;
  }

  .note {
    overflow-wrap: anywhere;
  }

  h2 {
    margin: 1.5rem 0 0.5rem;
    font-size: 1.25em;
    overflow-wrap: anywhere;
  }

  section:first-of-type h2 {
    margin-top: 0;
  }
</style>
