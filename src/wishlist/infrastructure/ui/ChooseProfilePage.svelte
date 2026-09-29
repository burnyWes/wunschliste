<script lang="ts">
  import { ChevronRight, Plus } from '@lucide/svelte';
  import type { ComponentProps } from 'svelte';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import type { Person } from '../../domain/Person';
  import { useWishlistModule } from './wishlistModuleContext';
  import { LOAD_FAILED_MESSAGE } from './wishTexts';

  let {
    back,
    onchoose,
    oncreate,
  }: {
    back?: ComponentProps<typeof PageHeader>['back'];
    onchoose: (person: Person) => void;
    oncreate: () => void;
  } = $props();

  const { watchPersons } = useWishlistModule();

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
  <PageHeader heading="Wer bist du?" {back} />

  {#if havePersonsFailed}
    <p>{LOAD_FAILED_MESSAGE}</p>
  {:else if persons?.length === 0}
    <p>Noch keine Personen.</p>
  {:else if persons}
    <ul class="entry-list">
      {#each persons as person (person.id)}
        <li>
          <button type="button" onclick={() => onchoose(person)}>
            <span>{person.name.value}</span>
            <ChevronRight aria-hidden="true" size="1.25em" />
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <div class="button-row">
    <button type="button" class="button" onclick={oncreate}>
      <Plus aria-hidden="true" size="1.25em" /> Neue Person
    </button>
  </div>
</div>
