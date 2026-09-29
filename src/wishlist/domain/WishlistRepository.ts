import type { WishlistId } from './ids';
import type { Unsubscribe } from './Unsubscribe';
import type { Wishlist } from './Wishlist';

export interface WishlistRepository {
  watchAll(onChange: (wishlists: readonly Wishlist[]) => void, onFailure: () => void): Unsubscribe;
  watch(
    id: WishlistId,
    onChange: (wishlist: Wishlist | undefined) => void,
    onFailure: () => void,
  ): Unsubscribe;
  get(id: WishlistId): Promise<Wishlist | undefined>;
  save(wishlist: Wishlist): Promise<void>;
  delete(id: WishlistId): Promise<void>;
}
