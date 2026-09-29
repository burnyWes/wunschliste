import type { PersonId } from './ids';
import type { Name } from './Name';
import type { Person } from './Person';

function isSameName(first: Name, second: Name): boolean {
  return first.value.localeCompare(second.value, 'de', { sensitivity: 'accent' }) === 0;
}

export function ensureNameIsFree(
  name: Name,
  persons: readonly Person[],
  renamedPersonId?: PersonId,
): void {
  const holder = persons.find(
    (person) => person.id !== renamedPersonId && isSameName(person.name, name),
  );
  if (holder !== undefined) {
    throw new PersonNameTaken(name.value);
  }
}

export class PersonNameTaken extends Error {
  constructor(readonly takenName: string) {
    super(`A person named ${takenName} already exists.`);
    this.name = 'PersonNameTaken';
  }
}
