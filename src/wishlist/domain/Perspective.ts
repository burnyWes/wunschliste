import type { PersonId } from './ids';
import type { Wishlist } from './Wishlist';

export type Perspective = { readonly me: PersonId; readonly ownerId: PersonId };

export function perspectiveOf(wishlist: Wishlist, me: PersonId): Perspective {
  return { me, ownerId: wishlist.ownerId };
}

export function isOwner(perspective: Perspective): boolean {
  return perspective.me === perspective.ownerId;
}
