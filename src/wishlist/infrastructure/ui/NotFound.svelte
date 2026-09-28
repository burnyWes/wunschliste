<script lang="ts">
  import { navigateTo } from '../../../shared/ui/navigation';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { hashOf } from './wishlistAddresses';

  let { message }: { message: string } = $props();
</script>

<div class="page">
  <PageHeader heading="Nicht gefunden" />
  <p>{message}</p>
  <div class="button-row">
    <button type="button" class="button" onclick={() => navigateTo(hashOf({ page: 'wishlists' }))}>
      Zur Übersicht
    </button>
  </div>
</div>
