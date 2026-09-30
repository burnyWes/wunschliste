import type { PersonId, WishId, WishlistId } from '../domain/ids';
import { WishNotFound } from '../domain/Wish';
import { WishlistNotFound, type Wishlist } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';
import { moveWish } from '../domain/wishMove';
import type { WishRepository } from '../domain/WishRepository';

export class MoveWish {
  constructor(
    private readonly wishes: WishRepository,
    private readonly wishlists: WishlistRepository,
  ) {}

  async execute(id: WishId, targetId: WishlistId, me: PersonId): Promise<void> {
    const wish = await this.wishes.get(id);
    if (wish === undefined) {
      throw new WishNotFound(id);
    }
    const source = await this.#wishlist(wish.wishlistId);
    const target = await this.#wishlist(targetId);
    await this.wishes.save(moveWish(wish, source, target, me));
  }

  async #wishlist(id: WishlistId): Promise<Wishlist> {
    const wishlist = await this.wishlists.get(id);
    if (wishlist === undefined) {
      throw new WishlistNotFound(id);
    }
    return wishlist;
  }
}
