import type { WishlistId } from '../domain/ids';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { Wish } from '../domain/Wish';
import { sortWishes } from '../domain/wishOrder';
import type { WishRepository } from '../domain/WishRepository';

export class WatchWishesOfWishlist {
  constructor(private readonly wishes: WishRepository) {}

  execute(wishlistId: WishlistId, onChange: (wishes: readonly Wish[]) => void): Unsubscribe {
    return this.wishes.watchByWishlist(wishlistId, (wishes) => onChange(sortWishes(wishes)));
  }
}
