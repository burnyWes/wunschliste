import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Price } from './Price';
import { Wish, WishAlreadyGifted, WishNotGifted } from './Wish';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };

const openWish = () => Wish.create(wishIdOf('w'), wishlistIdOf('l'), helmet);

describe('Wish', () => {
  it('is open when created', () => {
    const wish = Wish.create(wishIdOf('w'), wishlistIdOf('l'), helmet);

    expect(wish.isOpen).toBe(true);
    expect(wish.gifted).toBe(false);
  });

  it('is edited into a new wish that keeps id, wishlist and gift state', () => {
    const wish = Wish.restore({
      id: wishIdOf('w'),
      wishlistId: wishlistIdOf('l'),
      details: helmet,
      gifted: true,
    });
    const editedDetails = { ...helmet, price: requireValid(Price.ofCents(4999)) };

    const edited = wish.edit(editedDetails);

    expect(edited.details).toBe(editedDetails);
    expect(edited.id).toBe('w');
    expect(edited.wishlistId).toBe('l');
    expect(edited.gifted).toBe(true);
    expect(wish.details).toBe(helmet);
  });

  it('is gifted into a wish that is no longer open', () => {
    const gifted = openWish().gift();

    expect(gifted.gifted).toBe(true);
    expect(gifted.isOpen).toBe(false);
    expect(gifted.id).toBe('w');
  });

  it('cannot be gifted twice', () => {
    expect(() => openWish().gift().gift()).toThrow(WishAlreadyGifted);
  });

  it('is open again after taking the gift back', () => {
    expect(openWish().gift().takeBackGift().isOpen).toBe(true);
  });

  it('cannot take back a gift that was never given', () => {
    expect(() => openWish().takeBackGift()).toThrow(WishNotGifted);
  });
});
