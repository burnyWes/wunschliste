import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { RepeatabilityLocked, WishHiddenFromOwner, WishNotFound } from '../domain/Wish';
import { WishlistNotFound } from '../domain/Wishlist';
import { EditWish } from './EditWish';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';

const tent = { name: requireValid(Name.parse('Zelt')) };
const plainTraits = { secret: false, repeatable: false };
const secretTraits = { secret: true, repeatable: false };
const repeatableTraits = { secret: false, repeatable: true };
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

    await editWish.execute(wishIdOf('Helm'), tent, plainTraits, anna);

    const edited = await wishes.get(wishIdOf('Helm'));
    expect(edited?.details).toBe(tent);
    expect(edited?.giverId).toBe('ben');
    expect(edited?.received).toBe(true);
  });

  it('reveals a secret wish', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Konzert', { secret: true, createdBy: ben }));

    await editWish.execute(wishIdOf('Konzert'), tent, plainTraits, ben);

    expect((await wishes.get(wishIdOf('Konzert')))?.secret).toBe(false);
  });

  it('keeps the owner from editing a secret wish', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Konzert', { secret: true, createdBy: ben }));

    await expect(editWish.execute(wishIdOf('Konzert'), tent, secretTraits, anna)).rejects.toThrow(
      WishHiddenFromOwner,
    );
  });

  it('turns an untouched wish repeatable', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Schokolade'));

    await editWish.execute(wishIdOf('Schokolade'), tent, repeatableTraits, anna);

    expect((await wishes.get(wishIdOf('Schokolade')))?.repeatable).toBe(true);
  });

  it('refuses to turn a gifted wish repeatable', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Schokolade', { giverId: ben }));

    await expect(
      editWish.execute(wishIdOf('Schokolade'), tent, repeatableTraits, anna),
    ).rejects.toThrow(RepeatabilityLocked);
  });

  it('keeps a wishlist removed by the owner hidden from her', async () => {
    const { wishes, wishlists, editWish } = await setUp();
    await wishes.save(wishNamed('Helm'));
    await wishlists.save(removedWishlistNamed('Geburtstag', 'birthday', anna));

    await expect(editWish.execute(wishIdOf('Helm'), tent, plainTraits, anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });

  it('refuses an unknown wish', async () => {
    const { editWish } = await setUp();

    await expect(editWish.execute(wishIdOf('x'), tent, plainTraits, anna)).rejects.toThrow(
      WishNotFound,
    );
  });

  it('refuses a wish of an unknown wishlist', async () => {
    const { wishes, editWish } = await setUp();
    await wishes.save(wishNamed('Helm', { wishlistId: wishlistIdOf('unknown') }));

    await expect(editWish.execute(wishIdOf('Helm'), tent, plainTraits, anna)).rejects.toThrow(
      WishlistNotFound,
    );
  });
});
