<script lang="ts">
  import { ArrowLeftRight, ChevronRight, Plus } from '@lucide/svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import type { Person } from '../../domain/Person';
  import { useCurrentProfile } from './currentProfile.svelte';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import { LOAD_FAILED_MESSAGE } from './wishTexts';

  let { settingsHash }: { settingsHash: string } = $props();

  const { watchPersons } = useWishlistModule();
  const profile = useCurrentProfile();
  const id = $props.id();

  let persons = $state.raw<readonly Person[]>();
  let havePersonsFailed = $state(false);

  $effect(() =>
    watchPersons.execute(
      (reported) => (persons = reported),
      () => (havePersonsFailed = true),
    ),
  );
</script>

<div class="page">
  <PageHeader heading="Personen" back={{ label: 'Einstellungen', hash: settingsHash }} />

  <section aria-labelledby="{id}-me">
    <h2 id="{id}-me">Ich</h2>
    <p>Ich bin {profile.me.name.value}</p>
    <div class="button-row">
      <button
        class="button"
        type="button"
        onclick={() => navigateTo(hashOf({ page: 'chooseProfile' }))}
      >
        <ArrowLeftRight aria-hidden="true" size="1.25em" /> Wechseln
      </button>
    </div>
  </section>

  <section aria-labelledby="{id}-persons">
    <div class="heading-row">
      <h2 id="{id}-persons">Alle Personen</h2>
      <button
        type="button"
        class="button button--icon"
        aria-label="Person erstellen"
        onclick={() => navigateTo(hashOf({ page: 'createPerson' }))}
      >
        <Plus aria-hidden="true" size="1.5em" />
      </button>
    </div>
    {#if havePersonsFailed}
      <p>{LOAD_FAILED_MESSAGE}</p>
    {:else if persons}
      <ul class="entry-list">
        {#each persons as person (person.id)}
          <li>
            <button
              type="button"
              onclick={() => navigateTo(hashOf({ page: 'editPerson', personId: person.id }))}
            >
              <span>{person.name.value}</span>
              <ChevronRight aria-hidden="true" size="1.25em" />
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  section {
    margin-bottom: 1.5rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25em;
  }

  .heading-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.5rem;
  }

  .heading-row h2 {
    margin: 0;
  }

  p {
    overflow-wrap: anywhere;
  }
</style>
