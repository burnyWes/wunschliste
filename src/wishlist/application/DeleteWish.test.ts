import { describe, expect, it } from 'vitest';
import { wishIdOf } from '../domain/ids';
import { DeleteWish } from './DeleteWish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { wishNamed } from './fakes/wishNamed';

describe('DeleteWish', () => {
  it('removes the wish', async () => {
    const wishes = new InMemoryWishRepository();
    await wishes.save(wishNamed('Zelt'));

    await new DeleteWish(wishes).execute(wishIdOf('Zelt'));

    expect(await wishes.get(wishIdOf('Zelt'))).toBeUndefined();
  });
});
