import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import { Wish, type RestoredWish } from './Wish';
import { allowedWishActions } from './wishActions';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

const asAnna: Perspective = { me: anna, ownerId: anna };
const asBen: Perspective = { me: ben, ownerId: anna };
const asOma: Perspective = { me: oma, ownerId: anna };

function annasWish(state: Partial<RestoredWish> = {}): Wish {
  return Wish.restore({
    id: wishIdOf('helmet'),
    wishlistId: wishlistIdOf('birthday'),
    details: { name: requireValid(Name.parse('Fahrradhelm')) },
    createdBy: anna,
    secret: false,
    giverId: undefined,
    received: false,
    removedByOwner: false,
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
});
