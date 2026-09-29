<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import { announce } from '../../../shared/ui/announcements.svelte';
  import ChoiceGroup from '../../../shared/ui/ChoiceGroup.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import type { PersonId } from '../../domain/ids';
  import type { Name } from '../../domain/Name';
  import { personsMeFirst, type Person } from '../../domain/Person';
  import { useCurrentProfile } from './currentProfile.svelte';
  import NameForm from './NameForm.svelte';
  import { ownerChoiceLabel } from './personTexts';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import { WISHLIST_CREATED_ANNOUNCEMENT } from './wishTexts';

  const { createWishlist, watchPersons } = useWishlistModule();
  const me = useCurrentProfile().me;

  let persons = $state.raw<readonly Person[]>([]);
  let ownerId = $state<PersonId>(me.id);

  $effect(() =>
    watchPersons.execute(
      (reported) => (persons = reported),
      () => {},
    ),
  );

  const ownerChoices = $derived(
    personsMeFirst(persons, me.id).map((person) => ({
      value: person.id,
      label: ownerChoiceLabel(person, person.id === me.id),
    })),
  );

  async function create(name: Name): Promise<void> {
    const wishlistId = await createWishlist.execute(name, ownerId);
    navigateTo(hashOf({ page: 'wishlist', wishlistId, filter: 'open' }));
    announce(WISHLIST_CREATED_ANNOUNCEMENT);
  }
</script>

<NameForm heading="Wunschliste erstellen" fieldId="wishlist-name" focusesName onsubmit={create}>
  {#snippet extra()}
    <ChoiceGroup
      legend="Für"
      name="wishlist-owner"
      options={ownerChoices}
      selected={ownerId}
      onselect={(chosen) => (ownerId = chosen)}
    />
  {/snippet}
  {#snippet actions()}
    <button class="button" type="submit"><Plus aria-hidden="true" size="1.25em" /> Erstellen</button
    >
    <button class="button" type="button" onclick={() => navigateTo(hashOf({ page: 'wishlists' }))}>
      <X aria-hidden="true" size="1.25em" /> Abbrechen
    </button>
  {/snippet}
</NameForm>
