import { describe, expect, it } from 'vitest';
import { personIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { isOwner, perspectiveOf } from './Perspective';
import { Wishlist } from './Wishlist';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const annasBirthday = Wishlist.create(
  wishlistIdOf('birthday'),
  requireValid(Name.parse('Geburtstag')),
  anna,
);

describe('perspectiveOf', () => {
  it('looks at the wishlist as me with its owner', () => {
    expect(perspectiveOf(annasBirthday, ben)).toEqual({
      me: ben,
      ownerId: anna,
      wishlistIsHidden: false,
    });
  });
});

describe('perspectiveOf a wishlist removed by its owner', () => {
  const removed = Wishlist.restore({
    id: wishlistIdOf('birthday'),
    name: requireValid(Name.parse('Geburtstag')),
    ownerId: anna,
    removedByOwner: true,
  });

  it('hides the wishlist from the owner', () => {
    expect(perspectiveOf(removed, anna).wishlistIsHidden).toBe(true);
  });

  it('keeps the wishlist visible to everyone else', () => {
    expect(perspectiveOf(removed, ben).wishlistIsHidden).toBe(false);
  });
});

describe('isOwner', () => {
  it('is true when I own the wishlist', () => {
    expect(isOwner(perspectiveOf(annasBirthday, anna))).toBe(true);
  });

  it('is false when someone else owns the wishlist', () => {
    expect(isOwner(perspectiveOf(annasBirthday, ben))).toBe(false);
  });
});
