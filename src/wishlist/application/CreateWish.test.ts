import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wishlist, WishlistNotFound } from '../domain/Wishlist';
import { CreateWish } from './CreateWish';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { SequentialIdGenerator } from './fakes/SequentialIdGenerator';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  const birthday = Wishlist.create(wishlistIdOf('b'), requireValid(Name.parse('Geburtstag')));
  await wishlists.save(birthday);
  const createWish = new CreateWish(wishlists, wishes, new SequentialIdGenerator());
  return { wishes, birthday, createWish };
}

describe('CreateWish', () => {
  it('saves an open wish on the wishlist and returns its id', async () => {
    const { wishes, birthday, createWish } = await setUp();

    const id = await createWish.execute(birthday.id, helmet);

    const saved = await wishes.get(id);
    expect(id).toBe('id-1');
    expect(saved?.wishlistId).toBe(birthday.id);
    expect(saved?.details).toBe(helmet);
    expect(saved?.isOpen).toBe(true);
  });

  it('refuses an unknown wishlist', async () => {
    const { createWish } = await setUp();

    await expect(createWish.execute(wishlistIdOf('unknown'), helmet)).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
