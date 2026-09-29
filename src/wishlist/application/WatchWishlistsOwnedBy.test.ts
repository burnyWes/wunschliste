import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { wishlistNamed } from './fakes/wishlistNamed';
import { WatchWishlistsOwnedBy } from './WatchWishlistsOwnedBy';

const anna = personIdOf('anna');
const ben = personIdOf('ben');

describe('WatchWishlistsOwnedBy', () => {
  it('reports only the wishlists of the owner, including new ones', async () => {
    const wishlists = new InMemoryWishlistRepository();
    await wishlists.save(wishlistNamed('Ostern', 'easter', ben));
    const reportedNames: string[][] = [];

    new WatchWishlistsOwnedBy(wishlists).execute(
      ben,
      (reported) => reportedNames.push(reported.map((wishlist) => wishlist.name.value)),
      () => {},
    );
    await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));

    expect(reportedNames).toEqual([['Ostern'], ['Ostern']]);
  });

  it('reports when the wishlists cannot be watched', () => {
    const wishlists = new InMemoryWishlistRepository();
    let failures = 0;
    new WatchWishlistsOwnedBy(wishlists).execute(
      ben,
      () => {},
      () => (failures += 1),
    );

    wishlists.failWatchers();

    expect(failures).toBe(1);
  });
});
