<script lang="ts">
  import { Check } from '@lucide/svelte';
  import { COLOR_SCHEMES, type ColorScheme } from './colorScheme';
  import { applyColorScheme, loadColorScheme, saveColorScheme } from './colorSchemeStorage';

  let selected = $state(loadColorScheme());

  function select(scheme: ColorScheme): void {
    selected = scheme;
    saveColorScheme(scheme);
    applyColorScheme(scheme);
  }
</script>

<fieldset>
  <legend>Farbschema</legend>
  {#each COLOR_SCHEMES as scheme (scheme.value)}
    <label class="option">
      <span>{scheme.label}</span>
      <input
        class="visually-hidden"
        type="radio"
        name="color-scheme"
        value={scheme.value}
        checked={selected === scheme.value}
        onchange={() => select(scheme.value)}
      />
      <span class="box" aria-hidden="true">
        <Check size="100%" strokeWidth={4} />
      </span>
    </label>
  {/each}
</fieldset>

<style>
  fieldset {
    margin: 0;
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
