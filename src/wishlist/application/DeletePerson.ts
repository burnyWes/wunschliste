import type { PersonId } from '../domain/ids';
import type { PersonRepository } from '../domain/PersonRepository';
import { ensurePersonIsDeletable } from '../domain/personRules';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class DeletePerson {
  constructor(
    private readonly persons: PersonRepository,
    private readonly wishlists: WishlistRepository,
  ) {}

  async execute(id: PersonId): Promise<void> {
    ensurePersonIsDeletable(id, await this.wishlists.getOwnedBy(id));
    await this.persons.delete(id);
  }
}
