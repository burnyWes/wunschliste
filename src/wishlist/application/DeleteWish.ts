import type { PersonId, WishId } from '../domain/ids';
import { perspectiveOf } from '../domain/Perspective';
import { WishlistNotFound } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';
import type { WishRepository } from '../domain/WishRepository';

export class DeleteWish {
  constructor(
    private readonly wishes: WishRepository,
    private readonly wishlists: WishlistRepository,
  ) {}

  async execute(id: WishId, me: PersonId): Promise<void> {
    const wish = await this.wishes.get(id);
    if (wish === undefined) {
      return;
    }
    const wishlist = await this.wishlists.get(wish.wishlistId);
    if (wishlist === undefined) {
      throw new WishlistNotFound(wish.wishlistId);
    }
    const perspective = perspectiveOf(wishlist, me);
    wishlist.ensureVisibleTo(perspective);
    const removal = wish.removeFor(perspective);
    if (removal.kind === 'hideFromOwner') {
      await this.wishes.save(removal.wish);
    } else {
      await this.wishes.delete(id);
    }
  }
}
