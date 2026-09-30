<script lang="ts">
  import { Save, X } from '@lucide/svelte';
  import { onMount, tick, untrack, type Snippet } from 'svelte';
  import ActionBar from '../../../shared/ui/ActionBar.svelte';
  import CheckOption from '../../../shared/ui/CheckOption.svelte';
  import ChoiceGroup from '../../../shared/ui/ChoiceGroup.svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { takePageFocusRequest } from '../../../shared/ui/pageFocus';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import TextField from '../../../shared/ui/TextField.svelte';
  import { RATINGS, type Rating } from '../../domain/Rating';
  import {
    parseWishDetails,
    type WishDetails,
    type WishDetailsInput,
    type WishDetailsProblems,
  } from '../../domain/WishDetails';
  import type { WishTraits } from '../../domain/Wish';
  import {
    BRAND_PROBLEM_MESSAGES,
    DESCRIPTION_PROBLEM_MESSAGES,
    LINK_PROBLEM_MESSAGES,
    NAME_PROBLEM_MESSAGES,
    PRICE_PROBLEM_MESSAGES,
    ratingLabel,
    REPEATABILITY_LOCKED_HINT,
    REPEATABLE_EXCLUDED_BY_SECRET_HINT,
    REPEATABLE_HINT,
    REPEATABLE_LABEL,
    SECRET_EXCLUDED_BY_REPEATABLE_HINT,
  } from './wishTexts';

  type RatingChoice = Rating | 'none';

  type SecretChoice = { initial: boolean; hint: string };

  type RepeatableChoice = { initial: boolean; locked: boolean };

  let {
    heading,
    initialInput,
    cancelTarget,
    focusesName = false,
    secret,
    repeatable,
    onsubmit,
    extra,
  }: {
    heading: string;
    initialInput?: WishDetailsInput;
    cancelTarget: string;
    focusesName?: boolean;
    secret?: SecretChoice;
    repeatable: RepeatableChoice;
    onsubmit: (details: WishDetails, traits: WishTraits) => Promise<void>;
    extra?: Snippet;
  } = $props();

  const RATING_CHOICES: readonly { value: RatingChoice; label: string }[] = [
    ...RATINGS.map((rating) => ({ value: rating, label: ratingLabel(rating) })),
    { value: 'none', label: 'keine Angabe' },
  ];

  const EMPTY_INPUT: WishDetailsInput = {
    name: '',
    brand: '',
    link: '',
    description: '',
    price: '',
    rating: undefined,
  };

  const start = untrack(() => initialInput) ?? EMPTY_INPUT;

  let name = $state(start.name);
  let brand = $state(start.brand);
  let link = $state(start.link);
  let description = $state(start.description);
  let price = $state(start.price);
  let ratingChoice = $state<RatingChoice>(start.rating ?? 'none');
  let isSecret = $state(untrack(() => secret?.initial) ?? false);
  let isRepeatable = $state(untrack(() => repeatable.initial));
  let problems = $state<WishDetailsProblems>({});

  let nameField: TextField;
  let brandField: TextField;
  let linkField: TextField;
  let descriptionField: TextField;
  let priceField: TextField;

  const isRepeatableDisabled = $derived(repeatable.locked || isSecret);

  const repeatableHint = $derived.by(() => {
    if (repeatable.locked) return REPEATABILITY_LOCKED_HINT;
    if (isSecret) return REPEATABLE_EXCLUDED_BY_SECRET_HINT;
    return REPEATABLE_HINT;
  });

  onMount(() => {
    if (focusesName && takePageFocusRequest()) {
      nameField.focus();
    }
  });

  function firstFieldWith(found: WishDetailsProblems): TextField | undefined {
    if (found.name) return nameField;
    if (found.brand) return brandField;
    if (found.link) return linkField;
    if (found.description) return descriptionField;
    if (found.price) return priceField;
    return undefined;
  }

  async function save(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    const parsed = parseWishDetails({
      name,
      brand,
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
    await onsubmit(parsed.details, {
      secret: secret !== undefined && isSecret,
      repeatable: isRepeatable,
    });
  }
</script>

<form class="page" novalidate onsubmit={save}>
  <PageHeader {heading} takesFocus={!focusesName} />
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
    bind:this={brandField}
    id="wish-brand"
    label="Marke / Hersteller"
    bind:value={brand}
    problem={problems.brand && BRAND_PROBLEM_MESSAGES[problems.brand]}
    autocapitalize="words"
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
  {#if secret}
    <CheckOption
      id="wish-secret"
      label="Geheim"
      bind:checked={isSecret}
      disabled={isRepeatable}
      description={isRepeatable ? SECRET_EXCLUDED_BY_REPEATABLE_HINT : secret.hint}
    />
  {/if}
  <CheckOption
    id="wish-repeatable"
    label={REPEATABLE_LABEL}
    bind:checked={isRepeatable}
    disabled={isRepeatableDisabled}
    description={repeatableHint}
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
