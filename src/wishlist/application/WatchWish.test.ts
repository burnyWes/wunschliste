import { describe, expect, it } from 'vitest';
import { wishIdOf } from '../domain/ids';
import type { Wish } from '../domain/Wish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { wishNamed } from './fakes/wishNamed';
import { WatchWish } from './WatchWish';

describe('WatchWish', () => {
  it('reports the wish with the given id', async () => {
    const wishes = new InMemoryWishRepository();
    const helmet = wishNamed('Fahrradhelm');
    await wishes.save(helmet);
    let reported: Wish | undefined;

    new WatchWish(wishes).execute(
      helmet.id,
      (wish) => (reported = wish),
      () => {},
    );

    expect(reported).toBe(helmet);
  });

  it('reports undefined for an unknown id', () => {
    const reports: (Wish | undefined)[] = [];

    new WatchWish(new InMemoryWishRepository()).execute(
      wishIdOf('unknown'),
      (wish) => reports.push(wish),
      () => {},
    );

    expect(reports).toEqual([undefined]);
  });

  it('reports when the wish cannot be watched', () => {
    const wishes = new InMemoryWishRepository();
    let failures = 0;
    new WatchWish(wishes).execute(
      wishIdOf('h'),
      () => {},
      () => (failures += 1),
    );

    wishes.failWatchers();

    expect(failures).toBe(1);
  });
});
