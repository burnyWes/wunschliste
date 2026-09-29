export type WishlistProblem = 'writeRejected' | 'loadFailed';

export type ReportWishlistProblem = (problem: WishlistProblem) => void;
