import type { PersonId } from './ids';
import { isOwner, type Perspective } from './Perspective';
import type { Wish } from './Wish';
import { allowedWishActions, type WishAction } from './wishActions';
import { sortWishes } from './wishOrder';

export type WishFilter = 'open' | 'fulfilled';

export type WishVisibility = 'shown' | 'surprise' | 'hidden';

export type RepeatedGiftsView = { count: number; giverIds: readonly PersonId[] };

export type WishView = {
  wish: Wish;
  visibility: WishVisibility;
  listedUnder: readonly WishFilter[];
  giverId?: PersonId;
  secretCreatorId?: PersonId;
  removedByOwner: boolean;
  primaryAction?: WishAction;
  secondaryAction?: WishAction;
  repeatedGifts?: RepeatedGiftsView;
};

export type WishesView = { entries: WishView[]; surpriseCount: number };

function isFulfilledFor(wish: Wish, perspective: Perspective): boolean {
  if (isOwner(perspective)) {
    return wish.received;
  }
  return wish.received || wish.giverId !== undefined;
}

function listedUnderFor(wish: Wish, perspective: Perspective): readonly WishFilter[] {
  if (wish.repeatable) {
    return wish.gifts.length > 0 ? ['open', 'fulfilled'] : ['open'];
  }
  return [isFulfilledFor(wish, perspective) ? 'fulfilled' : 'open'];
}

function repeatedGiftsOf(wish: Wish, perspective: Perspective): RepeatedGiftsView | undefined {
  if (!wish.repeatable) {
    return undefined;
  }
  const giverIds = wish.gifts
    .map(({ recordedBy }) => recordedBy)
    .filter((personId) => personId !== perspective.ownerId);
  return { count: wish.gifts.length, giverIds: [...new Set(giverIds)] };
}

function giverShownTo(wish: Wish, perspective: Perspective): PersonId | undefined {
  const isGiftStillSecret = isOwner(perspective) && !wish.received;
  return isGiftStillSecret ? undefined : wish.giverId;
}

function visibilityFor(wish: Wish, perspective: Perspective): WishVisibility {
  if (wish.isRemovedFor(perspective)) {
    return 'hidden';
  }
  return wish.isSurpriseFor(perspective) ? 'surprise' : 'shown';
}

function secretCreatorShownTo(wish: Wish, perspective: Perspective): PersonId | undefined {
  return wish.secret && !isOwner(perspective) ? wish.createdBy : undefined;
}

export function viewOfWish(wish: Wish, perspective: Perspective): WishView {
  const { primary, secondary } = allowedWishActions(wish, perspective);
  return {
    wish,
    visibility: visibilityFor(wish, perspective),
    listedUnder: listedUnderFor(wish, perspective),
    giverId: giverShownTo(wish, perspective),
    secretCreatorId: secretCreatorShownTo(wish, perspective),
    removedByOwner: wish.removedByOwner,
    primaryAction: primary,
    secondaryAction: secondary,
    repeatedGifts: repeatedGiftsOf(wish, perspective),
  };
}

export function viewOfWishes(
  wishes: readonly Wish[],
  perspective: Perspective,
  filter: WishFilter,
): WishesView {
  const views = sortWishes(wishes).map((wish) => viewOfWish(wish, perspective));
  const surpriseCount =
    filter === 'open' ? views.filter(({ visibility }) => visibility === 'surprise').length : 0;
  return {
    entries: views.filter(
      ({ visibility, listedUnder }) => visibility === 'shown' && listedUnder.includes(filter),
    ),
    surpriseCount,
  };
}

export function visibleWishCount(wishes: readonly Wish[], perspective: Perspective): number {
  return wishes.filter((wish) => visibilityFor(wish, perspective) === 'shown').length;
}

export type WishCounts = { readonly open: number; readonly fulfilled: number };

export function countWishes(wishes: readonly Wish[], perspective: Perspective): WishCounts {
  const shownListings = wishes
    .map((wish) => viewOfWish(wish, perspective))
    .filter(({ visibility }) => visibility === 'shown')
    .map(({ listedUnder }) => listedUnder);
  const countListedUnder = (filter: WishFilter) =>
    shownListings.filter((listedUnder) => listedUnder.includes(filter)).length;
  return { open: countListedUnder('open'), fulfilled: countListedUnder('fulfilled') };
}
