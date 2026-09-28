<script lang="ts">
  import { createWishlistModule } from '../wishlist/infrastructure/createWishlistModule';
  import WishlistPages from '../wishlist/infrastructure/ui/WishlistPages.svelte';
  import { provideWishlistModule } from '../wishlist/infrastructure/ui/wishlistModuleContext';
  import AppFrame from './layout/AppFrame.svelte';
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

<AppFrame>
  {#snippet header()}
    {#if mainPage}
      <MainNavigation active={mainPage} />
    {/if}
  {/snippet}
  {#key pageKeyOf(currentRoute.route)}
    {#if currentRoute.route.page === 'settings'}
      <SettingsPage />
    {:else}
      <WishlistPages address={currentRoute.route} />
    {/if}
  {/key}
</AppFrame>
