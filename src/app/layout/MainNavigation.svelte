<script lang="ts">
  import { Settings } from '@lucide/svelte';
  import { navigationTargetOf, type NavigationTarget, type Route } from '../router/routes';

  let { route }: { route: Route } = $props();

  function currentMarkerOf(target: NavigationTarget): 'page' | 'true' | undefined {
    if (route.page === target) {
      return 'page';
    }
    return navigationTargetOf(route) === target ? 'true' : undefined;
  }

  const wishlistsMarker = $derived(currentMarkerOf('wishlists'));
  const settingsMarker = $derived(currentMarkerOf('settings'));
</script>

<nav aria-label="Hauptnavigation">
  <a
    href="#/"
    class="button"
    class:button--quiet={wishlistsMarker === undefined}
    aria-current={wishlistsMarker}>Wunschlisten</a
  >
  <a
    href="#/einstellungen"
    class="button"
    class:button--quiet={settingsMarker === undefined}
    aria-current={settingsMarker}
  >
    <Settings aria-hidden="true" size="1.25em" /> Einstellungen
  </a>
</nav>

<style>
  nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }
</style>
