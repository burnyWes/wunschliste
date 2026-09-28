import { wishlistIdOf, type IdGenerator, type WishlistId } from '../domain/ids';
import type { Name } from '../domain/Name';
import { Wishlist } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class CreateWishlist {
  constructor(
    private readonly wishlists: WishlistRepository,
    private readonly ids: IdGenerator,
  ) {}

  async execute(name: Name): Promise<WishlistId> {
    const wishlist = Wishlist.create(wishlistIdOf(this.ids.next()), name);
    await this.wishlists.save(wishlist);
    return wishlist.id;
  }
}
