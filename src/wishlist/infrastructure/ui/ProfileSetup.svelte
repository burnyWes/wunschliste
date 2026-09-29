<script lang="ts">
  import { announce } from '../../../shared/ui/announcements.svelte';
  import { requestPageFocus } from '../../../shared/ui/pageFocus';
  import type { PersonId } from '../../domain/ids';
  import ChooseProfilePage from './ChooseProfilePage.svelte';
  import CreatePersonPage from './CreatePersonPage.svelte';
  import { profileChosenAnnouncement } from './personTexts';
  import { useWishlistModule } from './wishlistModuleContext';

  type Step = 'choose' | 'create';

  const { chooseProfile } = useWishlistModule();

  let step = $state<Step>('choose');

  requestPageFocus();

  function show(nextStep: Step): void {
    requestPageFocus();
    step = nextStep;
  }

  async function choose(id: PersonId, name: string): Promise<void> {
    requestPageFocus();
    announce(profileChosenAnnouncement(name));
    await chooseProfile.execute(id);
  }
</script>

{#if step === 'choose'}
  <ChooseProfilePage
    onchoose={(person) => choose(person.id, person.name.value)}
    oncreate={() => show('create')}
  />
{:else}
  <CreatePersonPage
    oncreated={(id, name) => choose(id, name.value)}
    oncancel={() => show('choose')}
  />
{/if}
