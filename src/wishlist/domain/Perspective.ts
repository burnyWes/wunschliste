import type { PersonId } from './ids';
import type { Wishlist } from './Wishlist';

export type Perspective = {
  readonly me: PersonId;
  readonly ownerId: PersonId;
  readonly wishlistIsHidden: boolean;
};

export function perspectiveOf(wishlist: Wishlist, me: PersonId): Perspective {
  const visiblePerspective = { me, ownerId: wishlist.ownerId, wishlistIsHidden: false };
  return { ...visiblePerspective, wishlistIsHidden: !wishlist.isVisibleTo(visiblePerspective) };
}

export function isOwner(perspective: Perspective): boolean {
  return perspective.me === perspective.ownerId;
}
