<script lang="ts">
  import { Plus } from '@lucide/svelte';
  import { replaceWith } from '../../../shared/ui/navigation';
  import type { Name } from '../../domain/Name';
  import { hashOf } from './wishlistAddresses';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishlistNameForm from './WishlistNameForm.svelte';

  const { createWishlist } = useWishlistModule();

  async function create(name: Name): Promise<void> {
    const wishlistId = await createWishlist.execute(name);
    replaceWith(hashOf({ page: 'wishlist', wishlistId, filter: 'open' }));
  }
</script>

<WishlistNameForm heading="Wunschliste erstellen" onsubmit={create}>
  {#snippet actions()}
    <button class="button" type="submit"><Plus aria-hidden="true" size="1.25em" /> Erstellen</button
    >
  {/snippet}
</WishlistNameForm>
