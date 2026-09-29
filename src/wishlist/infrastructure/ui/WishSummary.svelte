<script lang="ts">
  import type { WishDetails } from '../../domain/WishDetails';
  import { BRAND_PREFIX, formatPrice, ratingLabel, ratingStars } from './wishTexts';

  let { details, includesBrand = true }: { details: WishDetails; includesBrand?: boolean } =
    $props();

  const brand = $derived(includesBrand ? details.brand : undefined);
</script>

{#snippet separator()}
  <span aria-hidden="true">·</span>
{/snippet}

{#if brand || details.rating || details.price}
  <span class="summary">
    {#if brand}
      <span class="visually-hidden">{BRAND_PREFIX}</span>{brand.value}
    {/if}
    {#if brand && (details.rating || details.price)}
      {@render separator()}
    {/if}
    {#if details.rating}
      <span aria-hidden="true">{ratingStars(details.rating)}</span>
      {ratingLabel(details.rating)}
    {/if}
    {#if details.rating && details.price}
      {@render separator()}
    {/if}
    {#if details.price}
      {formatPrice(details.price)}
    {/if}
  </span>
{/if}

<style>
  .summary {
    display: block;
    overflow-wrap: anywhere;
  }
</style>
