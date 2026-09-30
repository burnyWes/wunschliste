import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from '../domain/ids';
import { perspectiveOf } from '../domain/Perspective';
import { WishActionNotAllowed, WishNotFound } from '../domain/Wish';
import { allowedWishActions } from '../domain/wishActions';
import { WishlistNotFound } from '../domain/Wishlist';
import { ChangeWishState } from './ChangeWishState';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const helmet = wishIdOf('Helm');

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
  await wishes.save(wishNamed('Helm'));
  return { wishes, wishlists, changeWishState: new ChangeWishState(wishes, wishlists) };
}

describe('ChangeWishState', () => {
  it('saves the wish as gifted by me', async () => {
    const { wishes, changeWishState } = await setUp();

    await changeWishState.execute(helmet, ben, 'gift');

    expect((await wishes.get(helmet))?.giverId).toBe(ben);
  });

  it('lets the owner receive the wish', async () => {
    const { wishes, changeWishState } = await setUp();

    await changeWishState.execute(helmet, anna, 'receive');

    expect((await wishes.get(helmet))?.received).toBe(true);
  });

  it('records a gift of a repeatable wish and keeps it open for more gifts', async () => {
    const { wishes, wishlists, changeWishState } = await setUp();
    await wishes.save(wishNamed('Schokolade', { repeatable: true }));

    await changeWishState.execute(wishIdOf('Schokolade'), ben, 'gift');

    const gifted = await wishes.get(wishIdOf('Schokolade'));
    const wishlist = await wishlists.get(wishlistIdOf('birthday'));
    expect(gifted?.gifts).toEqual([{ recordedBy: ben }]);
    expect(
      gifted && wishlist && allowedWishActions(gifted, perspectiveOf(wishlist, ben)).primary,
    ).toBe('gift');
  });

  it('refuses an action that is not allowed and saves nothing', async () => {
    const { wishes, changeWishState } = await setUp();

    await expect(changeWishState.execute(helmet, anna, 'gift')).rejects.toThrow(
      WishActionNotAllowed,
    );
    expect((await wishes.get(helmet))?.giverId).toBeUndefined();
  });

  it('keeps a wishlist removed by the owner hidden from her', async () => {
    const { wishlists, changeWishState } = await setUp();
    await wishlists.save(removedWishlistNamed('Geburtstag', 'birthday', anna));

    await expect(changeWishState.execute(helmet, anna, 'receive')).rejects.toThrow(
      WishlistNotFound,
    );
  });

  it('refuses an unknown wish', async () => {
    const { changeWishState } = await setUp();

    await expect(changeWishState.execute(wishIdOf('unknown'), ben, 'gift')).rejects.toThrow(
      WishNotFound,
    );
  });

  it('refuses a wish of an unknown wishlist', async () => {
    const { wishes, changeWishState } = await setUp();
    await wishes.save(wishNamed('Zelt', { wishlistId: wishlistIdOf('unknown') }));

    await expect(changeWishState.execute(wishIdOf('Zelt'), ben, 'gift')).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
