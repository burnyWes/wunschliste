import type { PersonId, WishId, WishlistId } from './ids';
import { perspectiveOf } from './Perspective';
import { WishHiddenFromOwner, type Wish } from './Wish';
import { sortWishlists, type Wishlist } from './Wishlist';

export function moveTargetsOf(source: Wishlist, wishlists: readonly Wishlist[]): Wishlist[] {
  if (source.removedByOwner) {
    return [];
  }
  return sortWishlists(
    wishlists.filter(
      (wishlist) =>
        wishlist.ownerId === source.ownerId &&
        wishlist.id !== source.id &&
        !wishlist.removedByOwner,
    ),
  );
}

export function moveWish(wish: Wish, source: Wishlist, target: Wishlist, me: PersonId): Wish {
  const perspective = perspectiveOf(source, me);
  source.ensureVisibleTo(perspective);
  if (wish.isHiddenFrom(perspective)) {
    throw new WishHiddenFromOwner(wish.id);
  }
  const isInSource = wish.wishlistId === source.id;
  if (!isInSource || moveTargetsOf(source, [target]).length === 0) {
    throw new WishCannotMoveThere(wish.id, target.id);
  }
  return wish.moveTo(target.id, perspective);
}

export class WishCannotMoveThere extends Error {
  constructor(
    readonly wishId: WishId,
    readonly wishlistId: WishlistId,
  ) {
    super(`The wish ${wishId} cannot be moved to the wishlist ${wishlistId}.`);
    this.name = 'WishCannotMoveThere';
  }
}
