import { describe, expect, it } from 'vitest';
import { CalendarDate } from './CalendarDate';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import { Price } from './Price';
import {
  canChangeRepeatability,
  OwnerCannotKeepSecrets,
  RepeatabilityLocked,
  Wish,
  WishCannotBeSecretAndRepeatable,
  WishActionNotAllowed,
  WishCannotBecomeSecret,
  WishHiddenFromOwner,
  type RestoredWish,
  type WishRemoval,
  type WishTraits,
} from './Wish';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };

const plainTraits: WishTraits = { secret: false, repeatable: false };
const secretTraits: WishTraits = { secret: true, repeatable: false };
const repeatableTraits: WishTraits = { secret: false, repeatable: true };

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
    repeatable: false,
    gifts: [],
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
        traits: plainTraits,
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
        traits: secretTraits,
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
          traits: secretTraits,
          createdOn,
        },
        asAnna,
      ),
    ).toThrow(OwnerCannotKeepSecrets);
  });

  it('is edited into a new wish that keeps everything but the details', () => {
    const wish = annasWish({ giverId: ben, received: true });
    const editedDetails = { ...helmet, price: requireValid(Price.ofCents(4999)) };

    const edited = wish.edit(editedDetails, plainTraits, asAnna);

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
      expect(secret.edit(helmet, plainTraits, asBen).secret).toBe(false);
    });

    it('keeps a secret', () => {
      expect(secret.edit(helmet, secretTraits, asOma).secret).toBe(true);
    });

    it('never turns a normal wish into a secret', () => {
      expect(() => annasWish().edit(helmet, secretTraits, asBen)).toThrow(WishCannotBecomeSecret);
    });

    it('keeps the owner from editing a secret she cannot see', () => {
      expect(() => secret.edit(helmet, secretTraits, asAnna)).toThrow(WishHiddenFromOwner);
    });

    it('lets the owner edit a secret wish once it has been handed over', () => {
      const handedOver = annasWish({ secret: true, createdBy: ben, giverId: ben, received: true });

      expect(handedOver.edit(helmet, secretTraits, asAnna).details).toBe(helmet);
    });
  });

  describe('repeatability', () => {
    function newWish(traits: WishTraits, perspective: Perspective): Wish {
      return Wish.create(
        { id: wishIdOf('w'), wishlistId: wishlistIdOf('l'), details: helmet, traits, createdOn },
        perspective,
      );
    }

    it('is created repeatable without gifts', () => {
      const wish = newWish(repeatableTraits, asAnna);

      expect(wish.repeatable).toBe(true);
      expect(wish.gifts).toEqual([]);
    });

    it('is created not repeatable by default traits', () => {
      expect(newWish(plainTraits, asAnna).repeatable).toBe(false);
    });

    it('cannot be created secret and repeatable', () => {
      expect(() => newWish({ secret: true, repeatable: true }, asBen)).toThrow(
        WishCannotBeSecretAndRepeatable,
      );
    });

    it('turns an untouched wish repeatable and back', () => {
      const repeatable = annasWish().edit(helmet, repeatableTraits, asAnna);

      expect(repeatable.repeatable).toBe(true);
      expect(repeatable.edit(helmet, plainTraits, asAnna).repeatable).toBe(false);
    });

    it('cannot be edited secret and repeatable', () => {
      const secret = annasWish({ secret: true, createdBy: ben });

      expect(() => secret.edit(helmet, { secret: true, repeatable: true }, asBen)).toThrow(
        WishCannotBeSecretAndRepeatable,
      );
    });

    it.each([
      ['a gifted wish', { giverId: ben }],
      ['a received wish', { received: true }],
    ] as const)('cannot turn %s repeatable', (_, state) => {
      expect(() => annasWish(state).edit(helmet, repeatableTraits, asAnna)).toThrow(
        RepeatabilityLocked,
      );
    });

    it('cannot turn a repeatable wish with gifts back', () => {
      const gifted = annasWish({ repeatable: true, gifts: [{ recordedBy: ben }] });

      expect(() => gifted.edit(helmet, plainTraits, asAnna)).toThrow(RepeatabilityLocked);
      expect(gifted.edit(helmet, repeatableTraits, asAnna).gifts).toEqual([{ recordedBy: ben }]);
    });

    it.each([
      ['an untouched wish', {}, true],
      ['a gifted wish', { giverId: ben }, false],
      ['a received wish', { received: true }, false],
      ['a repeatable wish with a gift', { repeatable: true, gifts: [{ recordedBy: ben }] }, false],
      ['a repeatable wish without gifts', { repeatable: true }, true],
    ] as const)('decides whether %s can change its repeatability', (_, state, expected) => {
      expect(canChangeRepeatability(annasWish(state))).toBe(expected);
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
    expect(() => annasWish().edit(helmet, plainTraits, hiddenWishlist)).toThrow(
      WishHiddenFromOwner,
    );
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

  describe('perform on a repeatable wish', () => {
    const giftsOf = (wish: Wish) => wish.gifts.map(({ recordedBy }) => recordedBy);

    it('records every gift, even twice by the same person', () => {
      const gifted = annasWish({ repeatable: true })
        .perform('gift', asBen)
        .perform('gift', asOma)
        .perform('gift', asBen);

      expect(giftsOf(gifted)).toEqual([ben, oma, ben]);
      expect(gifted.giverId).toBeUndefined();
      expect(gifted.received).toBe(false);
    });

    it('records a receipt of the owner', () => {
      const received = annasWish({ repeatable: true }).perform('receive', asAnna);

      expect(giftsOf(received)).toEqual([anna]);
      expect(received.received).toBe(false);
    });

    it('takes back only my latest gift', () => {
      const gifted = annasWish({
        repeatable: true,
        gifts: [{ recordedBy: ben }, { recordedBy: oma }, { recordedBy: ben }],
      });

      expect(giftsOf(gifted.perform('takeBackGift', asBen))).toEqual([ben, oma]);
    });

    it('lets the owner undo only her latest receipt', () => {
      const received = annasWish({
        repeatable: true,
        gifts: [{ recordedBy: anna }, { recordedBy: ben }],
      });

      expect(giftsOf(received.perform('undoReceive', asAnna))).toEqual([ben]);
    });

    it.each([
      ['a repeatable wish cannot be handed over', 'handOver', asBen],
      ['Oma cannot take back a gift she never made', 'takeBackGift', asOma],
    ] as const)('refuses when %s', (_, action, perspective) => {
      const gifted = annasWish({ repeatable: true, gifts: [{ recordedBy: ben }] });

      expect(() => gifted.perform(action, perspective)).toThrow(WishActionNotAllowed);
    });

    it('knows who recorded a gift', () => {
      const gifted = annasWish({ repeatable: true, gifts: [{ recordedBy: ben }] });

      expect(gifted.hasGiftRecordedBy(ben)).toBe(true);
      expect(gifted.hasGiftRecordedBy(oma)).toBe(false);
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
