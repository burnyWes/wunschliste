<script lang="ts">
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { hashOf } from './wishlistAddresses';

  let { message }: { message: string } = $props();
</script>

<div class="page">
  <PageHeader heading="Nicht gefunden" />
  <p>{message}</p>
  <p><a href={hashOf({ page: 'wishlists' })}>Zur Übersicht</a></p>
</div>
