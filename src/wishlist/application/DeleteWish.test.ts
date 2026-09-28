import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wish } from '../domain/Wish';
import { DeleteWish } from './DeleteWish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';

describe('DeleteWish', () => {
  it('removes the wish', async () => {
    const wishes = new InMemoryWishRepository();
    await wishes.save(
      Wish.create(wishIdOf('w'), wishlistIdOf('l'), { name: requireValid(Name.parse('Zelt')) }),
    );

    await new DeleteWish(wishes).execute(wishIdOf('w'));

    expect(await wishes.get(wishIdOf('w'))).toBeUndefined();
  });
});
