import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { PersonNotFound } from '../domain/Person';
import { CreateWishlist } from './CreateWishlist';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { personNamed } from './fakes/personNamed';
import { SequentialIdGenerator } from './fakes/SequentialIdGenerator';

const birthday = requireValid(Name.parse('Geburtstag'));

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const persons = new InMemoryPersonRepository();
  await persons.save(personNamed('Ben'));
  const createWishlist = new CreateWishlist(wishlists, persons, new SequentialIdGenerator());
  return { wishlists, createWishlist };
}

describe('CreateWishlist', () => {
  it('saves a wishlist for its owner under the next id and returns that id', async () => {
    const { wishlists, createWishlist } = await setUp();

    const id = await createWishlist.execute(birthday, personIdOf('ben'));

    const saved = await wishlists.get(id);
    expect(id).toBe('id-1');
    expect(saved?.name.value).toBe('Geburtstag');
    expect(saved?.ownerId).toBe('ben');
  });

  it('refuses an owner that does not exist', async () => {
    const { wishlists, createWishlist } = await setUp();

    await expect(createWishlist.execute(birthday, personIdOf('gone'))).rejects.toThrow(
      PersonNotFound,
    );
    expect(await wishlists.getOwnedBy(personIdOf('gone'))).toEqual([]);
  });
});
