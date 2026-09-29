<script lang="ts" generics="T extends string">
  import { Check } from '@lucide/svelte';

  type Choice = { value: T; label: string };

  let {
    legend,
    name,
    options,
    selected,
    onselect,
  }: {
    legend: string;
    name: string;
    options: readonly Choice[];
    selected: T;
    onselect: (value: T) => void;
  } = $props();
</script>

<fieldset>
  <legend>{legend}</legend>
  {#each options as option (option.value)}
    <label class="check-option">
      <span>{option.label}</span>
      <input
        class="visually-hidden"
        type="radio"
        {name}
        value={option.value}
        checked={selected === option.value}
        onchange={() => onselect(option.value)}
      />
      <span class="check-option__box" aria-hidden="true">
        <Check size="100%" strokeWidth={4} />
      </span>
    </label>
  {/each}
</fieldset>

<style>
  fieldset {
    margin: 0 0 1rem;
    padding: 0;
    border: none;
  }

  legend {
    margin-bottom: 0.5rem;
    padding: 0;
    font-size: 1.25em;
    font-weight: 700;
  }
</style>
