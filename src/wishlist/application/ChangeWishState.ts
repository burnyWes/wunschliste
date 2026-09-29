import type { PersonId, WishId } from '../domain/ids';
import { perspectiveOf } from '../domain/Perspective';
import { WishNotFound } from '../domain/Wish';
import type { WishAction } from '../domain/wishActions';
import { WishlistNotFound } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';
import type { WishRepository } from '../domain/WishRepository';

export class ChangeWishState {
  constructor(
    private readonly wishes: WishRepository,
    private readonly wishlists: WishlistRepository,
  ) {}

  async execute(id: WishId, me: PersonId, action: WishAction): Promise<void> {
    const wish = await this.wishes.get(id);
    if (wish === undefined) {
      throw new WishNotFound(id);
    }
    const wishlist = await this.wishlists.get(wish.wishlistId);
    if (wishlist === undefined) {
      throw new WishlistNotFound(wish.wishlistId);
    }
    await this.wishes.save(wish.perform(action, perspectiveOf(wishlist, me)));
  }
}
