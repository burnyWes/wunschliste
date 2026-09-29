import { personIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { Person } from '../../domain/Person';
import { isObject } from './isObject';

export type PersonDocument = { name: string };

function isPersonDocument(candidate: unknown): candidate is PersonDocument {
  return isObject(candidate) && typeof candidate.name === 'string';
}

export function toPersonDocument(person: Person): PersonDocument {
  return { name: person.name.value };
}

export function personFromDocument(id: string, data: unknown): Person | undefined {
  if (!isPersonDocument(data)) {
    return undefined;
  }
  const name = Name.parse(data.name);
  return name.ok ? Person.restore(personIdOf(id), name.value) : undefined;
}
