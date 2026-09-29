<script lang="ts">
  import { CloudOff } from '@lucide/svelte';
  import { Connectivity } from './connectivity.svelte';

  const connectivity = new Connectivity();

  $effect(() => connectivity.follow());
</script>

<div class="offline-notice" class:offline-notice--shown={!connectivity.isOnline} role="status">
  {#if !connectivity.isOnline}
    <p>
      <CloudOff aria-hidden="true" size="1.25em" /> Offline – Änderungen werden später abgeglichen.
    </p>
  {/if}
</div>

<style>
  .offline-notice--shown {
    padding: 0.25rem 1rem;
    border-block: 0.1875rem solid var(--color-outline);
    font-size: 0.875em;
  }

  p {
    display: flex;
    align-items: flex-start;
    gap: 0.4em;
    margin: 0;
    overflow-wrap: anywhere;
  }

  p :global(svg) {
    flex: none;
  }
</style>
