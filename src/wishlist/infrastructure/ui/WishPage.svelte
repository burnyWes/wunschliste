<script lang="ts">
  import { ExternalLink } from '@lucide/svelte';
  import PageHeader from '../../../shared/ui/PageHeader.svelte';
  import { Watched } from '../../../shared/ui/watched.svelte';
  import type { WishId } from '../../domain/ids';
  import type { Wish } from '../../domain/Wish';
  import NotFound from './NotFound.svelte';
  import { useWishlistModule } from './wishlistModuleContext';
  import WishSummary from './WishSummary.svelte';

  let { wishId }: { wishId: WishId } = $props();

  const { watchWish } = useWishlistModule();

  const wish = new Watched<Wish>();

  $effect(() => watchWish.execute(wishId, (reported) => wish.show(reported)));
</script>

{#if wish.value}
  {@const { name, link, description } = wish.value.details}
  <div class="page">
    <PageHeader heading={name.value} />
    <p><WishSummary details={wish.value.details} /></p>
    {#if link}
      <p>
        <a class="button" href={link.href} target="_blank" rel="noopener">
          <ExternalLink aria-hidden="true" size="1.25em" /> Zum Angebot auf {link.siteName}
        </a>
      </p>
    {/if}
    {#if description}
      <p class="description">{description.value}</p>
    {/if}
  </div>
{:else if wish.status === 'missing'}
  <NotFound message="Diesen Wunsch gibt es nicht mehr." />
{/if}

<style>
  .description {
    white-space: pre-line;
    overflow-wrap: anywhere;
  }
</style>
