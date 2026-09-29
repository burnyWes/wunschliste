import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import type { Person } from '../domain/Person';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { InMemoryProfileStore } from './fakes/InMemoryProfileStore';
import { personNamed } from './fakes/personNamed';
import { WatchCurrentPerson } from './WatchCurrentPerson';

async function setUp() {
  const persons = new InMemoryPersonRepository();
  const profileStore = new InMemoryProfileStore();
  await persons.save(personNamed('Anna'));
  await persons.save(personNamed('Ben'));
  const reportedNames: (string | undefined)[] = [];
  let failures = 0;
  const watch = () =>
    new WatchCurrentPerson(persons, profileStore).execute(
      (person: Person | undefined) => reportedNames.push(person?.name.value),
      () => (failures += 1),
    );
  return { persons, profileStore, reportedNames, failures: () => failures, watch };
}

describe('WatchCurrentPerson', () => {
  it('reports no person while no profile is chosen', async () => {
    const { reportedNames, watch } = await setUp();

    watch();

    expect(reportedNames).toEqual([undefined]);
  });

  it('reports the chosen person', async () => {
    const { profileStore, reportedNames, watch } = await setUp();
    profileStore.choose(personIdOf('anna'));

    watch();

    expect(reportedNames).toEqual(['Anna']);
  });

  it('reports no person once the chosen person is deleted', async () => {
    const { persons, profileStore, reportedNames, watch } = await setUp();
    profileStore.choose(personIdOf('anna'));
    watch();

    await persons.delete(personIdOf('anna'));

    expect(reportedNames.at(-1)).toBeUndefined();
  });

  it('reports the new person when the profile changes', async () => {
    const { profileStore, reportedNames, watch } = await setUp();
    profileStore.choose(personIdOf('anna'));
    watch();

    profileStore.choose(personIdOf('ben'));

    expect(reportedNames).toEqual(['Anna', 'Ben']);
  });

  it('reports when the persons cannot be watched', async () => {
    const { persons, failures, watch } = await setUp();
    watch();

    persons.failWatchers();

    expect(failures()).toBe(1);
  });

  it('stops watching the profile and the persons when unsubscribed', async () => {
    const { persons, profileStore, reportedNames, watch } = await setUp();
    profileStore.choose(personIdOf('anna'));
    const unsubscribe = watch();

    unsubscribe();
    profileStore.choose(personIdOf('ben'));
    await persons.delete(personIdOf('ben'));

    expect(reportedNames).toEqual(['Anna']);
  });
});
