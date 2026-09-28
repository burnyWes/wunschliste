import type { WishId, WishlistId } from '../../domain/ids';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import type { Wish } from '../../domain/Wish';
import type { WishRepository } from '../../domain/WishRepository';
import { ObservableMap } from './ObservableMap';

export class InMemoryWishRepository implements WishRepository {
  readonly #wishes = new ObservableMap<WishId, Wish>();

  watchByWishlist(
    wishlistId: WishlistId,
    onChange: (wishes: readonly Wish[]) => void,
  ): Unsubscribe {
    return this.#wishes.observe(() =>
      onChange(this.#wishes.values().filter((wish) => wish.wishlistId === wishlistId)),
    );
  }

  watch(id: WishId, onChange: (wish: Wish | undefined) => void): Unsubscribe {
    return this.#wishes.observe(() => onChange(this.#wishes.get(id)));
  }

  async get(id: WishId): Promise<Wish | undefined> {
    return this.#wishes.get(id);
  }

  async save(wish: Wish): Promise<void> {
    this.#wishes.set(wish.id, wish);
  }

  async delete(id: WishId): Promise<void> {
    this.#wishes.delete(id);
  }
}
