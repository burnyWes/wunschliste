import { compareIds } from './compareIds';
import { RATINGS } from './Rating';
import type { Wish } from './Wish';

export type WishFilter = 'open' | 'fulfilled';

function rankOf(wish: Wish): number {
  const { rating } = wish.details;
  return rating === undefined ? RATINGS.length : RATINGS.indexOf(rating);
}

export function sortWishes(wishes: readonly Wish[]): Wish[] {
  return [...wishes].sort(
    (first, second) =>
      rankOf(first) - rankOf(second) ||
      first.details.name.value.localeCompare(second.details.name.value, 'de') ||
      compareIds(first.id, second.id),
  );
}

export function wishesMatching(wishes: readonly Wish[], filter: WishFilter): Wish[] {
  const shouldBeOpen = filter === 'open';
  return wishes.filter((wish) => wish.isOpen === shouldBeOpen);
}
