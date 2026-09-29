import { compareIds } from './compareIds';
import type { PersonId, WishlistId } from './ids';
import type { Name } from './Name';

export class Wishlist {
  private constructor(
    readonly id: WishlistId,
    readonly name: Name,
    readonly ownerId: PersonId,
  ) {}

  static create(id: WishlistId, name: Name, ownerId: PersonId): Wishlist {
    return new Wishlist(id, name, ownerId);
  }

  static restore(id: WishlistId, name: Name, ownerId: PersonId): Wishlist {
    return new Wishlist(id, name, ownerId);
  }

  rename(name: Name): Wishlist {
    return new Wishlist(this.id, name, this.ownerId);
  }
}

export function sortWishlists(wishlists: readonly Wishlist[]): Wishlist[] {
  return [...wishlists].sort(
    (first, second) =>
      first.name.value.localeCompare(second.name.value, 'de') || compareIds(first.id, second.id),
  );
}

export class WishlistNotFound extends Error {
  constructor(readonly wishlistId: WishlistId) {
    super(`The wishlist ${wishlistId} does not exist.`);
    this.name = 'WishlistNotFound';
  }
}
