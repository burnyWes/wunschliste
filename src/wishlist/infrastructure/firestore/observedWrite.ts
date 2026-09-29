import type { ReportWishlistProblem } from '../wishlistProblem';

export function observedWrite(write: Promise<void>, onProblem: ReportWishlistProblem): void {
  write.catch(() => onProblem('writeRejected'));
}
