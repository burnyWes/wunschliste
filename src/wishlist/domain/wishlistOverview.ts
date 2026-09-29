import type { PersonId } from './ids';
import { personsMeFirst, type Person } from './Person';
import { sortWishlists, wishlistsVisibleTo, type Wishlist } from './Wishlist';

export type WishlistGroup = {
  owner: Person | undefined;
  isMe: boolean;
  wishlists: readonly Wishlist[];
};

export function groupWishlistsByOwner(
  wishlists: readonly Wishlist[],
  persons: readonly Person[],
  me: PersonId,
): WishlistGroup[] {
  const sorted = sortWishlists(wishlistsVisibleTo(wishlists, me));
  const ownedBy = (ownerId: PersonId) => sorted.filter((wishlist) => wishlist.ownerId === ownerId);
  const personGroups = personsMeFirst(persons, me).map((owner) => ({
    owner,
    isMe: owner.id === me,
    wishlists: ownedBy(owner.id),
  }));
  const knownOwners = new Set(persons.map((person) => person.id));
  const unknownOwnerGroup = {
    owner: undefined,
    isMe: false,
    wishlists: sorted.filter((wishlist) => !knownOwners.has(wishlist.ownerId)),
  };
  return [...personGroups, unknownOwnerGroup].filter((group) => group.wishlists.length > 0);
}
