import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../domain/ids';
import type { Wishlist } from '../domain/Wishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { wishlistNamed } from './fakes/wishlistNamed';
import { WatchWishlist } from './WatchWishlist';

describe('WatchWishlist', () => {
  it('reports the wishlist with the given id', async () => {
    const wishlists = new InMemoryWishlistRepository();
    const birthday = wishlistNamed('Geburtstag', 'b');
    await wishlists.save(birthday);
    let reported: Wishlist | undefined;

    new WatchWishlist(wishlists).execute(
      birthday.id,
      (wishlist) => (reported = wishlist),
      () => {},
    );

    expect(reported).toBe(birthday);
  });

  it('reports undefined for an unknown id', () => {
    const reports: (Wishlist | undefined)[] = [];

    new WatchWishlist(new InMemoryWishlistRepository()).execute(
      wishlistIdOf('unknown'),
      (wishlist) => reports.push(wishlist),
      () => {},
    );

    expect(reports).toEqual([undefined]);
  });

  it('reports when the wishlist cannot be watched', () => {
    const wishlists = new InMemoryWishlistRepository();
    let failures = 0;
    new WatchWishlist(wishlists).execute(
      wishlistIdOf('b'),
      () => {},
      () => (failures += 1),
    );

    wishlists.failWatchers();

    expect(failures).toBe(1);
  });
});
