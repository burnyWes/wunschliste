import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wish, WishNotFound } from '../domain/Wish';
import { EditWish } from './EditWish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };
const tent = { name: requireValid(Name.parse('Zelt')) };

describe('EditWish', () => {
  it('saves the new details and keeps the gift state', async () => {
    const wishes = new InMemoryWishRepository();
    await wishes.save(
      Wish.restore({
        id: wishIdOf('w'),
        wishlistId: wishlistIdOf('l'),
        details: helmet,
        gifted: true,
      }),
    );

    await new EditWish(wishes).execute(wishIdOf('w'), tent);

    const edited = await wishes.get(wishIdOf('w'));
    expect(edited?.details).toBe(tent);
    expect(edited?.gifted).toBe(true);
  });

  it('refuses an unknown wish', async () => {
    await expect(
      new EditWish(new InMemoryWishRepository()).execute(wishIdOf('x'), tent),
    ).rejects.toThrow(WishNotFound);
  });
});
