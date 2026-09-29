import { describe, expect, it } from 'vitest';
import type { WishlistProblem } from '../wishlist/infrastructure/wishlistProblem';
import { problemText } from './problemTexts';

describe('problemText', () => {
  it.each<[WishlistProblem, string]>([
    ['writeRejected', 'Eine Änderung konnte nicht gespeichert werden.'],
    ['loadFailed', 'Die Daten konnten nicht geladen werden.'],
  ])('explains %s in German', (problem, text) => {
    expect(problemText(problem)).toBe(text);
  });
});
