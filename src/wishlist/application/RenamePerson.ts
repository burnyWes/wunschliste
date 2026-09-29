import type { PersonId } from '../domain/ids';
import type { Name } from '../domain/Name';
import { PersonNotFound } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import { ensureNameIsFree } from '../domain/personRules';

export class RenamePerson {
  constructor(private readonly persons: PersonRepository) {}

  async execute(id: PersonId, name: Name): Promise<void> {
    const person = await this.persons.get(id);
    if (person === undefined) {
      throw new PersonNotFound(id);
    }
    ensureNameIsFree(name, await this.persons.getAll(), id);
    await this.persons.save(person.rename(name));
  }
}
