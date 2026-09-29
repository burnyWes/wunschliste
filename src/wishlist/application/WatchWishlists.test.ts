import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wishlist } from '../domain/Wishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { WatchWishlists } from './WatchWishlists';

function wishlistNamed(name: string): Wishlist {
  return Wishlist.create(wishlistIdOf(name), requireValid(Name.parse(name)));
}

describe('WatchWishlists', () => {
  it('reports the wishlists sorted by name, including new ones, until unsubscribed', async () => {
    const wishlists = new InMemoryWishlistRepository();
    await wishlists.save(wishlistNamed('Weihnachten'));
    const reportedNames: string[][] = [];

    const unsubscribe = new WatchWishlists(wishlists).execute(
      (reported) => reportedNames.push(reported.map((wishlist) => wishlist.name.value)),
      () => {},
    );
    await wishlists.save(wishlistNamed('Geburtstag'));
    unsubscribe();
    await wishlists.save(wishlistNamed('Ostern'));

    expect(reportedNames).toEqual([['Weihnachten'], ['Geburtstag', 'Weihnachten']]);
  });

  it('reports when the wishlists cannot be watched', () => {
    const wishlists = new InMemoryWishlistRepository();
    let failures = 0;
    new WatchWishlists(wishlists).execute(
      () => {},
      () => (failures += 1),
    );

    wishlists.failWatchers();

    expect(failures).toBe(1);
  });
});
