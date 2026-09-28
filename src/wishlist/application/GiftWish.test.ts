import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from '../domain/ids';
import { Name } from '../domain/Name';
import { requireValid } from '../domain/parsed';
import { Wish, WishNotFound } from '../domain/Wish';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { GiftWish } from './GiftWish';
import { TakeBackGift } from './TakeBackGift';

async function repositoryWithOpenWish(): Promise<InMemoryWishRepository> {
  const wishes = new InMemoryWishRepository();
  await wishes.save(
    Wish.create(wishIdOf('w'), wishlistIdOf('l'), { name: requireValid(Name.parse('Zelt')) }),
  );
  return wishes;
}

describe('GiftWish', () => {
  it('saves the wish as gifted', async () => {
    const wishes = await repositoryWithOpenWish();

    await new GiftWish(wishes).execute(wishIdOf('w'));

    expect((await wishes.get(wishIdOf('w')))?.gifted).toBe(true);
  });

  it('refuses an unknown wish', async () => {
    await expect(new GiftWish(new InMemoryWishRepository()).execute(wishIdOf('x'))).rejects.toThrow(
      WishNotFound,
    );
  });
});

describe('TakeBackGift', () => {
  it('saves the wish as open again', async () => {
    const wishes = await repositoryWithOpenWish();
    await new GiftWish(wishes).execute(wishIdOf('w'));

    await new TakeBackGift(wishes).execute(wishIdOf('w'));

    expect((await wishes.get(wishIdOf('w')))?.isOpen).toBe(true);
  });

  it('refuses an unknown wish', async () => {
    await expect(
      new TakeBackGift(new InMemoryWishRepository()).execute(wishIdOf('x')),
    ).rejects.toThrow(WishNotFound);
  });
});
