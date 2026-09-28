import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wishlist } from '../domain/Wishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { WatchWishlist } from './WatchWishlist';

describe('WatchWishlist', () => {
  it('reports the wishlist with the given id', async () => {
    const wishlists = new InMemoryWishlistRepository();
    const birthday = Wishlist.create(wishlistIdOf('b'), requireValid(Name.parse('Geburtstag')));
    await wishlists.save(birthday);
    let reported: Wishlist | undefined;

    new WatchWishlist(wishlists).execute(birthday.id, (wishlist) => (reported = wishlist));

    expect(reported).toBe(birthday);
  });

  it('reports undefined for an unknown id', () => {
    const reports: (Wishlist | undefined)[] = [];

    new WatchWishlist(new InMemoryWishlistRepository()).execute(
      wishlistIdOf('unknown'),
      (wishlist) => reports.push(wishlist),
    );

    expect(reports).toEqual([undefined]);
  });
});
