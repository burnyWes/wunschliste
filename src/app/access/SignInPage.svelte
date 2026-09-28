<script lang="ts">
  import { LogIn, TriangleAlert } from '@lucide/svelte';
  import { tick } from 'svelte';
  import ActionBar from '../../shared/ui/ActionBar.svelte';
  import PageHeader from '../../shared/ui/PageHeader.svelte';
  import { requestPageFocus, takePageFocusRequest } from '../../shared/ui/pageFocus';
  import TextField from '../../shared/ui/TextField.svelte';
  import { useFamilyAccess } from './familyAccessContext';
  import { SIGN_IN_PROBLEM_MESSAGES, type SignInProblem } from './signInProblem';

  const MISSING_EMAIL_MESSAGE = 'Bitte die E-Mail-Adresse eingeben.';
  const MISSING_PASSWORD_MESSAGE = 'Bitte das Passwort eingeben.';

  const access = useFamilyAccess();

  let email = $state('');
  let password = $state('');
  let isEmailMissing = $state(false);
  let isPasswordMissing = $state(false);
  let signInProblem = $state<SignInProblem>();
  let isSigningIn = $state(false);

  let emailField: TextField;
  let passwordField: TextField;

  async function pointOutMissingFields(): Promise<void> {
    signInProblem = undefined;
    await tick();
    (isEmailMissing ? emailField : passwordField).focus();
  }

  async function signIn(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (isSigningIn) {
      return;
    }
    const trimmedEmail = email.trim();
    isEmailMissing = trimmedEmail === '';
    isPasswordMissing = password === '';
    if (isEmailMissing || isPasswordMissing) {
      await pointOutMissingFields();
      return;
    }
    isSigningIn = true;
    requestPageFocus();
    const problem = await access.signIn(trimmedEmail, password);
    if (problem) {
      takePageFocusRequest();
      signInProblem = problem;
      isSigningIn = false;
    }
  }
</script>

<form class="page" novalidate onsubmit={signIn}>
  <PageHeader heading="Anmelden" />
  <p>Familienzugang für die Wunschliste.</p>
  <TextField
    bind:this={emailField}
    id="sign-in-email"
    label="E-Mail"
    type="email"
    bind:value={email}
    problem={isEmailMissing ? MISSING_EMAIL_MESSAGE : undefined}
    autocomplete="username"
    autocapitalize="off"
    autocorrect="off"
    spellcheck="false"
  />
  <TextField
    bind:this={passwordField}
    id="sign-in-password"
    label="Passwort"
    type="password"
    bind:value={password}
    problem={isPasswordMissing ? MISSING_PASSWORD_MESSAGE : undefined}
    autocomplete="current-password"
  />
  <p class="sign-in-problem" role="alert">
    {#if signInProblem}
      <TriangleAlert aria-hidden="true" size="1.25em" />
      {SIGN_IN_PROBLEM_MESSAGES[signInProblem]}
    {/if}
  </p>
  <ActionBar>
    <button class="button" type="submit" aria-disabled={isSigningIn}>
      <LogIn aria-hidden="true" size="1.25em" /> Anmelden
    </button>
  </ActionBar>
</form>

<style>
  .sign-in-problem {
    display: flex;
    align-items: flex-start;
    gap: 0.4em;
    margin: 0 0 1rem;
    font-weight: 700;
  }

  .sign-in-problem :global(svg) {
    flex: none;
  }
</style>
