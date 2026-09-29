<script lang="ts">
  import { Save, Trash2, X } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ConfirmDialog from '../../../shared/ui/ConfirmDialog.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { PersonId } from '../../domain/ids';
  import type { Name } from '../../domain/Name';
  import type { Person } from '../../domain/Person';
  import { PersonNameTaken, PersonOwnsWishlists } from '../../domain/personRules';
  import { wishlistsVisibleTo, type Wishlist } from '../../domain/Wishlist';
  import { useCurrentProfile } from './currentProfile.svelte';
  import LoadFailed from './LoadFailed.svelte';
  import NameForm from './NameForm.svelte';
  import NotFound from './NotFound.svelte';
  import {
    ownedWishlistsHint,
    personDeletedAnnouncement,
    personDeletionMessage,
    personNotDeletableRightNowHint,
  } from './personTexts';
  import { useWishlistModule } from './wishlistModuleContext';
  import { SAVED_ANNOUNCEMENT } from './wishTexts';

  let { personId, settingsHash }: { personId: PersonId; settingsHash: string } = $props();

  const { watchPerson, watchWishlistsOwnedBy, renamePerson, deletePerson } = useWishlistModule();
  const profile = useCurrentProfile();

  const person = new Watched<Person>();
  let ownedWishlists = $state.raw<readonly Wishlist[]>();
  let haveWishlistsFailed = $state(false);
  let isDeleting = $state(false);
  let deletionDialog = $state<ConfirmDialog>();

  $effect(() =>
    watchPerson.execute(
      personId,
      (reported) => person.show(reported),
      () => person.fail(),
    ),
  );
  $effect(() =>
    watchWishlistsOwnedBy.execute(
      personId,
      (reported) => (ownedWishlists = reported),
      () => (haveWishlistsFailed = true),
    ),
  );

  const hintedWishlists = $derived(
    ownedWishlists && personId === profile.me.id
      ? wishlistsVisibleTo(ownedWishlists, personId)
      : ownedWishlists,
  );

  async function save(name: Name): Promise<'taken' | void> {
    try {
      await renamePerson.execute(personId, name);
    } catch (error) {
      if (error instanceof PersonNameTaken) {
        return 'taken';
      }
      throw error;
    }
    navigateTo(settingsHash);
    announce(SAVED_ANNOUNCEMENT);
  }

  async function deleteConfirmed(): Promise<void> {
    isDeleting = true;
    const deletedName = person.value?.name.value ?? '';
    try {
      await deletePerson.execute(personId);
    } catch (error) {
      isDeleting = false;
      if (error instanceof PersonOwnsWishlists) {
        return;
      }
      throw error;
    }
    navigateTo(settingsHash);
    announce(personDeletedAnnouncement(deletedName));
  }
</script>

{#if person.status === 'failed' || haveWishlistsFailed}
  <LoadFailed />
{:else if person.value}
  <NameForm
    heading="Person bearbeiten"
    back={{ label: 'Einstellungen', hash: settingsHash }}
    fieldId="person-name"
    initialName={person.value.name.value}
    onsubmit={save}
  >
    {#snippet extra()}
      {#if ownedWishlists?.length === 0}
        <div class="button-row">
          <button
            class="button"
            type="button"
            onclick={(event) => deletionDialog?.open(event.currentTarget)}
          >
            <Trash2 aria-hidden="true" size="1.25em" /> Person löschen
          </button>
        </div>
        <ConfirmDialog
          bind:this={deletionDialog}
          heading="Person löschen?"
          message={personDeletionMessage(person.value?.name.value ?? '')}
          confirmLabel="Löschen"
          onconfirm={deleteConfirmed}
        />
      {:else if hintedWishlists?.length === 0}
        <p>{personNotDeletableRightNowHint(person.value?.name.value ?? '')}</p>
      {:else if hintedWishlists}
        <p>{ownedWishlistsHint(person.value?.name.value ?? '', hintedWishlists.length)}</p>
      {/if}
    {/snippet}
    {#snippet actions()}
      <button class="button" type="submit"
        ><Save aria-hidden="true" size="1.25em" /> Speichern</button
      >
      <button class="button" type="button" onclick={() => navigateTo(settingsHash)}>
        <X aria-hidden="true" size="1.25em" /> Abbrechen
      </button>
    {/snippet}
  </NameForm>
{:else if person.status === 'missing' && !isDeleting}
  <NotFound message="Diese Person gibt es nicht mehr." />
{/if}
