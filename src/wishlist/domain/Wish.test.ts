import { describe, expect, it } from 'vitest';
import { wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Price } from './Price';
import { Wish } from './Wish';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };

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
});
