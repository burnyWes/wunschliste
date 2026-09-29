import { describe, expect, it } from 'vitest';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { PersonNameTaken } from '../domain/personRules';
import { CreatePerson } from './CreatePerson';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { personNamed } from './fakes/personNamed';
import { SequentialIdGenerator } from './fakes/SequentialIdGenerator';

const nameOf = (raw: string) => requireValid(Name.parse(raw));

async function setUp() {
  const persons = new InMemoryPersonRepository();
  await persons.save(personNamed('Anna'));
  return { persons, createPerson: new CreatePerson(persons, new SequentialIdGenerator()) };
}

describe('CreatePerson', () => {
  it('saves a person under the next id and returns that id', async () => {
    const { persons, createPerson } = await setUp();

    const id = await createPerson.execute(nameOf('Ben'));

    expect(id).toBe('id-1');
    expect((await persons.get(id))?.name.value).toBe('Ben');
  });

  it('refuses a name that is already taken', async () => {
    const { persons, createPerson } = await setUp();

    await expect(createPerson.execute(nameOf('anna'))).rejects.toThrow(PersonNameTaken);
    expect(await persons.getAll()).toHaveLength(1);
  });
});
