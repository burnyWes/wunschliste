import {
  personIdOf,
  wishIdOf,
  wishlistIdOf,
  type PersonId,
  type WishId,
  type WishlistId,
} from '../../domain/ids';
import type { WishFilter } from '../../domain/wishView';

export type WishlistAddress =
  | { page: 'wishlists' }
  | { page: 'createWishlist' }
  | { page: 'wishlist'; wishlistId: WishlistId; filter: WishFilter }
  | { page: 'editWishlist'; wishlistId: WishlistId }
  | { page: 'createWish'; wishlistId: WishlistId }
  | { page: 'wish'; wishId: WishId }
  | { page: 'editWish'; wishId: WishId }
  | { page: 'chooseProfile' }
  | { page: 'createPerson' }
  | { page: 'editPerson'; personId: PersonId }
  | { page: 'persons' };

type AddressPattern = {
  pattern: RegExp;
  toAddress: (id: string) => WishlistAddress;
};

const ID = '([A-Za-z0-9-]+)';

const addressPatterns: readonly AddressPattern[] = [
  { pattern: /^#\/$/, toAddress: () => ({ page: 'wishlists' }) },
  { pattern: /^#\/liste\/neu$/, toAddress: () => ({ page: 'createWishlist' }) },
  {
    pattern: new RegExp(`^#/liste/${ID}$`),
    toAddress: (id) => ({ page: 'wishlist', wishlistId: wishlistIdOf(id), filter: 'open' }),
  },
  {
    pattern: new RegExp(`^#/liste/${ID}/erfuellt$`),
    toAddress: (id) => ({ page: 'wishlist', wishlistId: wishlistIdOf(id), filter: 'fulfilled' }),
  },
  {
    pattern: new RegExp(`^#/liste/${ID}/bearbeiten$`),
    toAddress: (id) => ({ page: 'editWishlist', wishlistId: wishlistIdOf(id) }),
  },
  {
    pattern: new RegExp(`^#/liste/${ID}/wunsch/neu$`),
    toAddress: (id) => ({ page: 'createWish', wishlistId: wishlistIdOf(id) }),
  },
  {
    pattern: new RegExp(`^#/wunsch/${ID}$`),
    toAddress: (id) => ({ page: 'wish', wishId: wishIdOf(id) }),
  },
  {
    pattern: new RegExp(`^#/wunsch/${ID}/bearbeiten$`),
    toAddress: (id) => ({ page: 'editWish', wishId: wishIdOf(id) }),
  },
  { pattern: /^#\/wer-bist-du$/, toAddress: () => ({ page: 'chooseProfile' }) },
  { pattern: /^#\/person\/neu$/, toAddress: () => ({ page: 'createPerson' }) },
  {
    pattern: new RegExp(`^#/person/${ID}/bearbeiten$`),
    toAddress: (id) => ({ page: 'editPerson', personId: personIdOf(id) }),
  },
  { pattern: /^#\/personen$/, toAddress: () => ({ page: 'persons' }) },
];

export function parseWishlistAddress(hash: string): WishlistAddress | undefined {
  for (const { pattern, toAddress } of addressPatterns) {
    const match = pattern.exec(hash);
    if (match !== null) {
      return toAddress(match[1]);
    }
  }
  return undefined;
}

export function hashOf(address: WishlistAddress): string {
  switch (address.page) {
    case 'wishlists':
      return '#/';
    case 'createWishlist':
      return '#/liste/neu';
    case 'wishlist':
      return address.filter === 'fulfilled'
        ? `#/liste/${address.wishlistId}/erfuellt`
        : `#/liste/${address.wishlistId}`;
    case 'editWishlist':
      return `#/liste/${address.wishlistId}/bearbeiten`;
    case 'createWish':
      return `#/liste/${address.wishlistId}/wunsch/neu`;
    case 'wish':
      return `#/wunsch/${address.wishId}`;
    case 'editWish':
      return `#/wunsch/${address.wishId}/bearbeiten`;
    case 'chooseProfile':
      return '#/wer-bist-du';
    case 'createPerson':
      return '#/person/neu';
    case 'editPerson':
      return `#/person/${address.personId}/bearbeiten`;
    case 'persons':
      return '#/personen';
  }
}
