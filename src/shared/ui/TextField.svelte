<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';

  type TextFieldProps = Omit<HTMLInputAttributes, 'value'> & {
    id: string;
    label: string;
    value: string;
    problem?: string;
    multiline?: boolean;
  };

  let {
    id,
    label,
    value = $bindable(),
    problem,
    multiline = false,
    ...inputAttributes
  }: TextFieldProps = $props();

  let field = $state<HTMLInputElement | HTMLTextAreaElement>();

  const problemId = $derived(`${id}-problem`);

  export function focus(): void {
    field?.focus();
  }
</script>

<div class="text-field">
  <label for={id}>{label}</label>
  {#if multiline}
    <textarea
      {id}
      rows="4"
      bind:value
      bind:this={field}
      aria-invalid={problem ? 'true' : undefined}
      aria-describedby={problem ? problemId : undefined}></textarea>
  {:else}
    <input
      {id}
      type="text"
      {...inputAttributes}
      bind:value
      bind:this={field}
      aria-invalid={problem ? 'true' : undefined}
      aria-describedby={problem ? problemId : undefined}
    />
  {/if}
  {#if problem}
    <p id={problemId} class="problem">{problem}</p>
  {/if}
</div>

<style>
  .text-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 1rem;
  }

  label {
    font-weight: 700;
  }

  input,
  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.4em 0.6em;
    border: 0.1875rem solid var(--color-button-border);
    border-radius: 0.5rem;
    background-color: var(--color-background);
    color: var(--color-text);
    font: inherit;
  }

  textarea {
    resize: vertical;
  }

  [aria-invalid='true'] {
    border-style: dashed;
  }

  .problem {
    margin: 0;
    font-weight: 700;
  }
</style>
