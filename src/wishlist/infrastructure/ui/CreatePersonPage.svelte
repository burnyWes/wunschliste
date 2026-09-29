<script lang="ts">
  import { Plus, X } from '@lucide/svelte';
  import type { PersonId } from '../../domain/ids';
  import type { Name } from '../../domain/Name';
  import { PersonNameTaken } from '../../domain/personRules';
  import NameForm from './NameForm.svelte';
  import { useWishlistModule } from './wishlistModuleContext';

  let {
    oncreated,
    oncancel,
  }: {
    oncreated: (id: PersonId, name: Name) => Promise<void>;
    oncancel: () => void;
  } = $props();

  const { createPerson } = useWishlistModule();

  async function create(name: Name): Promise<'taken' | void> {
    let id: PersonId;
    try {
      id = await createPerson.execute(name);
    } catch (error) {
      if (error instanceof PersonNameTaken) {
        return 'taken';
      }
      throw error;
    }
    await oncreated(id, name);
  }
</script>

<NameForm heading="Person erstellen" fieldId="person-name" focusesName onsubmit={create}>
  {#snippet actions()}
    <button class="button" type="submit"><Plus aria-hidden="true" size="1.25em" /> Erstellen</button
    >
    <button class="button" type="button" onclick={oncancel}>
      <X aria-hidden="true" size="1.25em" /> Abbrechen
    </button>
  {/snippet}
</NameForm>
