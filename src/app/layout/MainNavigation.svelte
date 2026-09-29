<script lang="ts">
  import { List, Settings } from '@lucide/svelte';
  import { navigateTo } from '../../shared/ui/navigation';
  import { hashFor, type MainPage } from '../router/routes';

  let { active }: { active: MainPage } = $props();
</script>

<nav aria-label="Hauptnavigation">
  <button
    type="button"
    class="button"
    class:button--quiet={active !== 'wishlists'}
    aria-current={active === 'wishlists' ? 'page' : undefined}
    onclick={() => navigateTo(hashFor({ page: 'wishlists' }))}
  >
    <List aria-hidden="true" size="1.25em" /> Wunschlisten
  </button>
  <button
    type="button"
    class="button"
    class:button--quiet={active !== 'settings'}
    aria-current={active === 'settings' ? 'page' : undefined}
    onclick={() => navigateTo(hashFor({ page: 'settings' }))}
  >
    <Settings aria-hidden="true" size="1.25em" /> Einstellungen
  </button>
</nav>

<style>
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
  }

  nav > .button {
    flex: 1 1 0;
  }
</style>
