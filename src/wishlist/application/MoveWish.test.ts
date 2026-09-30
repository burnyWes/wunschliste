import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from '../domain/ids';
import { WishHiddenFromOwner, WishNotFound } from '../domain/Wish';
import { WishlistNotFound } from '../domain/Wishlist';
import { WishCannotMoveThere } from '../domain/wishMove';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';
import { MoveWish } from './MoveWish';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const christmas = wishlistIdOf('christmas');

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
  await wishlists.save(wishlistNamed('Weihnachten', 'christmas', anna));
  await wishlists.save(wishlistNamed('Bens Liste', 'bens', ben));
  return { wishes, moveWish: new MoveWish(wishes, wishlists) };
}

describe('MoveWish', () => {
  it('moves a wish into another wishlist and keeps its gift state', async () => {
    const { wishes, moveWish } = await setUp();
    await wishes.save(wishNamed('Helm', { giverId: ben, received: true }));

    await moveWish.execute(wishIdOf('Helm'), christmas, anna);

    const moved = await wishes.get(wishIdOf('Helm'));
    expect(moved?.wishlistId).toBe(christmas);
    expect(moved?.giverId).toBe(ben);
    expect(moved?.received).toBe(true);
  });

  it('lets someone else move a secret wish', async () => {
    const { wishes, moveWish } = await setUp();
    await wishes.save(wishNamed('Konzert', { secret: true, createdBy: ben }));

    await moveWish.execute(wishIdOf('Konzert'), christmas, ben);

    const moved = await wishes.get(wishIdOf('Konzert'));
    expect(moved?.wishlistId).toBe(christmas);
    expect(moved?.secret).toBe(true);
  });

  it('refuses a wishlist of someone else', async () => {
    const { wishes, moveWish } = await setUp();
    await wishes.save(wishNamed('Helm'));

    await expect(moveWish.execute(wishIdOf('Helm'), wishlistIdOf('bens'), anna)).rejects.toThrow(
      WishCannotMoveThere,
    );
  });

  it('keeps the owner from moving a secret wish', async () => {
    const { wishes, moveWish } = await setUp();
    await wishes.save(wishNamed('Konzert', { secret: true, createdBy: ben }));

    await expect(moveWish.execute(wishIdOf('Konzert'), christmas, anna)).rejects.toThrow(
      WishHiddenFromOwner,
    );
  });

  it('refuses an unknown wish', async () => {
    const { moveWish } = await setUp();

    await expect(moveWish.execute(wishIdOf('x'), christmas, anna)).rejects.toThrow(WishNotFound);
  });

  it('refuses a wish of an unknown wishlist', async () => {
    const { wishes, moveWish } = await setUp();
    await wishes.save(wishNamed('Helm', { wishlistId: wishlistIdOf('unknown') }));

    await expect(moveWish.execute(wishIdOf('Helm'), christmas, anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });

  it('refuses an unknown target wishlist', async () => {
    const { wishes, moveWish } = await setUp();
    await wishes.save(wishNamed('Helm'));

    await expect(moveWish.execute(wishIdOf('Helm'), wishlistIdOf('unknown'), anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
