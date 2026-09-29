import { sortPersons, type Person } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import type { Unsubscribe } from '../domain/Unsubscribe';

export class WatchPersons {
  constructor(private readonly persons: PersonRepository) {}

  execute(onChange: (persons: readonly Person[]) => void, onFailure: () => void): Unsubscribe {
    return this.persons.watchAll((persons) => onChange(sortPersons(persons)), onFailure);
  }
}
