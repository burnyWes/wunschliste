import { describe, expect, it } from 'vitest';
import { CalendarDate } from './CalendarDate';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import { Price } from './Price';
import {
  OwnerCannotKeepSecrets,
  Wish,
  WishActionNotAllowed,
  WishCannotBecomeSecret,
  WishHiddenFromOwner,
  type RestoredWish,
  type WishRemoval,
} from './Wish';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };

const createdOn = CalendarDate.of(2026, 10, 1);

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

const asAnna: Perspective = { me: anna, ownerId: anna, wishlistIsHidden: false };
const asBen: Perspective = { me: ben, ownerId: anna, wishlistIsHidden: false };
const asOma: Perspective = { me: oma, ownerId: anna, wishlistIsHidden: false };

function annasWish(state: Partial<RestoredWish> = {}): Wish {
  return Wish.restore({
    id: wishIdOf('w'),
    wishlistId: wishlistIdOf('l'),
    details: helmet,
    createdOn,
    createdBy: anna,
    secret: false,
    giverId: undefined,
    received: false,
    removedByOwner: false,
    ...state,
  });
}

describe('Wish', () => {
  it('is created open and not secret by me', () => {
    const wish = Wish.create(
      {
        id: wishIdOf('w'),
        wishlistId: wishlistIdOf('l'),
        details: helmet,
        secret: false,
        createdOn,
      },
      asBen,
    );

    expect(wish.createdBy).toBe(ben);
    expect(wish.createdOn).toBe(createdOn);
    expect(wish.secret).toBe(false);
    expect(wish.giverId).toBeUndefined();
    expect(wish.received).toBe(false);
    expect(wish.removedByOwner).toBe(false);
  });

  it('is created secret in the wishlist of someone else', () => {
    const wish = Wish.create(
      {
        id: wishIdOf('w'),
        wishlistId: wishlistIdOf('l'),
        details: helmet,
        secret: true,
        createdOn,
      },
      asBen,
    );

    expect(wish.secret).toBe(true);
  });

  it('cannot be created secret in my own wishlist', () => {
    expect(() =>
      Wish.create(
        {
          id: wishIdOf('w'),
          wishlistId: wishlistIdOf('l'),
          details: helmet,
          secret: true,
          createdOn,
        },
        asAnna,
      ),
    ).toThrow(OwnerCannotKeepSecrets);
  });

  it('is edited into a new wish that keeps everything but the details', () => {
    const wish = annasWish({ giverId: ben, received: true });
    const editedDetails = { ...helmet, price: requireValid(Price.ofCents(4999)) };

    const edited = wish.edit(editedDetails, false, asAnna);

    expect(edited.details).toBe(editedDetails);
    expect(edited.id).toBe('w');
    expect(edited.wishlistId).toBe('l');
    expect(edited.createdBy).toBe(anna);
    expect(edited.createdOn).toBe(createdOn);
    expect(edited.giverId).toBe(ben);
    expect(edited.received).toBe(true);
    expect(wish.details).toBe(helmet);
  });

  it('keeps the day it was created when gifted or hidden from the owner', () => {
    const gifted = annasWish().perform('gift', asBen);
    const removal = annasWish({ giverId: ben }).removeFor(asAnna);

    expect(gifted.createdOn).toBe(createdOn);
    expect(removal.kind === 'hideFromOwner' && removal.wish.createdOn).toBe(createdOn);
  });

  describe('edit of the secret', () => {
    const secret = annasWish({ secret: true, createdBy: ben });

    it('lets the secret be revealed', () => {
      expect(secret.edit(helmet, false, asBen).secret).toBe(false);
    });

    it('keeps a secret', () => {
      expect(secret.edit(helmet, true, asOma).secret).toBe(true);
    });

    it('never turns a normal wish into a secret', () => {
      expect(() => annasWish().edit(helmet, true, asBen)).toThrow(WishCannotBecomeSecret);
    });

    it('keeps the owner from editing a secret she cannot see', () => {
      expect(() => secret.edit(helmet, true, asAnna)).toThrow(WishHiddenFromOwner);
    });

    it('lets the owner edit a secret wish once it has been handed over', () => {
      const handedOver = annasWish({ secret: true, createdBy: ben, giverId: ben, received: true });

      expect(handedOver.edit(helmet, true, asAnna).details).toBe(helmet);
    });
  });

  describe('visibility', () => {
    it('is a surprise for the owner while secret and not received', () => {
      const secret = annasWish({ secret: true, createdBy: ben });

      expect(secret.isSurpriseFor(asAnna)).toBe(true);
      expect(secret.isHiddenFrom(asAnna)).toBe(true);
      expect(secret.isSurpriseFor(asOma)).toBe(false);
      expect(secret.isHiddenFrom(asOma)).toBe(false);
    });

    it('is no surprise once received', () => {
      const handedOver = annasWish({ secret: true, createdBy: ben, giverId: ben, received: true });

      expect(handedOver.isSurpriseFor(asAnna)).toBe(false);
    });

    it('is no surprise when not secret', () => {
      expect(annasWish({ giverId: ben }).isSurpriseFor(asAnna)).toBe(false);
    });
  });

  describe('keepsSecretFromOwner', () => {
    it.each([
      ['an open wish', {}, false],
      ['a gifted wish', { giverId: ben }, true],
      ['a received gift', { giverId: ben, received: true }, false],
      ['a secret wish', { secret: true, createdBy: ben }, true],
      ['a handed over secret wish', { secret: true, giverId: ben, received: true }, false],
      ['a wish received without giver', { received: true }, false],
    ] as const)('is %s: %s', (_, state, expected) => {
      expect(annasWish(state).keepsSecretFromOwner).toBe(expected);
    });
  });

  describe('removed by the owner', () => {
    const removed = annasWish({ giverId: ben, removedByOwner: true });

    it('is hidden from the owner', () => {
      expect(removed.isHiddenFrom(asAnna)).toBe(true);
      expect(removed.isSurpriseFor(asAnna)).toBe(false);
    });

    it('stays visible to everyone else', () => {
      expect(removed.isHiddenFrom(asOma)).toBe(false);
    });

    it('offers the owner no action', () => {
      expect(() => removed.perform('receive', asAnna)).toThrow(WishActionNotAllowed);
    });

    it('lets the giver still take the gift back', () => {
      expect(removed.perform('takeBackGift', asBen).giverId).toBeUndefined();
    });
  });

  it('is hidden from the owner when the wishlist is hidden from her', () => {
    const hiddenWishlist: Perspective = { ...asAnna, wishlistIsHidden: true };

    expect(annasWish().isHiddenFrom(hiddenWishlist)).toBe(true);
    expect(() => annasWish().edit(helmet, false, hiddenWishlist)).toThrow(WishHiddenFromOwner);
  });

  describe('removeFor', () => {
    function removalOf(state: Partial<RestoredWish>, perspective: Perspective): WishRemoval {
      return annasWish(state).removeFor(perspective);
    }

    it('hides a gift not yet received from the owner only', () => {
      const removal = removalOf({ giverId: ben }, asAnna);

      expect(removal.kind).toBe('hideFromOwner');
      expect(removal.kind === 'hideFromOwner' && removal.wish.removedByOwner).toBe(true);
    });

    it.each([
      ['an open wish', {}],
      ['a received gift', { giverId: ben, received: true }],
      ['a wish received without giver', { received: true }],
    ] as const)('deletes %s of the owner', (_, state) => {
      expect(removalOf(state, asAnna)).toEqual({ kind: 'delete' });
    });

    it.each([
      ['a gifted wish', { giverId: ben }],
      ['a secret wish', { secret: true, createdBy: ben }],
      ['a wish removed by the owner', { giverId: ben, removedByOwner: true }],
    ] as const)('lets everyone else delete %s', (_, state) => {
      expect(removalOf(state, asOma)).toEqual({ kind: 'delete' });
    });

    it('refuses a wish hidden from the owner', () => {
      expect(() => removalOf({ secret: true, createdBy: ben }, asAnna)).toThrow(
        WishHiddenFromOwner,
      );
      expect(() => removalOf({ giverId: ben, removedByOwner: true }, asAnna)).toThrow(
        WishHiddenFromOwner,
      );
    });
  });

  describe('perform', () => {
    it('gifts as me', () => {
      expect(annasWish().perform('gift', asBen).giverId).toBe(ben);
    });

    it('takes my gift back', () => {
      expect(annasWish({ giverId: ben }).perform('takeBackGift', asBen).giverId).toBeUndefined();
    });

    it('lets the owner receive a gifted wish', () => {
      const received = annasWish({ giverId: ben }).perform('receive', asAnna);

      expect(received.received).toBe(true);
      expect(received.giverId).toBe(ben);
    });

    it('lets the owner receive a wish without giver', () => {
      expect(annasWish().perform('receive', asAnna).received).toBe(true);
    });

    it('lets the owner undo receiving', () => {
      expect(annasWish({ received: true }).perform('undoReceive', asAnna).received).toBe(false);
    });

    it('lets the giver hand over a secret wish and undo it', () => {
      const secret = annasWish({ secret: true, createdBy: ben, giverId: ben });

      const handedOver = secret.perform('handOver', asBen);

      expect(handedOver.received).toBe(true);
      expect(handedOver.perform('undoHandOver', asBen).received).toBe(false);
    });

    it('lets the giver take back a secret gift', () => {
      const secret = annasWish({ secret: true, createdBy: ben, giverId: ben });

      expect(secret.perform('takeBackGift', asBen).giverId).toBeUndefined();
    });

    it.each([
      ['the owner cannot gift', annasWish(), 'gift', asAnna],
      ['Oma cannot take back the gift of Ben', annasWish({ giverId: ben }), 'takeBackGift', asOma],
      [
        'Ben cannot take back after receiving',
        annasWish({ giverId: ben, received: true }),
        'takeBackGift',
        asBen,
      ],
      ['a gifted wish cannot be gifted again', annasWish({ giverId: ben }), 'gift', asOma],
      ['someone else cannot receive', annasWish(), 'receive', asBen],
      [
        'the owner cannot receive a secret wish',
        annasWish({ secret: true, createdBy: ben, giverId: ben }),
        'receive',
        asAnna,
      ],
      ['a normal wish cannot be handed over', annasWish({ giverId: ben }), 'handOver', asBen],
    ] as const)('refuses when %s', (_, wish, action, perspective) => {
      expect(() => wish.perform(action, perspective)).toThrow(WishActionNotAllowed);
    });
  });
});
