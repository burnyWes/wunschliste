import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { WishHiddenFromOwner, WishNotFound } from '../domain/Wish';
import { WishlistNotFound } from '../domain/Wishlist';
import { EditWish } from './EditWish';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';

const tent = { name: requireValid(Name.parse('Zelt')) };
const anna = personIdOf('anna');
const ben = personIdOf('ben');

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const wishes = new InMemoryWishRepository();
  await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
  return { wishes, wishlists, editWish: new EditWish(wishes, wishlists) };
}

describe('EditWish', () => {
  it('saves the new details and keeps the gift state', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Helm', { giverId: ben, received: true }));

    await editWish.execute(wishIdOf('Helm'), tent, false, anna);

    const edited = await wishes.get(wishIdOf('Helm'));
    expect(edited?.details).toBe(tent);
    expect(edited?.giverId).toBe('ben');
    expect(edited?.received).toBe(true);
  });

  it('reveals a secret wish', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Konzert', { secret: true, createdBy: ben }));

    await editWish.execute(wishIdOf('Konzert'), tent, false, ben);

    expect((await wishes.get(wishIdOf('Konzert')))?.secret).toBe(false);
  });

  it('keeps the owner from editing a secret wish', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Konzert', { secret: true, createdBy: ben }));

    await expect(editWish.execute(wishIdOf('Konzert'), tent, true, anna)).rejects.toThrow(
      WishHiddenFromOwner,
    );
  });

  it('keeps a wishlist removed by the owner hidden from her', async () => {
    const { wishes, wishlists, editWish } = await setUp();
    await wishes.save(wishNamed('Helm'));
    await wishlists.save(removedWishlistNamed('Geburtstag', 'birthday', anna));

    await expect(editWish.execute(wishIdOf('Helm'), tent, false, anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });

  it('refuses an unknown wish', async () => {
    const { editWish } = await setUp();

    await expect(editWish.execute(wishIdOf('x'), tent, false, anna)).rejects.toThrow(WishNotFound);
  });

  it('refuses a wish of an unknown wishlist', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Helm', { wishlistId: wishlistIdOf('unknown') }));

    await expect(editWish.execute(wishIdOf('Helm'), tent, false, anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
