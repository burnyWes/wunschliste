<script lang="ts">
  import { terminate } from 'firebase/firestore';
  import { tick } from 'svelte';
  import OfflineNotice from '../shared/ui/OfflineNotice.svelte';
  import ProblemNotice from '../shared/ui/ProblemNotice.svelte';
  import { clearProblems, reportProblem } from '../shared/ui/reportedProblems.svelte';
  import { createWishlistModule } from '../wishlist/infrastructure/createWishlistModule';
  import WishlistPages from '../wishlist/infrastructure/ui/WishlistPages.svelte';
  import { provideWishlistModule } from '../wishlist/infrastructure/ui/wishlistModuleContext';
  import { useFamilyAccess } from './access/familyAccessContext';
  import { forgetFamilyDatabase, openFamilyDatabase } from './firebase/firebaseApp';
  import AppFrame from './layout/AppFrame.svelte';
  import MainNavigation from './layout/MainNavigation.svelte';
  import { problemText } from './problemTexts';
  import { CurrentRoute } from './router/currentRoute.svelte';
  import { mainPageOf, pageKeyOf } from './router/routes';
  import SettingsPage from './settings/SettingsPage.svelte';

  const access = useFamilyAccess();
  const firestore = openFamilyDatabase();

  provideWishlistModule(
    createWishlistModule({
      firestore,
      idGenerator: { next: () => crypto.randomUUID() },
      onProblem: (problem) => reportProblem(problemText(problem)),
    }),
  );

  let isLeaving = $state(false);

  async function closePagesAndDatabase(): Promise<void> {
    isLeaving = true;
    await tick();
    await terminate(firestore);
  }

  $effect(() =>
    access.onSignOut({
      before: closePagesAndDatabase,
      after: () => forgetFamilyDatabase(firestore),
    }),
  );

  $effect(() => () => {
    clearProblems();
    void terminate(firestore);
  });

  const currentRoute = new CurrentRoute();

  $effect(() => currentRoute.followHashChanges());

  const mainPage = $derived(mainPageOf(currentRoute.route));
</script>

{#if isLeaving}
  <AppFrame />
{:else}
  <AppFrame>
    {#snippet header()}
      {#if mainPage}
        <MainNavigation active={mainPage} />
      {/if}
      <OfflineNotice />
      <ProblemNotice />
    {/snippet}
    {#key pageKeyOf(currentRoute.route)}
      {#if currentRoute.route.page === 'settings'}
        <SettingsPage />
      {:else}
        <WishlistPages address={currentRoute.route} />
      {/if}
    {/key}
  </AppFrame>
{/if}
