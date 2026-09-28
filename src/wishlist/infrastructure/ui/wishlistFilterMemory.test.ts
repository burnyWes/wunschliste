import { describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../../domain/ids';
import { WishlistFilterMemory } from './wishlistFilterMemory';

const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');

describe('WishlistFilterMemory', () => {
  it('leads to the open wishes of a wishlist without a chosen filter', () => {
    expect(new WishlistFilterMemory().hashOf(birthday)).toBe('#/liste/birthday');
  });

  it('leads to the last chosen filter', () => {
    const memory = new WishlistFilterMemory();

    memory.remember(birthday, 'fulfilled');

    expect(memory.hashOf(birthday)).toBe('#/liste/birthday/erfuellt');
  });

  it('keeps the filters of two wishlists apart', () => {
    const memory = new WishlistFilterMemory();

    memory.remember(birthday, 'fulfilled');
    memory.remember(christmas, 'open');

    expect(memory.hashOf(birthday)).toBe('#/liste/birthday/erfuellt');
    expect(memory.hashOf(christmas)).toBe('#/liste/christmas');
  });
});
