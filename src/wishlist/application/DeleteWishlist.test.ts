import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf, type WishlistId } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wish } from '../domain/Wish';
import { DeleteWishlist } from './DeleteWishlist';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { wishlistNamed } from './fakes/wishlistNamed';

const nameOf = (raw: string) => requireValid(Name.parse(raw));
const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');

function wish(id: string, wishlistId: WishlistId): Wish {
  return Wish.create(wishIdOf(id), wishlistId, { name: nameOf(id) });
}

describe('DeleteWishlist', () => {
  it('deletes the wishlist with its wishes and keeps the wishes of other wishlists', async () => {
    const wishlists = new InMemoryWishlistRepository();
    const wishes = new InMemoryWishRepository();
    await wishlists.save(wishlistNamed('Geburtstag', birthday));
    await wishlists.save(wishlistNamed('Weihnachten', christmas));
    await wishes.save(wish('helmet', birthday));
    await wishes.save(wish('book', birthday));
    await wishes.save(wish('sledge', christmas));

    await new DeleteWishlist(wishlists, wishes).execute(birthday);

    expect(await wishlists.get(birthday)).toBeUndefined();
    expect(await wishlists.get(christmas)).toBeDefined();
    expect(await wishes.get(wishIdOf('helmet'))).toBeUndefined();
    expect(await wishes.get(wishIdOf('book'))).toBeUndefined();
    expect(await wishes.get(wishIdOf('sledge'))).toBeDefined();
  });
});
