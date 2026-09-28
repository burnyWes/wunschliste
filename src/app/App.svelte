<script lang="ts">
  import WishlistsPage from '../wishlist/infrastructure/ui/WishlistsPage.svelte';
  import MainNavigation from './layout/MainNavigation.svelte';
  import { CurrentRoute } from './router/currentRoute.svelte';
  import SettingsPage from './settings/SettingsPage.svelte';

  const currentRoute = new CurrentRoute();

  $effect(() => currentRoute.followHashChanges());
</script>

<header>
  <div class="status-bar-backdrop"></div>
  <MainNavigation route={currentRoute.route} />
</header>

<main>
  {#if currentRoute.route === 'settings'}
    <SettingsPage />
  {:else}
    <WishlistsPage />
  {/if}
</main>

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
    padding: 0 1rem 1rem;
  }
</style>
