<script lang="ts">
  import { Check } from '@lucide/svelte';

  let {
    id,
    label,
    checked = $bindable(),
    description,
    disabled = false,
  }: {
    id: string;
    label: string;
    checked: boolean;
    description?: string;
    disabled?: boolean;
  } = $props();
</script>

<div class="check-field">
  <label class="check-option" for={id}>
    <span class="label">{label}</span>
    <input
      {id}
      class="visually-hidden"
      type="checkbox"
      bind:checked
      {disabled}
      aria-describedby={description && `${id}-description`}
    />
    <span class="check-option__box" aria-hidden="true">
      <Check size="100%" strokeWidth={4} />
    </span>
  </label>
  {#if description}
    <p id="{id}-description" class="description">{description}</p>
  {/if}
</div>

<style>
  .check-field {
    margin: 0 0 1rem;
  }

  .label {
    font-size: 1.25em;
    font-weight: 700;
  }

  .description {
    margin: 0;
    overflow-wrap: anywhere;
  }
</style>
