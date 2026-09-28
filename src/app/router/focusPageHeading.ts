import { tick } from 'svelte';

export async function focusPageHeading(): Promise<void> {
  await tick();
  document.querySelector<HTMLElement>('main h1')?.focus();
}
