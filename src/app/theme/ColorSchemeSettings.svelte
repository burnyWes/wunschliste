<script lang="ts">
  import ChoiceGroup from '../../shared/ui/ChoiceGroup.svelte';
  import { COLOR_SCHEMES, type ColorScheme } from './colorScheme';
  import { applyColorScheme, loadColorScheme, saveColorScheme } from './colorSchemeStorage';

  let selected = $state(loadColorScheme());

  function select(scheme: ColorScheme): void {
    selected = scheme;
    saveColorScheme(scheme);
    applyColorScheme(scheme);
  }
</script>

<ChoiceGroup
  legend="Farbschema"
  name="color-scheme"
  options={COLOR_SCHEMES}
  {selected}
  onselect={select}
/>
