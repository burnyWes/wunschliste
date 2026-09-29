import { personIdOf, wishlistIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { Wishlist } from '../../domain/Wishlist';
import { isObject } from './isObject';

export type WishlistDocument = { name: string; ownerId: string; removedByOwner?: boolean };

function isWishlistDocument(candidate: unknown): candidate is WishlistDocument {
  return (
    isObject(candidate) &&
    typeof candidate.name === 'string' &&
    typeof candidate.ownerId === 'string' &&
    candidate.ownerId !== '' &&
    (candidate.removedByOwner === undefined || typeof candidate.removedByOwner === 'boolean')
  );
}

export function toWishlistDocument(wishlist: Wishlist): WishlistDocument {
  return {
    name: wishlist.name.value,
    ownerId: wishlist.ownerId,
    removedByOwner: wishlist.removedByOwner,
  };
}

export function wishlistFromDocument(id: string, data: unknown): Wishlist | undefined {
  if (!isWishlistDocument(data)) {
    return undefined;
  }
  const name = Name.parse(data.name);
  return name.ok
    ? Wishlist.restore({
        id: wishlistIdOf(id),
        name: name.value,
        ownerId: personIdOf(data.ownerId),
        removedByOwner: data.removedByOwner ?? false,
      })
    : undefined;
}
