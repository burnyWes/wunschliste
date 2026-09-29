<script lang="ts">
  import { onMount, tick, untrack, type ComponentProps, type Snippet } from 'svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import { takePageFocusRequest } from '../../../shared/ui/pageFocus';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import TextField from '../../../shared/ui/TextField.svelte';
  import { Name } from '../../domain/Name';
  import { NAME_FORM_PROBLEM_MESSAGES, type NameFormProblem } from './wishTexts';

  let {
    heading,
    back,
    fieldId,
    initialName = '',
    focusesName = false,
    onsubmit,
    extra,
    actions,
  }: {
    heading: string;
    back?: ComponentProps<typeof PageHeader>['back'];
    fieldId: string;
    initialName?: string;
    focusesName?: boolean;
    onsubmit: (name: Name) => Promise<'taken' | void>;
    extra?: Snippet;
    actions: Snippet;
  } = $props();

  let name = $state(untrack(() => initialName));
  let problem = $state<NameFormProblem>();
  let isSubmitting = false;
  let nameField: TextField;

  onMount(() => {
    if (focusesName && takePageFocusRequest()) {
      nameField.focus();
    }
  });

  async function pointOut(found: NameFormProblem): Promise<void> {
    problem = found;
    await tick();
    nameField.focus();
  }

  async function submitOnce(parsedName: Name): Promise<void> {
    isSubmitting = true;
    try {
      const refusal = await onsubmit(parsedName);
      if (refusal) {
        await pointOut(refusal);
      }
    } finally {
      isSubmitting = false;
    }
  }

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    const parsedName = Name.parse(name);
    if (!parsedName.ok) {
      await pointOut(parsedName.problem);
      return;
    }
    problem = undefined;
    await submitOnce(parsedName.value);
  }
</script>

<form class="page" novalidate onsubmit={submit}>
  <PageHeader {heading} {back} takesFocus={!focusesName} />
  <TextField
    bind:this={nameField}
    id={fieldId}
    label="Name"
    bind:value={name}
    problem={problem && NAME_FORM_PROBLEM_MESSAGES[problem]}
    autocapitalize="sentences"
    autocomplete="off"
  />
  {@render extra?.()}
  <ActionBar>{@render actions()}</ActionBar>
</form>
