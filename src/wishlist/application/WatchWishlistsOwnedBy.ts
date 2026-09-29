import type { PersonId } from '../domain/ids';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { Wishlist } from '../domain/Wishlist';
import type { WishlistRepository } from '../domain/WishlistRepository';

export class WatchWishlistsOwnedBy {
  constructor(private readonly wishlists: WishlistRepository) {}

  execute(
    ownerId: PersonId,
    onChange: (wishlists: readonly Wishlist[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return this.wishlists.watchOwnedBy(ownerId, onChange, onFailure);
  }
}
