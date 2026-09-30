import { describe, expect, it } from 'vitest';
import { personIdOf, wishlistIdOf } from '../domain/ids';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { WishCounts } from '../domain/wishView';
import type { WishlistGroup } from '../domain/wishlistOverview';
import { InMemoryPersonRepository } from './fakes/InMemoryPersonRepository';
import { InMemoryWishlistRepository } from './fakes/InMemoryWishlistRepository';
import { InMemoryWishRepository } from './fakes/InMemoryWishRepository';
import { personNamed } from './fakes/personNamed';
import { removedWishlistNamed, wishlistNamed } from './fakes/wishlistNamed';
import { wishNamed } from './fakes/wishNamed';
import { WatchWishlistOverview } from './WatchWishlistOverview';

const anna = personIdOf('anna');
const ben = personIdOf('ben');

class UnansweredPersonRepository extends InMemoryPersonRepository {
  override watchAll(): Unsubscribe {
    return () => {};
  }
}

class UnansweredWishRepository extends InMemoryWishRepository {
  override watchAll(): Unsubscribe {
    return () => {};
  }
}

function wishCountsOf(groups: readonly WishlistGroup[]): WishCounts[] {
  return groups.flatMap(({ entries }) => entries.map(({ wishCounts }) => wishCounts));
}

function headingsOf(groups: readonly WishlistGroup[]): (string | undefined)[] {
  return groups.map(({ owner }) => owner?.name.value);
}

async function setUp() {
  const wishlists = new InMemoryWishlistRepository();
  const persons = new InMemoryPersonRepository();
  const wishes = new InMemoryWishRepository();
  await persons.save(personNamed('Anna'));
  await persons.save(personNamed('Ben'));
  await wishlists.save(wishlistNamed('Ostern', 'easter', ben));
  const reports: (string | undefined)[][] = [];
  const countReports: WishCounts[][] = [];
  let failures = 0;
  const watch = (
    watchedPersons: InMemoryPersonRepository = persons,
    watchedWishes: InMemoryWishRepository = wishes,
  ) =>
    new WatchWishlistOverview(wishlists, watchedPersons, watchedWishes).execute(
      anna,
      (groups) => {
        reports.push(headingsOf(groups));
        countReports.push(wishCountsOf(groups));
      },
      () => (failures += 1),
    );
  return { wishlists, persons, wishes, reports, countReports, failures: () => failures, watch };
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

  it('reports nothing before the wishes are known', async () => {
    const { reports, persons, watch } = await setUp();

    watch(persons, new UnansweredWishRepository());

    expect(reports).toEqual([]);
  });

  it('reports the counts again when a wish changes', async () => {
    const { wishes, countReports, watch } = await setUp();
    const easter = wishlistIdOf('easter');
    watch();

    await wishes.save(wishNamed('Buch', { wishlistId: easter, createdBy: ben }));
    await wishes.save(wishNamed('Buch', { wishlistId: easter, createdBy: ben, giverId: anna }));

    expect(countReports).toEqual([
      [{ open: 0, fulfilled: 0 }],
      [{ open: 1, fulfilled: 0 }],
      [{ open: 0, fulfilled: 1 }],
    ]);
  });

  it('reports when the wishlists, the persons or the wishes cannot be watched', async () => {
    const { wishlists, persons, wishes, failures, watch } = await setUp();
    watch();

    wishlists.failWatchers();
    persons.failWatchers();
    wishes.failWatchers();

    expect(failures()).toBe(3);
  });

  it('stops watching all three when unsubscribed', async () => {
    const { wishlists, persons, wishes, reports, watch } = await setUp();
    const unsubscribe = watch();

    unsubscribe();
    await wishlists.save(wishlistNamed('Geburtstag', 'birthday', anna));
    await persons.delete(ben);
    await wishes.save(wishNamed('Buch', { wishlistId: wishlistIdOf('easter'), createdBy: ben }));

    expect(reports).toEqual([['Ben']]);
  });
});
