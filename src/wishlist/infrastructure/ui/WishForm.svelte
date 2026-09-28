<script lang="ts">
  import { Save, X } from '@lucide/svelte';
  import { tick, untrack, type Snippet } from 'svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import ChoiceGroup from '../../../shared/ui/ChoiceGroup.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import TextField from '../../../shared/ui/TextField.svelte';
  import { RATINGS, type Rating } from '../../domain/Rating';
  import {
    parseWishDetails,
    type WishDetails,
    type WishDetailsInput,
    type WishDetailsProblems,
  } from '../../domain/WishDetails';
  import {
    DESCRIPTION_PROBLEM_MESSAGES,
    LINK_PROBLEM_MESSAGES,
    NAME_PROBLEM_MESSAGES,
    PRICE_PROBLEM_MESSAGES,
    ratingLabel,
  } from './wishTexts';

  type RatingChoice = Rating | 'none';

  let {
    heading,
    initialInput,
    cancelTarget,
    onsubmit,
    extra,
  }: {
    heading: string;
    initialInput?: WishDetailsInput;
    cancelTarget: string;
    onsubmit: (details: WishDetails) => Promise<void>;
    extra?: Snippet;
  } = $props();

  const RATING_CHOICES: readonly { value: RatingChoice; label: string }[] = [
    ...RATINGS.map((rating) => ({ value: rating, label: ratingLabel(rating) })),
    { value: 'none', label: 'keine Angabe' },
  ];

  const EMPTY_INPUT: WishDetailsInput = {
    name: '',
    link: '',
    description: '',
    price: '',
    rating: undefined,
  };

  const start = untrack(() => initialInput) ?? EMPTY_INPUT;

  let name = $state(start.name);
  let link = $state(start.link);
  let description = $state(start.description);
  let price = $state(start.price);
  let ratingChoice = $state<RatingChoice>(start.rating ?? 'none');
  let problems = $state<WishDetailsProblems>({});

  let nameField: TextField;
  let linkField: TextField;
  let descriptionField: TextField;
  let priceField: TextField;

  function firstFieldWith(found: WishDetailsProblems): TextField | undefined {
    if (found.name) return nameField;
    if (found.link) return linkField;
    if (found.description) return descriptionField;
    if (found.price) return priceField;
    return undefined;
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const parsed = parseWishDetails({
      name,
      link,
      description,
      price,
      rating: ratingChoice === 'none' ? undefined : ratingChoice,
    });
    if (!parsed.ok) {
      problems = parsed.problems;
      await tick();
      firstFieldWith(parsed.problems)?.focus();
      return;
    }
    problems = {};
    await onsubmit(parsed.details);
  }
</script>

<form class="page" novalidate onsubmit={save}>
  <PageHeader {heading} />
  <TextField
    bind:this={nameField}
    id="wish-name"
    label="Name"
    bind:value={name}
    problem={problems.name && NAME_PROBLEM_MESSAGES[problems.name]}
    autocapitalize="sentences"
    autocomplete="off"
  />
  <TextField
    bind:this={linkField}
    id="wish-link"
    label="Link"
    type="url"
    bind:value={link}
    problem={problems.link && LINK_PROBLEM_MESSAGES[problems.link]}
    autocapitalize="off"
    autocorrect="off"
    autocomplete="off"
  />
  <TextField
    bind:this={descriptionField}
    id="wish-description"
    label="Beschreibung"
    multiline
    bind:value={description}
    problem={problems.description && DESCRIPTION_PROBLEM_MESSAGES[problems.description]}
  />
  <TextField
    bind:this={priceField}
    id="wish-price"
    label="Preis in Euro"
    inputmode="decimal"
    bind:value={price}
    problem={problems.price && PRICE_PROBLEM_MESSAGES[problems.price]}
    autocomplete="off"
  />
  <ChoiceGroup
    legend="Wie sehr gewünscht?"
    name="wish-rating"
    options={RATING_CHOICES}
    selected={ratingChoice}
    onselect={(choice) => (ratingChoice = choice)}
  />
  {@render extra?.()}
  <ActionBar>
    <button class="button" type="submit"><Save aria-hidden="true" size="1.25em" /> Speichern</button
    >
    <button class="button" type="button" onclick={() => navigateTo(cancelTarget)}>
      <X aria-hidden="true" size="1.25em" /> Abbrechen
    </button>
  </ActionBar>
</form>
