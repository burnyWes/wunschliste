import { wishlistIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { Wishlist } from '../../domain/Wishlist';
import { isObject } from './isObject';

export type WishlistDocument = { name: string };

function isWishlistDocument(candidate: unknown): candidate is WishlistDocument {
  return isObject(candidate) && typeof candidate.name === 'string';
}

export function toWishlistDocument(wishlist: Wishlist): WishlistDocument {
  return { name: wishlist.name.value };
}

export function wishlistFromDocument(id: string, data: unknown): Wishlist | undefined {
  if (!isWishlistDocument(data)) {
    return undefined;
  }
  const name = Name.parse(data.name);
  return name.ok ? Wishlist.restore(wishlistIdOf(id), name.value) : undefined;
}
