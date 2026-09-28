<script lang="ts">
  import { Settings } from '@lucide/svelte';
  import type { Route } from '../router/routes';

  let { route }: { route: Route } = $props();
</script>

<nav aria-label="Hauptnavigation">
  <a href="#/" aria-current={route === 'wishlists' ? 'page' : undefined}>Wunschlisten</a>
  <a href="#/einstellungen" aria-current={route === 'settings' ? 'page' : undefined}>
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

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
    min-width: 2.75rem;
    min-height: 2.75rem;
    box-sizing: border-box;
    padding: 0.4em 0.9em;
    border: 0.1875rem solid var(--color-button-border);
    border-radius: 0.5rem;
    background-color: var(--color-button);
    color: var(--color-button-text);
    font-weight: 600;
    text-decoration: none;
  }

  a[aria-current='page'] {
    text-decoration: underline;
    text-decoration-thickness: 0.15em;
    text-underline-offset: 0.25em;
  }
</style>
