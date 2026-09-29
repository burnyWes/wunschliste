import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import { Price } from './Price';
import { Wish, WishActionNotAllowed, type RestoredWish } from './Wish';

const helmet = { name: requireValid(Name.parse('Fahrradhelm')) };

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

const asAnna: Perspective = { me: anna, ownerId: anna };
const asBen: Perspective = { me: ben, ownerId: anna };
const asOma: Perspective = { me: oma, ownerId: anna };

function annasWish(state: Partial<RestoredWish> = {}): Wish {
  return Wish.restore({
    id: wishIdOf('w'),
    wishlistId: wishlistIdOf('l'),
    details: helmet,
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
      { id: wishIdOf('w'), wishlistId: wishlistIdOf('l'), details: helmet },
      asBen,
    );

    expect(wish.createdBy).toBe(ben);
    expect(wish.secret).toBe(false);
    expect(wish.giverId).toBeUndefined();
    expect(wish.received).toBe(false);
    expect(wish.removedByOwner).toBe(false);
  });

  it('is edited into a new wish that keeps everything but the details', () => {
    const wish = annasWish({ giverId: ben, received: true });
    const editedDetails = { ...helmet, price: requireValid(Price.ofCents(4999)) };

    const edited = wish.edit(editedDetails);

    expect(edited.details).toBe(editedDetails);
    expect(edited.id).toBe('w');
    expect(edited.wishlistId).toBe('l');
    expect(edited.createdBy).toBe(anna);
    expect(edited.giverId).toBe(ben);
    expect(edited.received).toBe(true);
    expect(wish.details).toBe(helmet);
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
