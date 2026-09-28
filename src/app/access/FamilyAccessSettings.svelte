<script lang="ts">
  import { LogOut } from '@lucide/svelte';
  import ConfirmDialog from '../../shared/ui/ConfirmDialog.svelte';
  import { requestPageFocus } from '../../shared/ui/pageFocus';
  import { useFamilyAccess } from './familyAccessContext';

  const SIGN_OUT_MESSAGE =
    'Zum erneuten Anmelden braucht es E-Mail und Passwort des Familienzugangs. ' +
    'Die Daten auf diesem Gerät werden entfernt.';

  const access = useFamilyAccess();

  let signOutDialog = $state<ConfirmDialog>();

  const signedInEmail = $derived(access.state.status === 'signedIn' ? access.state.email : '');

  function signOutConfirmed(): void {
    requestPageFocus();
    void access.signOut();
  }
</script>

<section aria-labelledby="family-access-heading">
  <h2 id="family-access-heading">Familienzugang</h2>
  <p>Angemeldet als {signedInEmail}</p>
  <div class="button-row">
    <button
      class="button"
      type="button"
      onclick={(event) => signOutDialog?.open(event.currentTarget)}
    >
      <LogOut aria-hidden="true" size="1.25em" /> Abmelden
    </button>
  </div>
  <ConfirmDialog
    bind:this={signOutDialog}
    heading="Abmelden?"
    message={SIGN_OUT_MESSAGE}
    confirmLabel="Abmelden"
    confirmIcon={LogOut}
    onconfirm={signOutConfirmed}
  />
</section>

<style>
  h2 {
    margin: 0 0 0.5rem;
    font-size: 1.25em;
  }

  p {
    overflow-wrap: anywhere;
  }
</style>
