import type { PersonId } from './ids';
import { personsMeFirst, type Person } from './Person';
import { perspectiveOf } from './Perspective';
import type { Wish } from './Wish';
import { sortWishlists, wishlistsVisibleTo, type Wishlist } from './Wishlist';
import { countWishes, type WishCounts } from './wishView';

export type WishlistEntry = { wishlist: Wishlist; wishCounts: WishCounts };

export type WishlistGroup = {
  owner: Person | undefined;
  isMe: boolean;
  entries: readonly WishlistEntry[];
};

function entryOf(wishlist: Wishlist, wishes: readonly Wish[], me: PersonId): WishlistEntry {
  const wishesOfWishlist = wishes.filter((wish) => wish.wishlistId === wishlist.id);
  return { wishlist, wishCounts: countWishes(wishesOfWishlist, perspectiveOf(wishlist, me)) };
}

export function groupWishlistsByOwner(
  wishlists: readonly Wishlist[],
  persons: readonly Person[],
  wishes: readonly Wish[],
  me: PersonId,
): WishlistGroup[] {
  const entries = sortWishlists(wishlistsVisibleTo(wishlists, me)).map((wishlist) =>
    entryOf(wishlist, wishes, me),
  );
  const ownedBy = (ownerId: PersonId) =>
    entries.filter(({ wishlist }) => wishlist.ownerId === ownerId);
  const personGroups = personsMeFirst(persons, me).map((owner) => ({
    owner,
    isMe: owner.id === me,
    entries: ownedBy(owner.id),
  }));
  const knownOwners = new Set(persons.map((person) => person.id));
  const unknownOwnerGroup = {
    owner: undefined,
    isMe: false,
    entries: entries.filter(({ wishlist }) => !knownOwners.has(wishlist.ownerId)),
  };
  return [...personGroups, unknownOwnerGroup].filter((group) => group.entries.length > 0);
}
