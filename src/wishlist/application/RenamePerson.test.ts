import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { PersonNotFound } from '../domain/Person';
import { PersonNameTaken } from '../domain/personRules';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { personNamed } from './fakes/personNamed';
import { RenamePerson } from './RenamePerson';

const nameOf = (raw: string) => requireValid(Name.parse(raw));
const ben = personIdOf('ben');

async function setUp() {
  const persons = new InMemoryPersonRepository();
  await persons.save(personNamed('Anna'));
  await persons.save(personNamed('Ben'));
  return { persons, renamePerson: new RenamePerson(persons) };
}

describe('RenamePerson', () => {
  it('saves the new name', async () => {
    const { persons, renamePerson } = await setUp();

    await renamePerson.execute(ben, nameOf('Benjamin'));

    expect((await persons.get(ben))?.name.value).toBe('Benjamin');
  });

  it('refuses the name of another person', async () => {
    const { persons, renamePerson } = await setUp();

    await expect(renamePerson.execute(ben, nameOf('anna'))).rejects.toThrow(PersonNameTaken);
    expect((await persons.get(ben))?.name.value).toBe('Ben');
  });

  it('lets a person change the spelling of its own name', async () => {
    const { persons, renamePerson } = await setUp();

    await renamePerson.execute(ben, nameOf('BEN'));

    expect((await persons.get(ben))?.name.value).toBe('BEN');
  });

  it('refuses an unknown person', async () => {
    const { renamePerson } = await setUp();

    await expect(renamePerson.execute(personIdOf('gone'), nameOf('Oma'))).rejects.toThrow(
      PersonNotFound,
    );
  });
});
