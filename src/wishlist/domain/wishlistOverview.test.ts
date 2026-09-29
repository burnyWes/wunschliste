import { describe, expect, it } from 'vitest';
import { personIdOf, wishlistIdOf, type PersonId } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Person } from './Person';
import { Wishlist } from './Wishlist';
import { groupWishlistsByOwner, type WishlistGroup } from './wishlistOverview';

const nameOf = (raw: string) => requireValid(Name.parse(raw));

const anna = Person.create(personIdOf('anna'), nameOf('Anna'));
const ben = Person.create(personIdOf('ben'), nameOf('Ben'));
const grandma = Person.create(personIdOf('grandma'), nameOf('Oma'));
const persons = [grandma, ben, anna];

function wishlistOf(ownerId: PersonId, name: string): Wishlist {
  return Wishlist.create(wishlistIdOf(`${ownerId}-${name}`), nameOf(name), ownerId);
}

function summaryOf(groups: readonly WishlistGroup[]) {
  return groups.map(({ owner, isMe, wishlists }) => ({
    owner: owner?.name.value,
    isMe,
    wishlists: wishlists.map((wishlist) => wishlist.name.value),
  }));
}

describe('groupWishlistsByOwner', () => {
  it('puts my group first and the others alphabetically', () => {
    const groups = groupWishlistsByOwner(
      [
        wishlistOf(anna.id, 'Ostern'),
        wishlistOf(grandma.id, 'Geburtstag'),
        wishlistOf(ben.id, 'Weihnachten'),
      ],
      persons,
      ben.id,
    );

    expect(summaryOf(groups)).toEqual([
      { owner: 'Ben', isMe: true, wishlists: ['Weihnachten'] },
      { owner: 'Anna', isMe: false, wishlists: ['Ostern'] },
      { owner: 'Oma', isMe: false, wishlists: ['Geburtstag'] },
    ]);
  });

  it('sorts the wishlists within a group by name', () => {
    const groups = groupWishlistsByOwner(
      [wishlistOf(anna.id, 'Weihnachten'), wishlistOf(anna.id, 'Ostern')],
      persons,
      anna.id,
    );

    expect(summaryOf(groups)).toEqual([
      { owner: 'Anna', isMe: true, wishlists: ['Ostern', 'Weihnachten'] },
    ]);
  });

  it('leaves out persons without wishlists', () => {
    const groups = groupWishlistsByOwner([wishlistOf(grandma.id, 'Ostern')], persons, anna.id);

    expect(summaryOf(groups).map(({ owner }) => owner)).toEqual(['Oma']);
  });

  it('puts wishlists of unknown owners into a last group without owner', () => {
    const groups = groupWishlistsByOwner(
      [
        wishlistOf(personIdOf('gone'), 'Zelten'),
        wishlistOf(personIdOf('lost'), 'Angeln'),
        wishlistOf(ben.id, 'Ostern'),
      ],
      persons,
      anna.id,
    );

    expect(summaryOf(groups)).toEqual([
      { owner: 'Ben', isMe: false, wishlists: ['Ostern'] },
      { owner: undefined, isMe: false, wishlists: ['Angeln', 'Zelten'] },
    ]);
  });

  it('leaves out my wishlists removed by me, but not those of others', () => {
    const removed = Wishlist.restore({
      id: wishlistIdOf('anna-Ostern'),
      name: nameOf('Ostern'),
      ownerId: anna.id,
      removedByOwner: true,
    });
    const wishlists = [removed, wishlistOf(ben.id, 'Weihnachten')];

    expect(summaryOf(groupWishlistsByOwner(wishlists, persons, anna.id))).toEqual([
      { owner: 'Ben', isMe: false, wishlists: ['Weihnachten'] },
    ]);
    expect(summaryOf(groupWishlistsByOwner(wishlists, persons, grandma.id))).toEqual([
      { owner: 'Anna', isMe: false, wishlists: ['Ostern'] },
      { owner: 'Ben', isMe: false, wishlists: ['Weihnachten'] },
    ]);
  });

  it('has no groups without wishlists', () => {
    expect(groupWishlistsByOwner([], persons, anna.id)).toEqual([]);
  });
});
