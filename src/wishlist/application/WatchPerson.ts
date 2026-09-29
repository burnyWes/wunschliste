import type { PersonId } from '../domain/ids';
import type { Person } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import type { Unsubscribe } from '../domain/Unsubscribe';

export class WatchPerson {
  constructor(private readonly persons: PersonRepository) {}

  execute(
    id: PersonId,
    onChange: (person: Person | undefined) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return this.persons.watchAll(
      (persons) => onChange(persons.find((person) => person.id === id)),
      onFailure,
    );
  }
}
