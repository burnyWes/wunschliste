import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf, type WishlistId } from '../domain/ids';
import type { RestoredWish, Wish } from '../domain/Wish';
import { WishlistNotFound } from '../domain/Wishlist';
import { DeleteWishlist } from './DeleteWishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');
const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');

function wish(id: string, wishlistId: WishlistId, state: Partial<RestoredWish> = {}): Wish {
  return wishNamed(id, { wishlistId, ...state });
}

async function setUp(...birthdayWishes: Wish[]) {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  await wishlists.save(wishlistNamed('Geburtstag', birthday, anna));
  await wishlists.save(wishlistNamed('Weihnachten', christmas, anna));
  for (const birthdayWish of [wish('helmet', birthday), ...birthdayWishes]) {
    await wishes.save(birthdayWish);
  }
  await wishes.save(wish('sledge', christmas));
  return { wishlists, wishes, deleteWishlist: new DeleteWishlist(wishlists, wishes) };
}

describe('DeleteWishlist', () => {
  it('deletes the wishlist of the owner with its wishes and keeps other wishlists', async () => {
    const { wishlists, wishes, deleteWishlist } = await setUp(wish('book', birthday));

    await deleteWishlist.execute(birthday, anna);

    expect(await wishlists.get(birthday)).toBeUndefined();
    expect(await wishlists.get(christmas)).toBeDefined();
    expect(await wishes.get(wishIdOf('helmet'))).toBeUndefined();
    expect(await wishes.get(wishIdOf('book'))).toBeUndefined();
    expect(await wishes.get(wishIdOf('sledge'))).toBeDefined();
  });

  it('only hides a wishlist with secrets from the owner and keeps its wishes', async () => {
    const secret = wish('tickets', birthday, { secret: true, createdBy: ben });
    const { wishlists, wishes, deleteWishlist } = await setUp(secret);

    await deleteWishlist.execute(birthday, anna);

    expect((await wishlists.get(birthday))?.removedByOwner).toBe(true);
    expect(await wishes.get(wishIdOf('tickets'))).toBe(secret);
    expect(await wishes.get(wishIdOf('helmet'))).toBeDefined();
  });

  it('only hides the wishlist from the owner while the wishes are not confirmed', async () => {
    const { wishlists, wishes, deleteWishlist } = await setUp();
    wishes.answerFromCacheOnly();

    await deleteWishlist.execute(birthday, anna);

    expect((await wishlists.get(birthday))?.removedByOwner).toBe(true);
    expect(await wishes.get(wishIdOf('helmet'))).toBeDefined();
  });

  it('lets someone else delete a wishlist with secrets for good', async () => {
    const { wishlists, wishes, deleteWishlist } = await setUp(
      wish('tickets', birthday, { giverId: ben }),
    );

    await deleteWishlist.execute(birthday, oma);

    expect(await wishlists.get(birthday)).toBeUndefined();
    expect(await wishes.get(wishIdOf('tickets'))).toBeUndefined();
  });

  it('refuses an unknown wishlist', async () => {
    const { deleteWishlist } = await setUp();

    await expect(deleteWishlist.execute(wishlistIdOf('unknown'), anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
