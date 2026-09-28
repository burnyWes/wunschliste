<script lang="ts">
  import Announcer from '../shared/ui/Announcer.svelte';
  import { FamilyAccess } from './access/familyAccess.svelte';
  import { provideFamilyAccess } from './access/familyAccessContext';
  import SignInPage from './access/SignInPage.svelte';
  import { familyAuth } from './firebase/firebaseApp';
  import AppFrame from './layout/AppFrame.svelte';
  import SignedInApp from './SignedInApp.svelte';

  const access = provideFamilyAccess(new FamilyAccess(familyAuth()));

  $effect(() => access.follow());
</script>

{#if access.state.status === 'signedIn'}
  <SignedInApp />
{:else if access.state.status === 'signedOut'}
  <AppFrame>
    <SignInPage />
  </AppFrame>
{:else}
  <AppFrame />
{/if}

<Announcer />
