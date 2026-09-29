import { describe, expect, it } from 'vitest';
import { personIdOf } from '../domain/ids';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { WishlistGroup } from '../domain/wishlistOverview';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { personNamed } from './fakes/personNamed';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';
import { WatchWishlistOverview } from './WatchWishlistOverview';

const anna = personIdOf('anna');
const ben = personIdOf('ben');

class UnansweredPersonRepository extends InMemoryPersonRepository {
  override watchAll(): Unsubscribe {
    return () => {};
  }
}

function headingsOf(groups: readonly WishlistGroup[]): (string | undefined)[] {
  return groups.map(({ owner }) => owner?.name.value);
}

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const persons = new InMemoryPersonRepository();
  await persons.save(personNamed('Anna'));
  await persons.save(personNamed('Ben'));
  await wishlists.save(wishlistNamed('Ostern', 'easter', ben));
  const reports: (string | undefined)[][] = [];
  let failures = 0;
  const watch = (watchedPersons: InMemoryPersonRepository = persons) =>
    new WatchWishlistOverview(wishlists, watchedPersons).execute(
      anna,
      (groups) => reports.push(headingsOf(groups)),
      () => (failures += 1),
    );
  return { wishlists, persons, reports, failures: () => failures, watch };
}

describe('WatchWishlistOverview', () => {
  it('reports the wishlists grouped by owner, me first', async () => {
    const { wishlists, reports, watch } = await setUp();
    await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));

    watch();

    expect(reports).toEqual([['Anna', 'Ben']]);
  });

  it('leaves out my wishlists removed by me', async () => {
    const { wishlists, reports, watch } = await setUp();
    await wishlists.save(removedWishlistNamed('Geburtstag', 'birthday', anna));

    watch();

    expect(reports).toEqual([['Ben']]);
  });

  it('reports again when the wishlists or the persons change', async () => {
    const { wishlists, persons, reports, watch } = await setUp();
    watch();

    await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
    await persons.delete(ben);

    expect(reports).toEqual([['Ben'], ['Anna', 'Ben'], ['Anna', undefined]]);
  });

  it('reports nothing before the persons are known', async () => {
    const { reports, watch } = await setUp();

    watch(new UnansweredPersonRepository());

    expect(reports).toEqual([]);
  });

  it('reports when the wishlists or the persons cannot be watched', async () => {
    const { wishlists, persons, failures, watch } = await setUp();
    watch();

    wishlists.failWatchers();
    persons.failWatchers();

    expect(failures()).toBe(2);
  });

  it('stops watching both when unsubscribed', async () => {
    const { wishlists, persons, reports, watch } = await setUp();
    const unsubscribe = watch();

    unsubscribe();
    await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
    await persons.delete(ben);

    expect(reports).toEqual([['Ben']]);
  });
});
