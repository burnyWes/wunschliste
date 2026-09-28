<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import type { Name } from '../../domain/Name';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishlistNameForm from './WishlistNameForm.svelte';

  const { createWishlist } = useWishlistModule();

  async function create(name: Name): Promise<void> {
    const wishlistId = await createWishlist.execute(name);
    navigateTo(hashOf({ page: 'wishlist', wishlistId, filter: 'open' }));
  }
</script>

<WishlistNameForm heading="Wunschliste erstellen" onsubmit={create}>
  {#snippet actions()}
    <button class="button" type="submit"><Plus aria-hidden="true" size="1.25em" /> Erstellen</button
    >
    <button class="button" type="button" onclick={() => navigateTo(hashOf({ page: 'wishlists' }))}>
      <X aria-hidden="true" size="1.25em" /> Abbrechen
    </button>
  {/snippet}
</WishlistNameForm>
