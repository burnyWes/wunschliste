export type WishlistId = string & { readonly brand: 'WishlistId' };
export type WishId = string & { readonly brand: 'WishId' };

export function wishlistIdOf(value: string): WishlistId {
  return value as WishlistId;
}

export function wishIdOf(value: string): WishId {
  return value as WishId;
}

export interface IdGenerator {
  next(): string;
}
