import { wishlistIdOf, type IdGenerator, type PersonId, type WishlistId } from '../domain/ids';
import type { Name } from '../domain/Name';
import { PersonNotFound } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import { Wishlist } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class CreateWishlist {
  constructor(
    private readonly wishlists: WishlistRepository,
    private readonly persons: PersonRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(name: Name, ownerId: PersonId): Promise<WishlistId> {
    if ((await this.persons.get(ownerId)) === undefined) {
      throw new PersonNotFound(ownerId);
    }
    const wishlist = Wishlist.create(wishlistIdOf(this.ids.next()), name, ownerId);
    await this.wishlists.save(wishlist);
    return wishlist.id;
  }
}
