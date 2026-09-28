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
    <label class="option">
      <span>{option.label}</span>
      <input
        class="visually-hidden"
        type="radio"
        {name}
        value={option.value}
        checked={selected === option.value}
        onchange={() => onselect(option.value)}
      />
      <span class="box" aria-hidden="true">
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

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    min-height: 2.75rem;
    padding: 0.5rem 0;
    cursor: pointer;
  }

  .box {
    flex: none;
    width: 1.75em;
    height: 1.75em;
    border-left: 0.1875rem solid var(--color-outline);
    border-bottom: 0.1875rem solid var(--color-outline);
    color: var(--color-check);
  }

  .box :global(svg) {
    visibility: hidden;
  }

  input:checked + .box :global(svg) {
    visibility: visible;
  }

  input:focus-visible + .box {
    outline: 0.1875rem solid var(--color-outline);
    outline-offset: 0.25rem;
  }
</style>
