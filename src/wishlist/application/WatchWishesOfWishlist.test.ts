import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf, type WishlistId } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import type { Rating } from '../domain/Rating';
import { Wish } from '../domain/Wish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { WatchWishesOfWishlist } from './WatchWishesOfWishlist';

const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');

function wish(name: string, wishlistId: WishlistId, rating?: Rating): Wish {
  return Wish.create(wishIdOf(name), wishlistId, { name: requireValid(Name.parse(name)), rating });
}

describe('WatchWishesOfWishlist', () => {
  it('reports only the wishes of the wishlist, sorted', async () => {
    const wishes = new InMemoryWishRepository();
    await wishes.save(wish('Buch', birthday));
    await wishes.save(wish('Schlitten', christmas));
    await wishes.save(wish('Helm', birthday, 'essential'));
    let reportedNames: string[] = [];

    new WatchWishesOfWishlist(wishes).execute(
      birthday,
      (reported) => {
        reportedNames = reported.map(({ details }) => details.name.value);
      },
      () => {},
    );

    expect(reportedNames).toEqual(['Helm', 'Buch']);
  });

  it('reports when the wishes cannot be watched', () => {
    const wishes = new InMemoryWishRepository();
    let failures = 0;
    new WatchWishesOfWishlist(wishes).execute(
      birthday,
      () => {},
      () => (failures += 1),
    );

    wishes.failWatchers();

    expect(failures).toBe(1);
  });
});
