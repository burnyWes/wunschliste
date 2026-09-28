<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import { tick } from 'svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import { replaceWith } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import TextField from '../../../shared/ui/TextField.svelte';
  import { Name, type NameProblem } from '../../domain/Name';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import { NAME_PROBLEM_MESSAGES } from './wishTexts';

  const { createWishlist } = useWishlistModule();

  let name = $state('');
  let problem = $state<NameProblem>();
  let nameField: TextField;

  async function create(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const parsedName = Name.parse(name);
    if (!parsedName.ok) {
      problem = parsedName.problem;
      await tick();
      nameField.focus();
      return;
    }
    const wishlistId = await createWishlist.execute(parsedName.value);
    replaceWith(hashOf({ page: 'wishlist', wishlistId, filter: 'open' }));
  }
</script>

<form class="page" novalidate onsubmit={create}>
  <PageHeader heading="Wunschliste erstellen" />
  <TextField
    bind:this={nameField}
    id="wishlist-name"
    label="Name"
    bind:value={name}
    problem={problem && NAME_PROBLEM_MESSAGES[problem]}
    autocapitalize="sentences"
    autocomplete="off"
  />
  <ActionBar>
    <button class="button" type="submit"><Plus aria-hidden="true" size="1.25em" /> Erstellen</button
    >
  </ActionBar>
</form>
