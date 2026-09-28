<script lang="ts">
  import { onMount, tick, untrack, type Snippet } from 'svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import { takePageFocusRequest } from '../../../shared/ui/pageFocus';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import TextField from '../../../shared/ui/TextField.svelte';
  import { Name, type NameProblem } from '../../domain/Name';
  import { NAME_PROBLEM_MESSAGES } from './wishTexts';

  let {
    heading,
    initialName = '',
    focusesName = false,
    onsubmit,
    extra,
    actions,
  }: {
    heading: string;
    initialName?: string;
    focusesName?: boolean;
    onsubmit: (name: Name) => Promise<void>;
    extra?: Snippet;
    actions: Snippet;
  } = $props();

  let name = $state(untrack(() => initialName));
  let problem = $state<NameProblem>();
  let nameField: TextField;

  onMount(() => {
    if (focusesName && takePageFocusRequest()) {
      nameField.focus();
    }
  });

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const parsedName = Name.parse(name);
    if (!parsedName.ok) {
      problem = parsedName.problem;
      await tick();
      nameField.focus();
      return;
    }
    problem = undefined;
    await onsubmit(parsedName.value);
  }
</script>

<form class="page" novalidate onsubmit={submit}>
  <PageHeader {heading} takesFocus={!focusesName} />
  <TextField
    bind:this={nameField}
    id="wishlist-name"
    label="Name"
    bind:value={name}
    problem={problem && NAME_PROBLEM_MESSAGES[problem]}
    autocapitalize="sentences"
    autocomplete="off"
  />
  {@render extra?.()}
  <ActionBar>{@render actions()}</ActionBar>
</form>
