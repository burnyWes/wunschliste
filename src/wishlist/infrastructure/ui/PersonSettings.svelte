<script lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import { navigateTo } from '../../../shared/ui/navigation';
  import { useCurrentProfile } from './currentProfile.svelte';
  import { hashOf } from './wishlistAddresses';

  const profile = useCurrentProfile();
</script>

<ul class="entry-list">
  <li>
    <button type="button" onclick={() => navigateTo(hashOf({ page: 'persons' }))}>
      <span>
        <span class="title">Personen</span>
        <span class="note">Ich bin {profile.me.name.value}</span>
      </span>
      <ChevronRight aria-hidden="true" size="1.25em" />
    </button>
  </li>
</ul>

<style>
  ul {
    margin-bottom: 1.5rem;
  }

  .title,
  .note {
    display: block;
  }

  .note {
    overflow-wrap: anywhere;
  }
</style>
