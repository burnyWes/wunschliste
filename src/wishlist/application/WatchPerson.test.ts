import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { personNamed } from './fakes/personNamed';
import { WatchPerson } from './WatchPerson';

describe('WatchPerson', () => {
  it('reports the person with the given id and its removal', async () => {
    const persons = new InMemoryPersonRepository();
    await persons.save(personNamed('Anna'));
    await persons.save(personNamed('Ben'));
    const reportedNames: (string | undefined)[] = [];

    new WatchPerson(persons).execute(
      personIdOf('ben'),
      (person) => reportedNames.push(person?.name.value),
      () => {},
    );
    await persons.delete(personIdOf('ben'));

    expect(reportedNames).toEqual(['Ben', undefined]);
  });

  it('reports when the person cannot be watched', () => {
    const persons = new InMemoryPersonRepository();
    let failures = 0;
    new WatchPerson(persons).execute(
      personIdOf('ben'),
      () => {},
      () => (failures += 1),
    );

    persons.failWatchers();

    expect(failures).toBe(1);
  });
});
