import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { WishlistNotFound } from '../domain/Wishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { wishlistNamed } from './fakes/wishlistNamed';
import { RenameWishlist } from './RenameWishlist';

const nameOf = (raw: string) => requireValid(Name.parse(raw));

describe('RenameWishlist', () => {
  it('saves the new name', async () => {
    const wishlists = new InMemoryWishlistRepository();
    await wishlists.save(wishlistNamed('Geburtstag', 'b'));

    await new RenameWishlist(wishlists).execute(wishlistIdOf('b'), nameOf('Weihnachten'));

    expect((await wishlists.get(wishlistIdOf('b')))?.name.value).toBe('Weihnachten');
  });

  it('refuses an unknown wishlist', async () => {
    const renameWishlist = new RenameWishlist(new InMemoryWishlistRepository());

    await expect(renameWishlist.execute(wishlistIdOf('x'), nameOf('Ostern'))).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
