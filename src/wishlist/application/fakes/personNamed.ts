import { personIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { requireValid } from '../../domain/parsed';
import { Person } from '../../domain/Person';

export function personNamed(name: string, id = name.toLowerCase()): Person {
  return Person.create(personIdOf(id), requireValid(Name.parse(name)));
}
