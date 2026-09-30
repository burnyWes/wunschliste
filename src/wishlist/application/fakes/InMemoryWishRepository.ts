import type { WishId, WishlistId } from '../../domain/ids';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import type { Wish } from '../../domain/Wish';
import type { WishesOfWishlist, WishRepository } from '../../domain/WishRepository';
import { ObservableMap } from './ObservableMap';

export class InMemoryWishRepository implements WishRepository {
  readonly #wishes = new ObservableMap<WishId, Wish>();
  #isServerReachable = true;

  watchAll(onChange: (wishes: readonly Wish[]) => void, onFailure: () => void): Unsubscribe {
    return this.#wishes.observe(() => onChange(this.#wishes.values()), onFailure);
  }

  watchByWishlist(
    wishlistId: WishlistId,
    onChange: (wishes: readonly Wish[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return this.#wishes.observe(
      () => onChange(this.#wishes.values().filter((wish) => wish.wishlistId === wishlistId)),
      onFailure,
    );
  }

  watch(
    id: WishId,
    onChange: (wish: Wish | undefined) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return this.#wishes.observe(() => onChange(this.#wishes.get(id)), onFailure);
  }

  failWatchers(): void {
    this.#wishes.failObservers();
  }

  async get(id: WishId): Promise<Wish | undefined> {
    return this.#wishes.get(id);
  }

  answerFromCacheOnly(): void {
    this.#isServerReachable = false;
  }

  async getByWishlist(wishlistId: WishlistId): Promise<WishesOfWishlist> {
    return {
      wishes: this.#wishes.values().filter((wish) => wish.wishlistId === wishlistId),
      confirmed: this.#isServerReachable,
    };
  }

  async save(wish: Wish): Promise<void> {
    this.#wishes.set(wish.id, wish);
  }

  async delete(id: WishId): Promise<void> {
    this.#wishes.delete(id);
  }

  async deleteAllOf(wishlistId: WishlistId): Promise<void> {
    this.#wishes.deleteWhere((wish) => wish.wishlistId === wishlistId);
  }
}
