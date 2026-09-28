<script lang="ts">
  import { Trash2, X } from '@lucide/svelte';

  let {
    heading,
    message,
    confirmLabel,
    onconfirm,
  }: {
    heading: string;
    message: string;
    confirmLabel: string;
    onconfirm: () => void;
  } = $props();

  const id = $props.id();

  let dialog: HTMLDialogElement;
  let cancelButton: HTMLButtonElement;
  let returnFocusTo: HTMLElement | undefined;

  export function open(elementToRefocus: HTMLElement): void {
    returnFocusTo = elementToRefocus;
    dialog.showModal();
    cancelButton.focus();
  }

  function confirm(): void {
    dialog.close();
    onconfirm();
  }

  function refocus(): void {
    returnFocusTo?.focus();
  }
</script>

<dialog
  bind:this={dialog}
  aria-labelledby="{id}-heading"
  aria-describedby="{id}-message"
  onclose={refocus}
>
  <h2 id="{id}-heading">{heading}</h2>
  <p id="{id}-message">{message}</p>
  <div class="button-row">
    <button class="button" type="button" onclick={confirm}>
      <Trash2 aria-hidden="true" size="1.25em" />
      {confirmLabel}
    </button>
    <button class="button" type="button" bind:this={cancelButton} onclick={() => dialog.close()}>
      <X aria-hidden="true" size="1.25em" /> Abbrechen
    </button>
  </div>
</dialog>

<style>
  dialog {
    box-sizing: border-box;
    width: min(100% - 2rem, 30rem);
    max-width: none;
    padding: 1rem;
    border: 0.1875rem solid var(--color-outline);
    border-radius: 0.5rem;
    background-color: var(--color-background);
    color: var(--color-text);
  }

  dialog::backdrop {
    background-color: rgb(0 0 0 / 60%);
  }

  h2 {
    margin-top: 0;
  }

  p {
    overflow-wrap: anywhere;
  }
</style>
