<script lang="ts">
  import { terminate } from 'firebase/firestore';
  import { createWishlistModule } from '../wishlist/infrastructure/createWishlistModule';
  import WishlistPages from '../wishlist/infrastructure/ui/WishlistPages.svelte';
  import { provideWishlistModule } from '../wishlist/infrastructure/ui/wishlistModuleContext';
  import { useFamilyAccess } from './access/familyAccessContext';
  import { forgetFamilyDatabase, openFamilyDatabase } from './firebase/firebaseApp';
  import AppFrame from './layout/AppFrame.svelte';
  import MainNavigation from './layout/MainNavigation.svelte';
  import { CurrentRoute } from './router/currentRoute.svelte';
  import { mainPageOf, pageKeyOf } from './router/routes';
  import SettingsPage from './settings/SettingsPage.svelte';

  const access = useFamilyAccess();
  const firestore = openFamilyDatabase();

  provideWishlistModule(
    createWishlistModule({
      firestore,
      idGenerator: { next: () => crypto.randomUUID() },
      onProblem: () => {},
    }),
  );

  $effect(() =>
    access.onSignOut({
      before: () => terminate(firestore),
      after: () => forgetFamilyDatabase(firestore),
    }),
  );

  $effect(() => () => void terminate(firestore));

  const currentRoute = new CurrentRoute();

  $effect(() => currentRoute.followHashChanges());

  const mainPage = $derived(mainPageOf(currentRoute.route));
</script>

<AppFrame>
  {#snippet header()}
    {#if mainPage}
      <MainNavigation active={mainPage} />
    {/if}
  {/snippet}
  {#key pageKeyOf(currentRoute.route)}
    {#if currentRoute.route.page === 'settings'}
      <SettingsPage />
    {:else}
      <WishlistPages address={currentRoute.route} />
    {/if}
  {/key}
</AppFrame>
