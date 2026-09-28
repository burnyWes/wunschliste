<script lang="ts">
  import { spokenText } from './announcements.svelte';
</script>

<p class="visually-hidden" role="status">{spokenText()}</p>
