import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from '../../domain/ids';
import { hashOf, parseWishlistAddress, type WishlistAddress } from './wishlistAddresses';

const wishlistId = wishlistIdOf('abc-1');
const wishId = wishIdOf('w-1');

const addresses: [string, WishlistAddress][] = [
  ['#/', { page: 'wishlists' }],
  ['#/liste/neu', { page: 'createWishlist' }],
  ['#/liste/abc-1', { page: 'wishlist', wishlistId, filter: 'open' }],
  ['#/liste/abc-1/erfuellt', { page: 'wishlist', wishlistId, filter: 'fulfilled' }],
  ['#/liste/abc-1/bearbeiten', { page: 'editWishlist', wishlistId }],
  ['#/liste/abc-1/wunsch/neu', { page: 'createWish', wishlistId }],
  ['#/wunsch/w-1', { page: 'wish', wishId }],
  ['#/wunsch/w-1/bearbeiten', { page: 'editWish', wishId }],
];

describe('parseWishlistAddress', () => {
  it.each(addresses)('parses %s', (hash, address) => {
    expect(parseWishlistAddress(hash)).toEqual(address);
  });

  it.each(['#/liste/ab c', '#/wunsch/', '#/quatsch', '', '#/liste/abc-1/unbekannt'])(
    'rejects %j',
    (hash) => {
      expect(parseWishlistAddress(hash)).toBeUndefined();
    },
  );
});

describe('hashOf', () => {
  it.each(addresses)('gives %s back for its address', (hash, address) => {
    expect(hashOf(address)).toBe(hash);
  });
});
