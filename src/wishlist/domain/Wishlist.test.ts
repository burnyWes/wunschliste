import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import { Wish, type RestoredWish } from './Wish';
import {
  sortWishlists,
  Wishlist,
  WishlistNotFound,
  wishlistsVisibleTo,
  type RestoredWishlist,
} from './Wishlist';

function nameOf(raw: string): Name {
  return requireValid(Name.parse(raw));
}

const anna = personIdOf('anna');
const ben = personIdOf('ben');

const asAnna: Perspective = { me: anna, ownerId: anna, wishlistIsHidden: false };
const asBen: Perspective = { me: ben, ownerId: anna, wishlistIsHidden: false };

function wishlistNamed(raw: string, id = raw): Wishlist {
  return Wishlist.create(wishlistIdOf(id), nameOf(raw), anna);
}

function removedWishlist(state: Partial<RestoredWishlist> = {}): Wishlist {
  return Wishlist.restore({
    id: wishlistIdOf('removed'),
    name: nameOf('Ostern'),
    ownerId: anna,
    removedByOwner: true,
    ...state,
  });
}

function wishOf(state: Partial<RestoredWish>): Wish {
  return Wish.restore({
    id: wishIdOf('w'),
    wishlistId: wishlistIdOf('Geburtstag'),
    details: { name: nameOf('Helm') },
    createdBy: anna,
    secret: false,
    giverId: undefined,
    received: false,
    removedByOwner: false,
    ...state,
  });
}

describe('Wishlist', () => {
  it('carries its id, name and owner', () => {
    const wishlist = wishlistNamed('Geburtstag', 'id-1');

    expect(wishlist.id).toBe('id-1');
    expect(wishlist.name.value).toBe('Geburtstag');
    expect(wishlist.ownerId).toBe('anna');
  });

  it('is restored with its owner', () => {
    const restored = removedWishlist({ ownerId: ben });

    expect(restored.ownerId).toBe('ben');
    expect(restored.removedByOwner).toBe(true);
  });

  it('is created not removed', () => {
    expect(wishlistNamed('Geburtstag').removedByOwner).toBe(false);
  });

  it('is renamed into a new wishlist with the same id', () => {
    const wishlist = wishlistNamed('Geburtstag', 'id-1');

    const renamed = wishlist.rename(nameOf('Weihnachten'));

    expect(renamed.id).toBe('id-1');
    expect(renamed.name.value).toBe('Weihnachten');
    expect(wishlist.name.value).toBe('Geburtstag');
  });

  it('keeps its owner and removal when renamed', () => {
    const renamed = removedWishlist().rename(nameOf('Weihnachten'));

    expect(renamed.ownerId).toBe('anna');
    expect(renamed.removedByOwner).toBe(true);
  });
});

describe('Wishlist removed by its owner', () => {
  it('is hidden from the owner only', () => {
    expect(removedWishlist().isVisibleTo(asAnna)).toBe(false);
    expect(removedWishlist().isVisibleTo(asBen)).toBe(true);
    expect(wishlistNamed('Geburtstag').isVisibleTo(asAnna)).toBe(true);
  });

  it('is not found by the owner', () => {
    expect(() => removedWishlist().ensureVisibleTo(asAnna)).toThrow(WishlistNotFound);
    expect(() => removedWishlist().ensureVisibleTo(asBen)).not.toThrow();
  });
});

describe('Wishlist.removeFor', () => {
  const secret = wishOf({ secret: true, createdBy: ben });
  const gifted = wishOf({ giverId: ben });
  const open = wishOf({});
  const received = wishOf({ giverId: ben, received: true });

  it('hides a wishlist with secrets from the owner only', () => {
    for (const wishes of [[open, secret], [gifted]]) {
      const removal = wishlistNamed('Geburtstag').removeFor(asAnna, { wishes, confirmed: true });

      expect(removal.kind).toBe('hideFromOwner');
      expect(removal.kind === 'hideFromOwner' && removal.wishlist.removedByOwner).toBe(true);
    }
  });

  it('deletes a wishlist of the owner without secrets', () => {
    const removal = wishlistNamed('Geburtstag').removeFor(asAnna, {
      wishes: [open, received],
      confirmed: true,
    });

    expect(removal).toEqual({ kind: 'delete' });
  });

  it('hides the wishlist from the owner when the wishes are not confirmed', () => {
    const removal = wishlistNamed('Geburtstag').removeFor(asAnna, { wishes: [], confirmed: false });

    expect(removal.kind).toBe('hideFromOwner');
  });

  it('lets everyone else delete', () => {
    const removal = removedWishlist().removeFor(asBen, { wishes: [secret], confirmed: false });

    expect(removal).toEqual({ kind: 'delete' });
  });

  it('refuses the owner a wishlist hidden from her', () => {
    expect(() => removedWishlist().removeFor(asAnna, { wishes: [], confirmed: true })).toThrow(
      WishlistNotFound,
    );
  });
});

describe('wishlistsVisibleTo', () => {
  it('leaves out the wishlists removed by me', () => {
    const wishlists = [
      wishlistNamed('Geburtstag', 'a'),
      removedWishlist({ id: wishlistIdOf('b') }),
    ];

    expect(wishlistsVisibleTo(wishlists, anna).map(({ id }) => id)).toEqual(['a']);
    expect(wishlistsVisibleTo(wishlists, ben).map(({ id }) => id)).toEqual(['a', 'b']);
  });
});

describe('sortWishlists', () => {
  it('sorts alphabetically in German', () => {
    const sorted = sortWishlists(
      ['Weihnachten', 'ärger', 'Apfel'].map((name) => wishlistNamed(name)),
    );

    expect(sorted.map((wishlist) => wishlist.name.value)).toEqual([
      'Apfel',
      'ärger',
      'Weihnachten',
    ]);
  });

  it('orders equal names by id to stay stable', () => {
    const sorted = sortWishlists([wishlistNamed('Gleich', 'b'), wishlistNamed('Gleich', 'a')]);

    expect(sorted.map((wishlist) => wishlist.id)).toEqual(['a', 'b']);
  });
});
