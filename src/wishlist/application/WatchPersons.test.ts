import { describe, expect, it } from 'vitest';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { personNamed } from './fakes/personNamed';
import { WatchPersons } from './WatchPersons';

describe('WatchPersons', () => {
  it('reports the persons sorted by name, including new ones, until unsubscribed', async () => {
    const persons = new InMemoryPersonRepository();
    await persons.save(personNamed('Oma'));
    const reportedNames: string[][] = [];

    const unsubscribe = new WatchPersons(persons).execute(
      (reported) => reportedNames.push(reported.map((person) => person.name.value)),
      () => {},
    );
    await persons.save(personNamed('Anna'));
    unsubscribe();
    await persons.save(personNamed('Ben'));

    expect(reportedNames).toEqual([['Oma'], ['Anna', 'Oma']]);
  });

  it('reports when the persons cannot be watched', () => {
    const persons = new InMemoryPersonRepository();
    let failures = 0;
    new WatchPersons(persons).execute(
      () => {},
      () => (failures += 1),
    );

    persons.failWatchers();

    expect(failures).toBe(1);
  });
});
