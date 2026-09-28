export type Rating = 'essential' | 'wanted' | 'nice';

export const RATINGS: readonly Rating[] = ['essential', 'wanted', 'nice'];

export function isRating(candidate: unknown): candidate is Rating {
  return RATINGS.some((rating) => rating === candidate);
}
