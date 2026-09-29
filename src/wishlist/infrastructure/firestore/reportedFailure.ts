import type { ReportWishlistProblem } from '../wishlistProblem';

export function reportedFailure(
  onFailure: () => void,
  onProblem: ReportWishlistProblem,
): () => void {
  return () => {
    onFailure();
    onProblem('loadFailed');
  };
}
