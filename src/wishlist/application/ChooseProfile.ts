import type { PersonId } from '../domain/ids';
import { PersonNotFound } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import type { ProfileStore } from '../domain/ProfileStore';

export class ChooseProfile {
  constructor(
    private readonly persons: PersonRepository,
    private readonly profileStore: ProfileStore,
  ) {}

  async execute(id: PersonId): Promise<void> {
    if ((await this.persons.get(id)) === undefined) {
      throw new PersonNotFound(id);
    }
    this.profileStore.choose(id);
  }
}
