import type { WishlistId } from '../domain/ids';
import type { Name } from '../domain/Name';
import { WishlistNotFound } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class RenameWishlist {
  constructor(private readonly wishlists: WishlistRepository) {}

  async execute(id: WishlistId, name: Name): Promise<void> {
    const wishlist = await this.wishlists.get(id);
    if (wishlist === undefined) {
      throw new WishlistNotFound(id);
    }
    await this.wishlists.save(wishlist.rename(name));
  }
}
