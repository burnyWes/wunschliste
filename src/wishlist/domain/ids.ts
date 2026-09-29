export type WishlistId = string & { readonly brand: 'WishlistId' };
export type WishId = string & { readonly brand: 'WishId' };
export type PersonId = string & { readonly brand: 'PersonId' };

export function wishlistIdOf(value: string): WishlistId {
  return value as WishlistId;
}

export function wishIdOf(value: string): WishId {
  return value as WishId;
}

export function personIdOf(value: string): PersonId {
  return value as PersonId;
}

export interface IdGenerator {
  next(): string;
}
