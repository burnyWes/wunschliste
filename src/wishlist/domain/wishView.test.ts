import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import type { Rating } from './Rating';
import { Wish, type RestoredWish } from './Wish';
import { viewOfWish, viewOfWishes, visibleWishCount, type WishView } from './wishView';

const anna = personIdOf('anna');
const ben = personIdOf('ben');
const oma = personIdOf('oma');

const asAnna: Perspective = { me: anna, ownerId: anna, wishlistIsHidden: false };
const asBen: Perspective = { me: ben, ownerId: anna, wishlistIsHidden: false };
const asOma: Perspective = { me: oma, ownerId: anna, wishlistIsHidden: false };

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

describe('viewOfWish for secret wishes', () => {
  const secret = annasWish('Konzert', { secret: true, createdBy: ben });

  it('shows the owner only a surprise', () => {
    const view = viewOfWish(secret, asAnna);

    expect(view.visibility).toBe('surprise');
    expect(view.secretCreatorId).toBeUndefined();
    expect(view.primaryAction).toBeUndefined();
  });

  it('names the creator to everyone else', () => {
    expect(viewOfWish(secret, asOma)).toMatchObject({
      visibility: 'shown',
      status: 'open',
      secretCreatorId: ben,
      primaryAction: 'gift',
    });
  });

  it('shows the owner the handed over wish as fulfilled by the giver without action', () => {
    const handedOver = annasWish('Konzert', {
      secret: true,
      createdBy: ben,
      giverId: ben,
      received: true,
    });

    expect(viewOfWish(handedOver, asAnna)).toEqual({
      wish: handedOver,
      visibility: 'shown',
      status: 'fulfilled',
      giverId: ben,
      secretCreatorId: undefined,
      removedByOwner: false,
      primaryAction: undefined,
      secondaryAction: undefined,
    });
  });
});

describe('viewOfWish for wishes removed by the owner', () => {
  const removed = annasWish('Helm', { giverId: ben, removedByOwner: true });

  it('hides the wish from the owner', () => {
    expect(viewOfWish(removed, asAnna)).toMatchObject({
      visibility: 'hidden',
      primaryAction: undefined,
    });
  });

  it('prefers hidden over surprise', () => {
    const removedSecret = annasWish('Helm', { secret: true, createdBy: ben, removedByOwner: true });

    expect(viewOfWish(removedSecret, asAnna).visibility).toBe('hidden');
  });

  it('shows everyone else the removal with the usual actions', () => {
    expect(viewOfWish(removed, asBen)).toMatchObject({
      visibility: 'shown',
      status: 'fulfilled',
      removedByOwner: true,
      primaryAction: 'takeBackGift',
    });
  });

  it('hides every wish of a wishlist hidden from the owner', () => {
    expect(viewOfWish(annasWish('Helm'), { ...asAnna, wishlistIsHidden: true }).visibility).toBe(
      'hidden',
    );
  });
});

describe('visibleWishCount', () => {
  const wishes = [
    annasWish('A'),
    annasWish('B', { giverId: ben, received: true }),
    annasWish('C', { secret: true, createdBy: ben }),
    annasWish('D', { giverId: ben, removedByOwner: true }),
  ];

  it('counts only the wishes the owner sees', () => {
    expect(visibleWishCount(wishes, asAnna)).toBe(2);
  });

  it('counts every wish for everyone else', () => {
    expect(visibleWishCount(wishes, asOma)).toBe(4);
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

  it('counts the surprises of the owner apart from the open wishes', () => {
    const withSecrets = [
      ...wishes,
      annasWish('E', { secret: true, createdBy: ben }),
      annasWish('F', { secret: true, createdBy: ben, giverId: ben }),
    ];

    const open = viewOfWishes(withSecrets, asAnna, 'open');

    expect(namesOf(open.entries)).toEqual(['A', 'C', 'D']);
    expect(open.surpriseCount).toBe(2);
    expect(viewOfWishes(withSecrets, asAnna, 'fulfilled').surpriseCount).toBe(0);
    expect(namesOf(viewOfWishes(withSecrets, asAnna, 'fulfilled').entries)).toEqual(['B']);
    expect(viewOfWishes(withSecrets, asOma, 'open').surpriseCount).toBe(0);
  });

  it('counts no surprises without secret wishes', () => {
    expect(viewOfWishes(wishes, asAnna, 'open').surpriseCount).toBe(0);
  });
});
