import { describe, expect, it } from 'vitest';
import { personIdOf, wishlistIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Person } from './Person';
import {
  ensureNameIsFree,
  ensurePersonIsDeletable,
  PersonNameTaken,
  PersonOwnsWishlists,
} from './personRules';
import { Wishlist } from './Wishlist';

function nameOf(raw: string): Name {
  return requireValid(Name.parse(raw));
}

const anna = Person.create(personIdOf('anna'), nameOf('Anna'));
const ben = Person.create(personIdOf('ben'), nameOf('Ben'));
const persons = [anna, ben];

describe('ensureNameIsFree', () => {
  it('accepts a name nobody has', () => {
    expect(() => ensureNameIsFree(nameOf('Oma'), persons)).not.toThrow();
  });

  it('rejects a name that differs only in case', () => {
    expect(() => ensureNameIsFree(nameOf('ben'), persons)).toThrow(PersonNameTaken);
  });

  it('treats a name with an accent as another name', () => {
    expect(() => ensureNameIsFree(nameOf('Bén'), persons)).not.toThrow();
  });

  it('lets a person keep its own name in another spelling', () => {
    expect(() => ensureNameIsFree(nameOf('BEN'), persons, ben.id)).not.toThrow();
  });

  it('rejects the name of another person when renaming', () => {
    expect(() => ensureNameIsFree(nameOf('Anna'), persons, ben.id)).toThrow(PersonNameTaken);
  });
});

describe('ensurePersonIsDeletable', () => {
  it('accepts a person without wishlists', () => {
    expect(() => ensurePersonIsDeletable(ben.id, [])).not.toThrow();
  });

  it('rejects a person who still owns wishlists and counts them', () => {
    const owned = ['Ostern', 'Weihnachten'].map((name) =>
      Wishlist.create(wishlistIdOf(name), nameOf(name), ben.id),
    );

    expect(() => ensurePersonIsDeletable(ben.id, owned)).toThrow(
      expect.objectContaining({ name: 'PersonOwnsWishlists', wishlistCount: 2 }),
    );
    expect(() => ensurePersonIsDeletable(ben.id, owned)).toThrow(PersonOwnsWishlists);
  });
});
