import { LOAD_FAILED_MESSAGE } from '../wishlist/infrastructure/ui/wishTexts';
import type { WishlistProblem } from '../wishlist/infrastructure/wishlistProblem';

const PROBLEM_TEXTS: Readonly<Record<WishlistProblem, string>> = {
  writeRejected: 'Eine Änderung konnte nicht gespeichert werden.',
  loadFailed: LOAD_FAILED_MESSAGE,
};

export function problemText(problem: WishlistProblem): string {
  return PROBLEM_TEXTS[problem];
}
