<script lang="ts">
  import PageHeader from '../../shared/ui/PageHeader.svelte';
  import PersonSettings from '../../wishlist/infrastructure/ui/PersonSettings.svelte';
  import FamilyAccessSettings from '../access/FamilyAccessSettings.svelte';
  import InstallSettings from '../install/InstallSettings.svelte';
  import ColorSchemeSettings from '../theme/ColorSchemeSettings.svelte';
</script>

<div class="page">
  <PageHeader heading="Einstellungen" />
  <InstallSettings />
  <ColorSchemeSettings />
  <PersonSettings />
  <FamilyAccessSettings />
</div>
