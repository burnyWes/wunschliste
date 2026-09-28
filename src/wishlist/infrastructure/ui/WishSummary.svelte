<script lang="ts">
  import type { WishDetails } from '../../domain/WishDetails';
  import { formatPrice, ratingLabel, ratingStars } from './wishTexts';

  let { details }: { details: WishDetails } = $props();
</script>

{#if details.rating || details.price}
  <span class="summary">
    {#if details.rating}
      <span aria-hidden="true">{ratingStars(details.rating)}</span>
      {ratingLabel(details.rating)}
    {/if}
    {#if details.rating && details.price}
      <span aria-hidden="true">·</span>
    {/if}
    {#if details.price}
      {formatPrice(details.price)}
    {/if}
  </span>
{/if}

<style>
  .summary {
    display: block;
  }
</style>
