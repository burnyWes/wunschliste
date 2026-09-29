import type { WishId, WishlistId } from './ids';
import type { Unsubscribe } from './Unsubscribe';
import type { Wish } from './Wish';

export interface WishRepository {
  watchByWishlist(
    wishlistId: WishlistId,
    onChange: (wishes: readonly Wish[]) => void,
    onFailure: () => void,
  ): Unsubscribe;
  watch(id: WishId, onChange: (wish: Wish | undefined) => void, onFailure: () => void): Unsubscribe;
  get(id: WishId): Promise<Wish | undefined>;
  save(wish: Wish): Promise<void>;
  delete(id: WishId): Promise<void>;
  deleteAllOf(wishlistId: WishlistId): Promise<void>;
}
