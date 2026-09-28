import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wish } from '../domain/Wish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { WatchWish } from './WatchWish';

describe('WatchWish', () => {
  it('reports the wish with the given id', async () => {
    const wishes = new InMemoryWishRepository();
    const helmet = Wish.create(wishIdOf('h'), wishlistIdOf('l'), {
      name: requireValid(Name.parse('Fahrradhelm')),
    });
    await wishes.save(helmet);
    let reported: Wish | undefined;

    new WatchWish(wishes).execute(helmet.id, (wish) => (reported = wish));

    expect(reported).toBe(helmet);
  });

  it('reports undefined for an unknown id', () => {
    const reports: (Wish | undefined)[] = [];

    new WatchWish(new InMemoryWishRepository()).execute(wishIdOf('unknown'), (wish) =>
      reports.push(wish),
    );

    expect(reports).toEqual([undefined]);
  });
});
