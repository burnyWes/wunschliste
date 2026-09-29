import type { PersonId } from './ids';
import type { Person } from './Person';
import type { Unsubscribe } from './Unsubscribe';

export interface PersonRepository {
  watchAll(onChange: (persons: readonly Person[]) => void, onFailure: () => void): Unsubscribe;
  get(id: PersonId): Promise<Person | undefined>;
  getAll(): Promise<readonly Person[]>;
  save(person: Person): Promise<void>;
  delete(id: PersonId): Promise<void>;
}
