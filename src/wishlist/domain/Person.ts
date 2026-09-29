import { compareIds } from './compareIds';
import type { PersonId } from './ids';
import type { Name } from './Name';

export class Person {
  private constructor(
    readonly id: PersonId,
    readonly name: Name,
  ) {}

  static create(id: PersonId, name: Name): Person {
    return new Person(id, name);
  }

  static restore(id: PersonId, name: Name): Person {
    return new Person(id, name);
  }

  rename(name: Name): Person {
    return new Person(this.id, name);
  }
}

export function sortPersons(persons: readonly Person[]): Person[] {
  return [...persons].sort(
    (first, second) =>
      first.name.value.localeCompare(second.name.value, 'de') || compareIds(first.id, second.id),
  );
}

export class PersonNotFound extends Error {
  constructor(readonly personId: PersonId) {
    super(`The person ${personId} does not exist.`);
    this.name = 'PersonNotFound';
  }
}
