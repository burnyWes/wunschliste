import { compareIds } from './compareIds';
import type { PersonId, WishlistId } from './ids';
import type { Name } from './Name';
import { isOwner, perspectiveOf, type Perspective } from './Perspective';
import type { WishesOfWishlist } from './WishRepository';

export type RestoredWishlist = {
  id: WishlistId;
  name: Name;
  ownerId: PersonId;
  removedByOwner: boolean;
};

export type WishlistRemoval = { kind: 'delete' } | { kind: 'hideFromOwner'; wishlist: Wishlist };

export class Wishlist {
  private constructor(
    readonly id: WishlistId,
    readonly name: Name,
    readonly ownerId: PersonId,
    readonly removedByOwner: boolean,
  ) {}

  static create(id: WishlistId, name: Name, ownerId: PersonId): Wishlist {
    return new Wishlist(id, name, ownerId, false);
  }

  static restore({ id, name, ownerId, removedByOwner }: RestoredWishlist): Wishlist {
    return new Wishlist(id, name, ownerId, removedByOwner);
  }

  rename(name: Name): Wishlist {
    return new Wishlist(this.id, name, this.ownerId, this.removedByOwner);
  }

  isVisibleTo(perspective: Perspective): boolean {
    return !(isOwner(perspective) && this.removedByOwner);
  }

  ensureVisibleTo(perspective: Perspective): void {
    if (!this.isVisibleTo(perspective)) {
      throw new WishlistNotFound(this.id);
    }
  }

  removeFor(perspective: Perspective, { wishes, confirmed }: WishesOfWishlist): WishlistRemoval {
    this.ensureVisibleTo(perspective);
    const mayHoldSecrets = !confirmed || wishes.some((wish) => wish.keepsSecretFromOwner);
    if (isOwner(perspective) && mayHoldSecrets) {
      return {
        kind: 'hideFromOwner',
        wishlist: new Wishlist(this.id, this.name, this.ownerId, true),
      };
    }
    return { kind: 'delete' };
  }
}

export function sortWishlists(wishlists: readonly Wishlist[]): Wishlist[] {
  return [...wishlists].sort(
    (first, second) =>
      first.name.value.localeCompare(second.name.value, 'de') || compareIds(first.id, second.id),
  );
}

export function wishlistsVisibleTo(wishlists: readonly Wishlist[], me: PersonId): Wishlist[] {
  return wishlists.filter((wishlist) => wishlist.isVisibleTo(perspectiveOf(wishlist, me)));
}

export class WishlistNotFound extends Error {
  constructor(readonly wishlistId: WishlistId) {
    super(`The wishlist ${wishlistId} does not exist.`);
    this.name = 'WishlistNotFound';
  }
}
