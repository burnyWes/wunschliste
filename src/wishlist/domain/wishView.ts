import type { PersonId } from './ids';
import { isOwner, type Perspective } from './Perspective';
import type { Wish } from './Wish';
import { allowedWishActions, type WishAction } from './wishActions';
import { sortWishes } from './wishOrder';

export type WishFilter = 'open' | 'fulfilled';

export type WishVisibility = 'shown' | 'surprise' | 'hidden';

export type WishView = {
  wish: Wish;
  visibility: WishVisibility;
  status: WishFilter;
  giverId?: PersonId;
  secretCreatorId?: PersonId;
  removedByOwner: boolean;
  primaryAction?: WishAction;
  secondaryAction?: WishAction;
};

export type WishesView = { entries: WishView[]; surpriseCount: number };

function isFulfilledFor(wish: Wish, perspective: Perspective): boolean {
  if (isOwner(perspective)) {
    return wish.received;
  }
  return wish.received || wish.giverId !== undefined;
}

function giverShownTo(wish: Wish, perspective: Perspective): PersonId | undefined {
  const isGiftStillSecret = isOwner(perspective) && !wish.received;
  return isGiftStillSecret ? undefined : wish.giverId;
}

function visibilityFor(wish: Wish, perspective: Perspective): WishVisibility {
  if (wish.isSurpriseFor(perspective)) {
    return 'surprise';
  }
  return wish.isHiddenFrom(perspective) ? 'hidden' : 'shown';
}

function secretCreatorShownTo(wish: Wish, perspective: Perspective): PersonId | undefined {
  return wish.secret && !isOwner(perspective) ? wish.createdBy : undefined;
}

export function viewOfWish(wish: Wish, perspective: Perspective): WishView {
  const { primary, secondary } = allowedWishActions(wish, perspective);
  return {
    wish,
    visibility: visibilityFor(wish, perspective),
    status: isFulfilledFor(wish, perspective) ? 'fulfilled' : 'open',
    giverId: giverShownTo(wish, perspective),
    secretCreatorId: secretCreatorShownTo(wish, perspective),
    removedByOwner: wish.removedByOwner,
    primaryAction: primary,
    secondaryAction: secondary,
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
    entries: views.filter(({ visibility, status }) => visibility === 'shown' && status === filter),
    surpriseCount,
  };
}
