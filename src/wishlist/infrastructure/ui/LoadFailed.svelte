<script lang="ts">
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { hashOf } from './wishlistAddresses';
  import { LOAD_FAILED_MESSAGE } from './wishTexts';
</script>

<div class="page">
  <PageHeader heading="Laden fehlgeschlagen" />
  <p>{LOAD_FAILED_MESSAGE}</p>
  <div class="button-row">
    <button type="button" class="button" onclick={() => navigateTo(hashOf({ page: 'wishlists' }))}>
      Zur Übersicht
    </button>
  </div>
</div>
