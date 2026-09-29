import {
  wishIdOf,
  type IdGenerator,
  type PersonId,
  type WishId,
  type WishlistId,
} from '../domain/ids';
import { perspectiveOf } from '../domain/Perspective';
import { Wish } from '../domain/Wish';
import type { WishDetails } from '../domain/WishDetails';
import { WishlistNotFound } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';
import type { WishRepository } from '../domain/WishRepository';

export class CreateWish {
  constructor(
    private readonly wishlists: WishlistRepository,
    private readonly wishes: WishRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(wishlistId: WishlistId, details: WishDetails, me: PersonId): Promise<WishId> {
    const wishlist = await this.wishlists.get(wishlistId);
    if (wishlist === undefined) {
      throw new WishlistNotFound(wishlistId);
    }
    const wish = Wish.create(
      { id: wishIdOf(this.ids.next()), wishlistId, details },
      perspectiveOf(wishlist, me),
    );
    await this.wishes.save(wish);
    return wish.id;
  }
}
