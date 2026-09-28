import type { WishlistId } from '../domain/ids';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { Wishlist } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class WatchWishlist {
  constructor(private readonly wishlists: WishlistRepository) {}

  execute(id: WishlistId, onChange: (wishlist: Wishlist | undefined) => void): Unsubscribe {
    return this.wishlists.watch(id, onChange);
  }
}
