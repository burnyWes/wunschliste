<script lang="ts">
  import { Download } from '@lucide/svelte';
  import { tick } from 'svelte';
  import { installOffer } from './installOffer.svelte';

  let outcomeText = $state<HTMLParagraphElement>();

  async function install(): Promise<void> {
    await installOffer.install();
    await tick();
    outcomeText?.focus();
  }
</script>

{#if installOffer.state !== 'unavailable'}
  <section aria-labelledby="install-heading">
    <h2 id="install-heading">App installieren</h2>
    {#if installOffer.state === 'available'}
      <p>Installiert öffnet sich die Wunschliste wie eine App vom Startbildschirm.</p>
      <div class="button-row">
        <button class="button" type="button" onclick={install}>
          <Download aria-hidden="true" size="1.25em" /> Installieren
        </button>
      </div>
    {:else if installOffer.state === 'accepted'}
      <p tabindex="-1" bind:this={outcomeText}>
        Die Wunschliste wird installiert und erscheint auf dem Startbildschirm.
      </p>
    {:else}
      <p tabindex="-1" bind:this={outcomeText}>
        Installation abgebrochen. Über das Browsermenü und „App installieren“ geht es jederzeit.
      </p>
    {/if}
  </section>
{/if}

<style>
  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25em;
  }
</style>
