import { describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import type { Rating } from './Rating';
import { Wish } from './Wish';
import { sortWishes } from './wishOrder';

function wish(name: string, rating?: Rating, id = name): Wish {
  return Wish.create(
    {
      id: wishIdOf(id),
      wishlistId: wishlistIdOf('l'),
      details: { name: requireValid(Name.parse(name)), rating },
      secret: false,
    },
    { me: personIdOf('anna'), ownerId: personIdOf('anna'), wishlistIsHidden: false },
  );
}

function namesOf(wishes: readonly Wish[]): string[] {
  return wishes.map(({ details }) => details.name.value);
}

describe('sortWishes', () => {
  it('puts essential before wanted before nice before unrated', () => {
    const sorted = sortWishes([
      wish('A', undefined),
      wish('B', 'nice'),
      wish('C', 'essential'),
      wish('D', 'wanted'),
    ]);

    expect(namesOf(sorted)).toEqual(['C', 'D', 'B', 'A']);
  });

  it('sorts alphabetically in German within one rating', () => {
    const sorted = sortWishes([
      wish('Zelt', 'wanted'),
      wish('Ärmel', 'wanted'),
      wish('Buch', 'wanted'),
    ]);

    expect(namesOf(sorted)).toEqual(['Ärmel', 'Buch', 'Zelt']);
  });

  it('orders equal names by id', () => {
    const sorted = sortWishes([wish('Buch', undefined, 'b'), wish('Buch', undefined, 'a')]);

    expect(sorted.map(({ id }) => id)).toEqual(['a', 'b']);
  });
});
