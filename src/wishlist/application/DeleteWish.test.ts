import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf } from '../domain/ids';
import { WishlistNotFound } from '../domain/Wishlist';
import { DeleteWish } from './DeleteWish';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
  return { wishes, wishlists, deleteWish: new DeleteWish(wishes, wishlists) };
}

describe('DeleteWish', () => {
  it('deletes an open wish of the owner', async () => {
    const { wishes, deleteWish } = await setUp();
    await wishes.save(wishNamed('Zelt'));

    await deleteWish.execute(wishIdOf('Zelt'), anna);

    expect(await wishes.get(wishIdOf('Zelt'))).toBeUndefined();
  });

  it('only hides a gift the owner has not received yet', async () => {
    const { wishes, deleteWish } = await setUp();
    await wishes.save(wishNamed('Zelt', { giverId: ben }));

    await deleteWish.execute(wishIdOf('Zelt'), anna);

    const hidden = await wishes.get(wishIdOf('Zelt'));
    expect(hidden?.removedByOwner).toBe(true);
    expect(hidden?.giverId).toBe(ben);
  });

  it('lets someone else delete a wish removed by the owner for good', async () => {
    const { wishes, deleteWish } = await setUp();
    await wishes.save(wishNamed('Zelt', { giverId: ben, removedByOwner: true }));

    await deleteWish.execute(wishIdOf('Zelt'), oma);

    expect(await wishes.get(wishIdOf('Zelt'))).toBeUndefined();
  });

  it('ignores an unknown wish', async () => {
    const { deleteWish } = await setUp();

    await expect(deleteWish.execute(wishIdOf('unknown'), anna)).resolves.toBeUndefined();
  });

  it('keeps a wishlist removed by the owner hidden from her', async () => {
    const { wishes, wishlists, deleteWish } = await setUp();
    await wishes.save(wishNamed('Zelt'));
    await wishlists.save(removedWishlistNamed('Geburtstag', 'birthday', anna));

    await expect(deleteWish.execute(wishIdOf('Zelt'), anna)).rejects.toThrow(WishlistNotFound);
    expect(await wishes.get(wishIdOf('Zelt'))).toBeDefined();
  });
});
