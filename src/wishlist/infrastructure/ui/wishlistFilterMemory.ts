import type { WishlistId } from '../../domain/ids';
import type { WishFilter } from '../../domain/wishView';
import { hashOf } from './wishlistAddresses';

export class WishlistFilterMemory {
  readonly #filters = new Map<WishlistId, WishFilter>();

  remember(wishlistId: WishlistId, filter: WishFilter): void {
    this.#filters.set(wishlistId, filter);
  }

  hashOf(wishlistId: WishlistId): string {
    return hashOf({
      page: 'wishlist',
      wishlistId,
      filter: this.#filters.get(wishlistId) ?? 'open',
    });
  }
}

export const wishlistFilterMemory = new WishlistFilterMemory();
