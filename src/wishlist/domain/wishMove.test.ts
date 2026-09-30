import { describe, expect, it } from 'vitest';
import { CalendarDate } from './CalendarDate';
import { personIdOf, wishIdOf, wishlistIdOf, type PersonId } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Wish, WishHiddenFromOwner, type RestoredWish } from './Wish';
import { Wishlist, WishlistNotFound } from './Wishlist';
import { moveTargetsOf, moveWish, WishCannotMoveThere } from './wishMove';

const anna = personIdOf('anna');
const ben = personIdOf('ben');

function wishlistOf(name: string, ownerId: PersonId = anna, removedByOwner = false): Wishlist {
  return Wishlist.restore({
    id: wishlistIdOf(name),
    name: requireValid(Name.parse(name)),
    ownerId,
    removedByOwner,
  });
}

function removedWishlistOf(name: string, ownerId: PersonId = anna): Wishlist {
  return wishlistOf(name, ownerId, true);
}

const birthday = wishlistOf('Geburtstag');
const christmas = wishlistOf('Weihnachten');
const easter = wishlistOf('Ostern');
const bens = wishlistOf('Bens Liste', ben);

function wishIn(wishlist: Wishlist, state: Partial<RestoredWish> = {}): Wish {
  return Wish.restore({
    id: wishIdOf('helmet'),
    wishlistId: wishlist.id,
    details: { name: requireValid(Name.parse('Helm')) },
    createdOn: CalendarDate.of(2026, 9, 29),
    createdBy: anna,
    secret: false,
    giverId: undefined,
    received: false,
    removedByOwner: false,
    repeatable: false,
    gifts: [],
    ...state,
  });
}

describe('moveTargetsOf', () => {
  it('offers the other wishlists of the owner in alphabetical order', () => {
    expect(moveTargetsOf(birthday, [christmas, birthday, easter])).toEqual([easter, christmas]);
  });

  it('leaves out wishlists of other persons', () => {
    expect(moveTargetsOf(birthday, [christmas, bens])).toEqual([christmas]);
  });

  it('leaves out wishlists the owner removed', () => {
    expect(moveTargetsOf(birthday, [christmas, removedWishlistOf('Alt')])).toEqual([christmas]);
  });

  it('offers nothing from a wishlist the owner removed', () => {
    const removed = removedWishlistOf('Alt');

    expect(moveTargetsOf(removed, [removed, christmas, easter])).toEqual([]);
  });
});

describe('moveWish', () => {
  it.each([
    ['the owner', anna],
    ['someone else', ben],
  ])('lets %s move a wish to another wishlist of the owner', (_, me) => {
    expect(moveWish(wishIn(birthday), birthday, christmas, me).wishlistId).toBe(christmas.id);
  });

  it('keeps a secret wish secret when someone else moves it', () => {
    const secret = wishIn(birthday, { secret: true, createdBy: ben });

    const moved = moveWish(secret, birthday, christmas, ben);

    expect(moved.wishlistId).toBe(christmas.id);
    expect(moved.secret).toBe(true);
  });

  it('keeps a wish removed by the owner removed when someone else moves it', () => {
    const removed = wishIn(birthday, { removedByOwner: true, giverId: ben });

    expect(moveWish(removed, birthday, christmas, ben).removedByOwner).toBe(true);
  });

  it.each([
    ['a move into a wishlist of someone else', birthday, bens],
    ['a move into the same wishlist', birthday, birthday],
    ['a move into a wishlist the owner removed', birthday, removedWishlistOf('Alt')],
    ['a move out of a wishlist the owner removed', removedWishlistOf('Alt'), christmas],
  ])('refuses %s', (_, source, target) => {
    expect(() => moveWish(wishIn(source), source, target, ben)).toThrow(WishCannotMoveThere);
  });

  it('refuses a source the wish is not in', () => {
    expect(() => moveWish(wishIn(easter), birthday, christmas, anna)).toThrow(WishCannotMoveThere);
  });

  it('keeps the owner out of a wishlist she removed', () => {
    const removed = removedWishlistOf('Alt');

    expect(() => moveWish(wishIn(removed), removed, christmas, anna)).toThrow(WishlistNotFound);
  });

  it.each([
    ['another wishlist', christmas],
    ['a wishlist of someone else', bens],
  ])('keeps the owner from moving a secret wish into %s', (_, target) => {
    const secret = wishIn(birthday, { secret: true, createdBy: ben });

    expect(() => moveWish(secret, birthday, target, anna)).toThrow(WishHiddenFromOwner);
  });
});
