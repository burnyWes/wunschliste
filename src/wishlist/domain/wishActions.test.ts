import { CalendarDate } from './CalendarDate';
import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf, type PersonId } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import { Wish, type RestoredWish } from './Wish';
import { allowedWishActions } from './wishActions';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

const asAnna: Perspective = { me: anna, ownerId: anna, wishlistIsHidden: false };
const asBen: Perspective = { me: ben, ownerId: anna, wishlistIsHidden: false };
const asOma: Perspective = { me: oma, ownerId: anna, wishlistIsHidden: false };

function annasWish(state: Partial<RestoredWish> = {}): Wish {
  return Wish.restore({
    id: wishIdOf('helmet'),
    wishlistId: wishlistIdOf('birthday'),
    details: { name: requireValid(Name.parse('Fahrradhelm')) },
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

describe('allowedWishActions', () => {
  it.each([
    ['the owner, an open wish', asAnna, {}, { primary: 'receive' }],
    ['the owner, a wish gifted by Ben', asAnna, { giverId: ben }, { primary: 'receive' }],
    ['the owner, a received wish', asAnna, { received: true }, { primary: 'undoReceive' }],
    ['the owner, a secret wish', asAnna, { secret: true, createdBy: ben, giverId: ben }, {}],
    [
      'the owner, a handed over secret wish',
      asAnna,
      { secret: true, createdBy: ben, giverId: ben, received: true },
      {},
    ],
    ['someone else, an open wish', asBen, {}, { primary: 'gift' }],
    ['the giver, a gifted wish', asBen, { giverId: ben }, { primary: 'takeBackGift' }],
    ['the giver, a received wish', asBen, { giverId: ben, received: true }, {}],
    [
      'the giver, a secret wish',
      asBen,
      { secret: true, createdBy: ben, giverId: ben },
      { primary: 'handOver', secondary: 'takeBackGift' },
    ],
    [
      'the giver, a handed over secret wish',
      asBen,
      { secret: true, createdBy: ben, giverId: ben, received: true },
      { primary: 'undoHandOver' },
    ],
    ['someone else, a wish gifted by Ben', asOma, { giverId: ben }, {}],
    ['someone else, a secret wish gifted by Ben', asOma, { secret: true, giverId: ben }, {}],
    ['someone else, a wish received without giver', asOma, { received: true }, {}],
    [
      'someone else, an open secret wish',
      asOma,
      { secret: true, createdBy: ben },
      { primary: 'gift' },
    ],
  ] as const)('offers %s', (_, perspective, state, expected) => {
    expect(allowedWishActions(annasWish(state), perspective)).toEqual(expected);
  });

  describe('for a repeatable wish', () => {
    const repeatable = (recordedBy: readonly PersonId[] = []) =>
      annasWish({ repeatable: true, gifts: recordedBy.map((person) => ({ recordedBy: person })) });

    it('lets everyone else gift it again and again', () => {
      expect(allowedWishActions(repeatable(), asBen)).toEqual({ primary: 'gift' });
      expect(allowedWishActions(repeatable([oma]), asBen)).toEqual({ primary: 'gift' });
    });

    it('lets a giver take back an own gift among the gifts of others', () => {
      expect(allowedWishActions(repeatable([oma, ben, oma]), asBen)).toEqual({
        primary: 'gift',
        secondary: 'takeBackGift',
      });
    });

    it('lets the owner receive it again and again', () => {
      expect(allowedWishActions(repeatable([ben]), asAnna)).toEqual({ primary: 'receive' });
    });

    it('lets the owner undo her own receipt', () => {
      expect(allowedWishActions(repeatable([ben, anna]), asAnna)).toEqual({
        primary: 'receive',
        secondary: 'undoReceive',
      });
    });

    it('offers nothing in a wishlist hidden from the owner', () => {
      expect(allowedWishActions(repeatable(), { ...asAnna, wishlistIsHidden: true })).toEqual({});
    });

    it('offers the owner nothing once she removed it', () => {
      const removed = annasWish({ repeatable: true, removedByOwner: true });

      expect(allowedWishActions(removed, asAnna)).toEqual({});
    });
  });
});
