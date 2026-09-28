import type { WishlistId } from '../../domain/ids';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import type { Wishlist } from '../../domain/Wishlist';
import type { WishlistRepository } from '../../domain/WishlistRepository';
import { ObservableMap } from './ObservableMap';

export class InMemoryWishlistRepository implements WishlistRepository {
  readonly #wishlists = new ObservableMap<WishlistId, Wishlist>();

  watchAll(onChange: (wishlists: readonly Wishlist[]) => void): Unsubscribe {
    return this.#wishlists.observe(() => onChange(this.#wishlists.values()));
  }

  watch(id: WishlistId, onChange: (wishlist: Wishlist | undefined) => void): Unsubscribe {
    return this.#wishlists.observe(() => onChange(this.#wishlists.get(id)));
  }

  async get(id: WishlistId): Promise<Wishlist | undefined> {
    return this.#wishlists.get(id);
  }

  async save(wishlist: Wishlist): Promise<void> {
    this.#wishlists.set(wishlist.id, wishlist);
  }

  async delete(id: WishlistId): Promise<void> {
    this.#wishlists.delete(id);
  }
}
