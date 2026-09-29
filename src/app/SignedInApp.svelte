<script lang="ts">
  import { terminate } from 'firebase/firestore';
  import { tick } from 'svelte';
  import OfflineNotice from '../shared/ui/OfflineNotice.svelte';
  import PageHeader from '../shared/ui/PageHeader.svelte';
  import ProblemNotice from '../shared/ui/ProblemNotice.svelte';
  import { clearProblems, reportProblem } from '../shared/ui/reportedProblems.svelte';
  import { createWishlistModule } from '../wishlist/infrastructure/createWishlistModule';
  import { LocalStorageProfileStore } from '../wishlist/infrastructure/profile/LocalStorageProfileStore';
  import {
    CurrentProfile,
    provideCurrentProfile,
  } from '../wishlist/infrastructure/ui/currentProfile.svelte';
  import ProfileSetup from '../wishlist/infrastructure/ui/ProfileSetup.svelte';
  import WishlistPages from '../wishlist/infrastructure/ui/WishlistPages.svelte';
  import { provideWishlistModule } from '../wishlist/infrastructure/ui/wishlistModuleContext';
  import { LOAD_FAILED_MESSAGE } from '../wishlist/infrastructure/ui/wishTexts';
  import FamilyAccessSettings from './access/FamilyAccessSettings.svelte';
  import { useFamilyAccess } from './access/familyAccessContext';
  import { forgetFamilyDatabase, openFamilyDatabase } from './firebase/firebaseApp';
  import AppFrame from './layout/AppFrame.svelte';
  import MainNavigation from './layout/MainNavigation.svelte';
  import { problemText } from './problemTexts';
  import { CurrentRoute } from './router/currentRoute.svelte';
  import { hashFor, mainPageOf, pageKeyOf } from './router/routes';
  import SettingsPage from './settings/SettingsPage.svelte';

  const access = useFamilyAccess();
  const firestore = openFamilyDatabase();

  const wishlistModule = provideWishlistModule(
    createWishlistModule({
      firestore,
      idGenerator: { next: () => crypto.randomUUID() },
      profileStore: new LocalStorageProfileStore(() => localStorage),
      onProblem: (problem) => reportProblem(problemText(problem)),
    }),
  );

  const profile = provideCurrentProfile(new CurrentProfile(wishlistModule.watchCurrentPerson));

  $effect(() => profile.follow());

  let isLeaving = $state(false);

  async function closePagesAndDatabase(): Promise<void> {
    isLeaving = true;
    await tick();
    await terminate(firestore);
    wishlistModule.forgetProfile.execute();
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
      {#if mainPage && profile.state.status === 'chosen'}
        <MainNavigation active={mainPage} />
      {/if}
      <OfflineNotice />
      <ProblemNotice />
    {/snippet}
    {#if profile.state.status === 'chosen'}
      {#key pageKeyOf(currentRoute.route)}
        {#if currentRoute.route.page === 'settings'}
          <SettingsPage />
        {:else}
          <WishlistPages
            address={currentRoute.route}
            settingsHash={hashFor({ page: 'settings' })}
          />
        {/if}
      {/key}
    {:else if profile.state.status === 'missing'}
      <ProfileSetup />
    {:else if profile.state.status === 'failed'}
      <div class="page">
        <PageHeader heading="Laden fehlgeschlagen" />
        <p>{LOAD_FAILED_MESSAGE}</p>
        <FamilyAccessSettings />
      </div>
    {/if}
  </AppFrame>
{/if}
