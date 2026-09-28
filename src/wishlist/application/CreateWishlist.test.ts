import { describe, expect, it } from 'vitest';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { CreateWishlist } from './CreateWishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { SequentialIdGenerator } from './fakes/SequentialIdGenerator';

describe('CreateWishlist', () => {
  it('saves a wishlist under the next id and returns that id', async () => {
    const wishlists = new InMemoryWishlistRepository();
    const createWishlist = new CreateWishlist(wishlists, new SequentialIdGenerator());

    const id = await createWishlist.execute(requireValid(Name.parse('Geburtstag')));

    expect(id).toBe('id-1');
    expect((await wishlists.get(id))?.name.value).toBe('Geburtstag');
  });
});
