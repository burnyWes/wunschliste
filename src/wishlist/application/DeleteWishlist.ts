import type { PersonId, WishlistId } from '../domain/ids';
import { perspectiveOf } from '../domain/Perspective';
import { WishlistNotFound } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';
import type { WishRepository } from '../domain/WishRepository';

export class DeleteWishlist {
  constructor(
    private readonly wishlists: WishlistRepository,
    private readonly wishes: WishRepository,
  ) {}

  async execute(id: WishlistId, me: PersonId): Promise<void> {
    const wishlist = await this.wishlists.get(id);
    if (wishlist === undefined) {
      throw new WishlistNotFound(id);
    }
    const removal = wishlist.removeFor(
      perspectiveOf(wishlist, me),
      await this.wishes.getByWishlist(id),
    );
    if (removal.kind === 'hideFromOwner') {
      await this.wishlists.save(removal.wishlist);
    } else {
      await this.wishes.deleteAllOf(id);
      await this.wishlists.delete(id);
    }
  }
}
