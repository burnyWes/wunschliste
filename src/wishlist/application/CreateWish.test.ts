import { describe, expect, it } from 'vitest';
import { CalendarDate } from '../domain/CalendarDate';
import { personIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { WishlistNotFound } from '../domain/Wishlist';
import { CreateWish } from './CreateWish';
import { FixedClock } from './fakes/FixedClock';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { SequentialIdGenerator } from './fakes/SequentialIdGenerator';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };
const ben = personIdOf('ben');
const piDay = CalendarDate.of(2027, 3, 14);

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  const birthday = wishlistNamed('Geburtstag', 'b');
  await wishlists.save(birthday);
  const createWish = new CreateWish(
    wishlists,
    wishes,
    new SequentialIdGenerator(),
    new FixedClock(piDay),
  );
  return { wishes, wishlists, birthday, createWish };
}

describe('CreateWish', () => {
  it('saves an open wish on the wishlist and returns its id', async () => {
    const { wishes, birthday, createWish } = await setUp();

    const id = await createWish.execute(birthday.id, helmet, false, ben);

    const saved = await wishes.get(id);
    expect(id).toBe('id-1');
    expect(saved?.wishlistId).toBe(birthday.id);
    expect(saved?.details).toBe(helmet);
    expect(saved?.giverId).toBeUndefined();
    expect(saved?.received).toBe(false);
    expect(saved?.secret).toBe(false);
  });

  it('keeps the wish secret in the wishlist of someone else', async () => {
    const { wishes, birthday, createWish } = await setUp();

    const id = await createWish.execute(birthday.id, helmet, true, ben);

    expect((await wishes.get(id))?.secret).toBe(true);
  });

  it('remembers me as the creator', async () => {
    const { wishes, birthday, createWish } = await setUp();

    const id = await createWish.execute(birthday.id, helmet, false, ben);

    expect((await wishes.get(id))?.createdBy).toBe(ben);
  });

  it('remembers the day the wish was created', async () => {
    const { wishes, birthday, createWish } = await setUp();

    const id = await createWish.execute(birthday.id, helmet, false, ben);

    expect((await wishes.get(id))?.createdOn).toEqual(piDay);
  });

  it('keeps a wishlist removed by the owner hidden from her', async () => {
    const { wishlists, createWish } = await setUp();
    await wishlists.save(removedWishlistNamed('Geburtstag', 'b'));

    await expect(
      createWish.execute(wishlistIdOf('b'), helmet, false, personIdOf('anna')),
    ).rejects.toThrow(WishlistNotFound);
  });

  it('refuses an unknown wishlist', async () => {
    const { createWish } = await setUp();

    await expect(createWish.execute(wishlistIdOf('unknown'), helmet, false, ben)).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
