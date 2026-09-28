import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { sortWishlists, Wishlist } from './Wishlist';

function nameOf(raw: string): Name {
  return requireValid(Name.parse(raw));
}

function wishlistNamed(raw: string, id = raw): Wishlist {
  return Wishlist.create(wishlistIdOf(id), nameOf(raw));
}

describe('Wishlist', () => {
  it('carries its id and name', () => {
    const wishlist = wishlistNamed('Geburtstag', 'id-1');

    expect(wishlist.id).toBe('id-1');
    expect(wishlist.name.value).toBe('Geburtstag');
  });

  it('is renamed into a new wishlist with the same id', () => {
    const wishlist = wishlistNamed('Geburtstag', 'id-1');

    const renamed = wishlist.rename(nameOf('Weihnachten'));

    expect(renamed.id).toBe('id-1');
    expect(renamed.name.value).toBe('Weihnachten');
    expect(wishlist.name.value).toBe('Geburtstag');
  });
});

describe('sortWishlists', () => {
  it('sorts alphabetically in German', () => {
    const sorted = sortWishlists(
      ['Weihnachten', 'ärger', 'Apfel'].map((name) => wishlistNamed(name)),
    );

    expect(sorted.map((wishlist) => wishlist.name.value)).toEqual([
      'Apfel',
      'ärger',
      'Weihnachten',
    ]);
  });

  it('orders equal names by id to stay stable', () => {
    const sorted = sortWishlists([wishlistNamed('Gleich', 'b'), wishlistNamed('Gleich', 'a')]);

    expect(sorted.map((wishlist) => wishlist.id)).toEqual(['a', 'b']);
  });
});
