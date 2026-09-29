import type { Unsubscribe } from '../domain/Unsubscribe';
import { sortWishlists, type Wishlist } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class WatchWishlists {
  constructor(private readonly wishlists: WishlistRepository) {}

  execute(onChange: (wishlists: readonly Wishlist[]) => void, onFailure: () => void): Unsubscribe {
    return this.wishlists.watchAll((wishlists) => onChange(sortWishlists(wishlists)), onFailure);
  }
}
