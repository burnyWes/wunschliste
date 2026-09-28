<script lang="ts">
  import Announcer from '../shared/ui/Announcer.svelte';
  import { createWishlistModule } from '../wishlist/infrastructure/createWishlistModule';
  import WishlistPages from '../wishlist/infrastructure/ui/WishlistPages.svelte';
  import { provideWishlistModule } from '../wishlist/infrastructure/ui/wishlistModuleContext';
  import MainNavigation from './layout/MainNavigation.svelte';
  import { CurrentRoute } from './router/currentRoute.svelte';
  import { mainPageOf, pageKeyOf } from './router/routes';
  import SettingsPage from './settings/SettingsPage.svelte';

  provideWishlistModule(
    createWishlistModule({
      storage: localStorage,
      storageEvents: window,
      idGenerator: { next: () => crypto.randomUUID() },
    }),
  );

  const currentRoute = new CurrentRoute();

  $effect(() => currentRoute.followHashChanges());

  const mainPage = $derived(mainPageOf(currentRoute.route));
</script>

<header>
  <div class="status-bar-backdrop"></div>
  {#if mainPage}
    <MainNavigation active={mainPage} />
  {/if}
</header>

<main>
  {#key pageKeyOf(currentRoute.route)}
    {#if currentRoute.route.page === 'settings'}
      <SettingsPage />
    {:else}
      <WishlistPages address={currentRoute.route} />
    {/if}
  {/key}
</main>

<Announcer />

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 1;
    background-color: var(--color-background);
  }

  .status-bar-backdrop {
    height: env(safe-area-inset-top);
    background-color: var(--color-status-bar);
  }

  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 0 1rem calc(1rem + env(safe-area-inset-bottom));
  }

  main:has(:global(.action-bar)) {
    padding-bottom: 0;
  }
</style>
