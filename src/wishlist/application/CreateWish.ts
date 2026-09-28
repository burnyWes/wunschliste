import { wishIdOf, type IdGenerator, type WishId, type WishlistId } from '../domain/ids';
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

  async execute(wishlistId: WishlistId, details: WishDetails): Promise<WishId> {
    if ((await this.wishlists.get(wishlistId)) === undefined) {
      throw new WishlistNotFound(wishlistId);
    }
    const wish = Wish.create(wishIdOf(this.ids.next()), wishlistId, details);
    await this.wishes.save(wish);
    return wish.id;
  }
}
