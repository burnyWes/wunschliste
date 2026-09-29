import { describe, expect, it } from 'vitest';
import { personIdOf, wishlistIdOf } from '../../wishlist/domain/ids';
import { hashFor, mainPageOf, pageKeyOf, resolveRoute, type MainPage, type Route } from './routes';

const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');

describe('resolveRoute', () => {
  it.each<[string, Route]>([
    ['', { page: 'wishlists' }],
    ['#/', { page: 'wishlists' }],
    ['#/einstellungen', { page: 'settings' }],
    ['#/quatsch', { page: 'wishlists' }],
    ['#/liste/a', { page: 'wishlist', wishlistId: wishlistIdOf('a'), filter: 'open' }],
  ])('resolves %j', (hash, route) => {
    expect(resolveRoute(hash)).toEqual(route);
  });
});

describe('hashFor', () => {
  it('gives the canonical hash of each route', () => {
    expect(hashFor({ page: 'settings' })).toBe('#/einstellungen');
    expect(hashFor({ page: 'wishlists' })).toBe('#/');
    expect(hashFor({ page: 'wishlist', wishlistId: birthday, filter: 'fulfilled' })).toBe(
      '#/liste/birthday/erfuellt',
    );
  });
});

describe('pageKeyOf', () => {
  it('treats both filters of one wishlist as the same page', () => {
    expect(pageKeyOf({ page: 'wishlist', wishlistId: birthday, filter: 'open' })).toBe(
      pageKeyOf({ page: 'wishlist', wishlistId: birthday, filter: 'fulfilled' }),
    );
  });

  it('tells two wishlists apart', () => {
    expect(pageKeyOf({ page: 'wishlist', wishlistId: birthday, filter: 'open' })).not.toBe(
      pageKeyOf({ page: 'wishlist', wishlistId: christmas, filter: 'open' }),
    );
  });

  it('keys the settings page by its hash', () => {
    expect(pageKeyOf({ page: 'settings' })).toBe('#/einstellungen');
  });
});

describe('mainPageOf', () => {
  it.each<[Route, MainPage | undefined]>([
    [{ page: 'wishlists' }, 'wishlists'],
    [{ page: 'settings' }, 'settings'],
    [{ page: 'createWishlist' }, undefined],
    [{ page: 'wishlist', wishlistId: birthday, filter: 'open' }, undefined],
    [{ page: 'chooseProfile' }, undefined],
    [{ page: 'createPerson' }, undefined],
    [{ page: 'editPerson', personId: personIdOf('ben') }, undefined],
  ])('gives %j the main page %s', (route, mainPage) => {
    expect(mainPageOf(route)).toBe(mainPage);
  });
});
