import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import { PersonNotFound } from '../domain/Person';
import { ChooseProfile } from './ChooseProfile';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { InMemoryProfileStore } from './fakes/InMemoryProfileStore';
import { personNamed } from './fakes/personNamed';
import { ForgetProfile } from './ForgetProfile';

async function setUp() {
  const persons = new InMemoryPersonRepository();
  const profileStore = new InMemoryProfileStore();
  await persons.save(personNamed('Anna'));
  return { profileStore, chooseProfile: new ChooseProfile(persons, profileStore) };
}

describe('ChooseProfile', () => {
  it('remembers the chosen person on the device', async () => {
    const { profileStore, chooseProfile } = await setUp();

    await chooseProfile.execute(personIdOf('anna'));

    expect(profileStore.current()).toBe('anna');
  });

  it('refuses an unknown person and keeps the profile', async () => {
    const { profileStore, chooseProfile } = await setUp();
    await chooseProfile.execute(personIdOf('anna'));

    await expect(chooseProfile.execute(personIdOf('gone'))).rejects.toThrow(PersonNotFound);
    expect(profileStore.current()).toBe('anna');
  });
});

describe('ForgetProfile', () => {
  it('forgets the chosen person', async () => {
    const { profileStore, chooseProfile } = await setUp();
    await chooseProfile.execute(personIdOf('anna'));

    new ForgetProfile(profileStore).execute();

    expect(profileStore.current()).toBeUndefined();
  });
});
