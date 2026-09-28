<script lang="ts">
  import PageHeader from '../../shared/ui/PageHeader.svelte';
  import FamilyAccessSettings from '../access/FamilyAccessSettings.svelte';
  import ColorSchemeSettings from '../theme/ColorSchemeSettings.svelte';
</script>

<div class="page">
  <PageHeader heading="Einstellungen" />
  <ColorSchemeSettings />
  <FamilyAccessSettings />
</div>
