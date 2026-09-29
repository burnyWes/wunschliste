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
    expect(perspectiveOf(annasBirthday, ben)).toEqual({ me: ben, ownerId: anna });
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
