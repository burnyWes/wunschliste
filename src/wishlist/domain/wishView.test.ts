import { CalendarDate } from './CalendarDate';
import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf, type PersonId } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Perspective } from './Perspective';
import type { Rating } from './Rating';
import { Wish, type RestoredWish } from './Wish';
import { countWishes, viewOfWish, viewOfWishes, visibleWishCount, type WishView } from './wishView';

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

function namesOf(views: readonly WishView[]): string[] {
  return views.map(({ wish }) => wish.details.name.value);
}

describe('viewOfWish', () => {
  it('shows an open wish with its actions', () => {
    const wish = annasWish('Helm');

    expect(viewOfWish(wish, asOma)).toEqual({
      wish,
      visibility: 'shown',
      listedUnder: ['open'],
      giverId: undefined,
      secretCreatorId: undefined,
      removedByOwner: false,
      primaryAction: 'gift',
      secondaryAction: undefined,
      repeatedGifts: undefined,
    });
  });

  it('keeps the gift of Ben from Anna', () => {
    const view = viewOfWish(annasWish('Helm', { giverId: ben }), asAnna);

    expect(view.listedUnder).toEqual(['open']);
    expect(view.giverId).toBeUndefined();
    expect(view.primaryAction).toBe('receive');
  });

  it('shows the gift of Ben to Oma as fulfilled by Ben', () => {
    const view = viewOfWish(annasWish('Helm', { giverId: ben }), asOma);

    expect(view.listedUnder).toEqual(['fulfilled']);
    expect(view.giverId).toBe(ben);
    expect(view.primaryAction).toBeUndefined();
  });

  it('shows Anna the giver once she has received the wish', () => {
    const view = viewOfWish(annasWish('Helm', { giverId: ben, received: true }), asAnna);

    expect(view.listedUnder).toEqual(['fulfilled']);
    expect(view.giverId).toBe(ben);
    expect(view.primaryAction).toBe('undoReceive');
  });

  it('shows a wish received without giver as fulfilled without giver', () => {
    const wish = annasWish('Helm', { received: true });

    expect(viewOfWish(wish, asAnna)).toMatchObject({
      listedUnder: ['fulfilled'],
      giverId: undefined,
    });
    expect(viewOfWish(wish, asBen)).toMatchObject({
      listedUnder: ['fulfilled'],
      giverId: undefined,
    });
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
      listedUnder: ['open'],
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
      listedUnder: ['fulfilled'],
      giverId: ben,
      secretCreatorId: undefined,
      removedByOwner: false,
      primaryAction: undefined,
      secondaryAction: undefined,
      repeatedGifts: undefined,
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
      listedUnder: ['fulfilled'],
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

describe('countWishes', () => {
  const wishes = [
    annasWish('A'),
    annasWish('B', { giverId: ben }),
    annasWish('C', { giverId: ben, received: true }),
  ];

  it('counts open and fulfilled wishes as the owner sees them', () => {
    expect(countWishes(wishes, asAnna)).toEqual({ open: 2, fulfilled: 1 });
  });

  it('counts a given wish as fulfilled for the others', () => {
    expect(countWishes(wishes, asBen)).toEqual({ open: 1, fulfilled: 2 });
  });

  it('leaves out surprises for the owner but counts them for the others', () => {
    const secret = [annasWish('Konzert', { secret: true, createdBy: ben })];

    expect(countWishes(secret, asAnna)).toEqual({ open: 0, fulfilled: 0 });
    expect(countWishes(secret, asBen)).toEqual({ open: 1, fulfilled: 0 });
  });

  it('leaves out wishes the owner removed only for the owner', () => {
    const removed = [
      annasWish('Helm', { removedByOwner: true, secret: true, createdBy: ben, giverId: ben }),
    ];

    expect(countWishes(removed, asAnna)).toEqual({ open: 0, fulfilled: 0 });
    expect(countWishes(removed, asBen)).toEqual({ open: 0, fulfilled: 1 });
  });

  it('counts nothing when the wishlist is hidden', () => {
    expect(countWishes(wishes, { ...asAnna, wishlistIsHidden: true })).toEqual({
      open: 0,
      fulfilled: 0,
    });
  });

  it('counts nothing without wishes', () => {
    expect(countWishes([], asAnna)).toEqual({ open: 0, fulfilled: 0 });
  });
});

describe('repeatable wishes', () => {
  const gifted = (...recordedBy: PersonId[]) =>
    annasWish('Schokolade', {
      repeatable: true,
      gifts: recordedBy.map((person) => ({ recordedBy: person })),
    });

  it('lists a repeatable wish without gifts only as open', () => {
    expect(viewOfWish(gifted(), asOma)).toMatchObject({
      listedUnder: ['open'],
      repeatedGifts: { count: 0, giverIds: [] },
    });
  });

  it.each([
    ['the owner', asAnna],
    ['everyone else', asOma],
  ] as const)('lists a gifted repeatable wish as open and fulfilled for %s', (_, perspective) => {
    expect(viewOfWish(gifted(ben), perspective).listedUnder).toEqual(['open', 'fulfilled']);
  });

  it('names every giver once in the order of the first gift, without the owner', () => {
    expect(viewOfWish(gifted(oma, anna, ben, oma), asAnna).repeatedGifts).toEqual({
      count: 4,
      giverIds: [oma, ben],
    });
  });

  it('shows the repeatable wish under both filters', () => {
    const wishes = [gifted(ben), annasWish('Helm')];

    expect(namesOf(viewOfWishes(wishes, asOma, 'open').entries)).toEqual(['Helm', 'Schokolade']);
    expect(namesOf(viewOfWishes(wishes, asOma, 'fulfilled').entries)).toEqual(['Schokolade']);
  });

  it('counts a gifted repeatable wish as open and as fulfilled', () => {
    expect(countWishes([gifted(ben), gifted(), annasWish('Helm')], asAnna)).toEqual({
      open: 3,
      fulfilled: 1,
    });
  });
});
