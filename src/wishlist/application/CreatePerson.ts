import { personIdOf, type IdGenerator, type PersonId } from '../domain/ids';
import type { Name } from '../domain/Name';
import { Person } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import { ensureNameIsFree } from '../domain/personRules';

export class CreatePerson {
  constructor(
    private readonly persons: PersonRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(name: Name): Promise<PersonId> {
    ensureNameIsFree(name, await this.persons.getAll());
    const person = Person.create(personIdOf(this.ids.next()), name);
    await this.persons.save(person);
    return person.id;
  }
}
