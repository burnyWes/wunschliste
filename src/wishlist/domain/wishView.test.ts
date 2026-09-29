import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import type { Rating } from './Rating';
import { Wish, type RestoredWish } from './Wish';
import { viewOfWish, viewOfWishes, type WishView } from './wishView';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

const asAnna: Perspective = { me: anna, ownerId: anna };
const asBen: Perspective = { me: ben, ownerId: anna };
const asOma: Perspective = { me: oma, ownerId: anna };

function annasWish(name: string, state: Partial<RestoredWish> = {}, rating?: Rating): Wish {
  return Wish.restore({
    id: wishIdOf(name),
    wishlistId: wishlistIdOf('birthday'),
    details: { name: requireValid(Name.parse(name)), rating },
    createdBy: anna,
    secret: false,
    giverId: undefined,
    received: false,
    removedByOwner: false,
    ...state,
  });
}

function namesOf(views: readonly WishView[]): string[] {
  return views.map(({ wish }) => wish.details.name.value);
}

describe('viewOfWish', () => {
  it('shows an open wish with its actions', () => {
    const wish = annasWish('Helm');

    expect(viewOfWish(wish, asOma)).toEqual({
      wish,
      visibility: 'shown',
      status: 'open',
      giverId: undefined,
      secretCreatorId: undefined,
      removedByOwner: false,
      primaryAction: 'gift',
      secondaryAction: undefined,
    });
  });

  it('keeps the gift of Ben from Anna', () => {
    const view = viewOfWish(annasWish('Helm', { giverId: ben }), asAnna);

    expect(view.status).toBe('open');
    expect(view.giverId).toBeUndefined();
    expect(view.primaryAction).toBe('receive');
  });

  it('shows the gift of Ben to Oma as fulfilled by Ben', () => {
    const view = viewOfWish(annasWish('Helm', { giverId: ben }), asOma);

    expect(view.status).toBe('fulfilled');
    expect(view.giverId).toBe(ben);
    expect(view.primaryAction).toBeUndefined();
  });

  it('shows Anna the giver once she has received the wish', () => {
    const view = viewOfWish(annasWish('Helm', { giverId: ben, received: true }), asAnna);

    expect(view.status).toBe('fulfilled');
    expect(view.giverId).toBe(ben);
    expect(view.primaryAction).toBe('undoReceive');
  });

  it('shows a wish received without giver as fulfilled without giver', () => {
    const wish = annasWish('Helm', { received: true });

    expect(viewOfWish(wish, asAnna)).toMatchObject({ status: 'fulfilled', giverId: undefined });
    expect(viewOfWish(wish, asBen)).toMatchObject({ status: 'fulfilled', giverId: undefined });
  });
});

describe('viewOfWishes', () => {
  const wishes = [
    annasWish('D', { giverId: ben }),
    annasWish('C'),
    annasWish('B', { received: true }, 'wanted'),
    annasWish('A', {}, 'essential'),
  ];

  it('keeps the open wishes sorted', () => {
    expect(namesOf(viewOfWishes(wishes, asOma, 'open').entries)).toEqual(['A', 'C']);
  });

  it('keeps the fulfilled wishes sorted', () => {
    expect(namesOf(viewOfWishes(wishes, asOma, 'fulfilled').entries)).toEqual(['B', 'D']);
  });

  it('keeps a gifted wish open for the owner', () => {
    expect(namesOf(viewOfWishes(wishes, asAnna, 'open').entries)).toEqual(['A', 'C', 'D']);
  });

  it('counts no surprises without secret wishes', () => {
    expect(viewOfWishes(wishes, asAnna, 'open').surpriseCount).toBe(0);
  });
});
