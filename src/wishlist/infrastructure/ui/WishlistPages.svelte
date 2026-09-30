<script lang="ts">
  import { announce } from '../../../shared/ui/announcements.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import type { PersonId } from '../../domain/ids';
  import ChooseProfilePage from './ChooseProfilePage.svelte';
  import CreatePersonPage from './CreatePersonPage.svelte';
  import CreateWishlistPage from './CreateWishlistPage.svelte';
  import CreateWishPage from './CreateWishPage.svelte';
  import EditPersonPage from './EditPersonPage.svelte';
  import EditWishlistPage from './EditWishlistPage.svelte';
  import EditWishPage from './EditWishPage.svelte';
  import MoveWishPage from './MoveWishPage.svelte';
  import PersonsPage from './PersonsPage.svelte';
  import { PERSON_CREATED_ANNOUNCEMENT, profileChosenAnnouncement } from './personTexts';
  import { hashOf, type WishlistAddress } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishlistPage from './WishlistPage.svelte';
  import WishlistsPage from './WishlistsPage.svelte';
  import WishPage from './WishPage.svelte';

  let { address, settingsHash }: { address: WishlistAddress; settingsHash: string } = $props();

  const { chooseProfile } = useWishlistModule();
  const personsHash = hashOf({ page: 'persons' });

  async function switchProfile(id: PersonId, name: string): Promise<void> {
    await chooseProfile.execute(id);
    navigateTo(personsHash);
    announce(profileChosenAnnouncement(name));
  }

  async function showCreatedPerson(): Promise<void> {
    navigateTo(personsHash);
    announce(PERSON_CREATED_ANNOUNCEMENT);
  }
</script>

{#if address.page === 'wishlists'}
  <WishlistsPage />
{:else if address.page === 'createWishlist'}
  <CreateWishlistPage />
{:else if address.page === 'wishlist'}
  <WishlistPage wishlistId={address.wishlistId} filter={address.filter} />
{:else if address.page === 'editWishlist'}
  <EditWishlistPage wishlistId={address.wishlistId} />
{:else if address.page === 'createWish'}
  <CreateWishPage wishlistId={address.wishlistId} />
{:else if address.page === 'wish'}
  <WishPage wishId={address.wishId} />
{:else if address.page === 'chooseProfile'}
  <ChooseProfilePage
    back={{ label: 'Personen', hash: personsHash }}
    onchoose={(person) => switchProfile(person.id, person.name.value)}
    oncreate={() => navigateTo(hashOf({ page: 'createPerson' }))}
  />
{:else if address.page === 'createPerson'}
  <CreatePersonPage oncreated={showCreatedPerson} oncancel={() => navigateTo(personsHash)} />
{:else if address.page === 'editPerson'}
  <EditPersonPage personId={address.personId} />
{:else if address.page === 'persons'}
  <PersonsPage {settingsHash} />
{:else if address.page === 'moveWish'}
  <MoveWishPage wishId={address.wishId} />
{:else}
  <EditWishPage wishId={address.wishId} />
{/if}
