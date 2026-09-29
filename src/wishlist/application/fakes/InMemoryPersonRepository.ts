import type { PersonId } from '../../domain/ids';
import type { Person } from '../../domain/Person';
import type { PersonRepository } from '../../domain/PersonRepository';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import { ObservableMap } from './ObservableMap';

export class InMemoryPersonRepository implements PersonRepository {
  readonly #persons = new ObservableMap<PersonId, Person>();

  watchAll(onChange: (persons: readonly Person[]) => void, onFailure: () => void): Unsubscribe {
    return this.#persons.observe(() => onChange(this.#persons.values()), onFailure);
  }

  failWatchers(): void {
    this.#persons.failObservers();
  }

  async get(id: PersonId): Promise<Person | undefined> {
    return this.#persons.get(id);
  }

  async getAll(): Promise<readonly Person[]> {
    return this.#persons.values();
  }

  async save(person: Person): Promise<void> {
    this.#persons.set(person.id, person);
  }

  async delete(id: PersonId): Promise<void> {
    this.#persons.delete(id);
  }
}
