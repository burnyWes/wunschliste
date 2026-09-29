import { isOwner, type Perspective } from './Perspective';
import type { Wish } from './Wish';

export type WishAction =
  'gift' | 'takeBackGift' | 'receive' | 'undoReceive' | 'handOver' | 'undoHandOver';

export type AllowedWishActions = { primary?: WishAction; secondary?: WishAction };

function allowedForOwner(wish: Wish): AllowedWishActions {
  if (wish.secret) {
    return {};
  }
  return { primary: wish.received ? 'undoReceive' : 'receive' };
}

function allowedForGiver(wish: Wish): AllowedWishActions {
  if (!wish.secret) {
    return wish.received ? {} : { primary: 'takeBackGift' };
  }
  return wish.received
    ? { primary: 'undoHandOver' }
    : { primary: 'handOver', secondary: 'takeBackGift' };
}

export function allowedWishActions(wish: Wish, perspective: Perspective): AllowedWishActions {
  if (wish.isHiddenFrom(perspective)) {
    return {};
  }
  if (isOwner(perspective)) {
    return allowedForOwner(wish);
  }
  if (wish.giverId === perspective.me) {
    return allowedForGiver(wish);
  }
  const isUntouched = wish.giverId === undefined && !wish.received;
  return isUntouched ? { primary: 'gift' } : {};
}
