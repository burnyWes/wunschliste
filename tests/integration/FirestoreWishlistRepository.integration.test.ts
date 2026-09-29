import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { disableNetwork, doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { personIdOf, wishlistIdOf, type PersonId } from '../../src/wishlist/domain/ids';
import { Name } from '../../src/wishlist/domain/Name';
import { requireValid } from '../../src/wishlist/domain/parsed';
import { Wishlist } from '../../src/wishlist/domain/Wishlist';
import {
  FirestoreWishlistRepository,
  WISHLISTS_COLLECTION,
} from '../../src/wishlist/infrastructure/firestore/FirestoreWishlistRepository';
import type { WishlistProblem } from '../../src/wishlist/infrastructure/wishlistProblem';
import { eventually } from './eventually';
import {
  asModularFirestore,
  familyFirestore,
  ignoreFailure,
  startTestEnvironment,
  withoutRules,
} from './testFirestore';

const anna = personIdOf('anna');
const ben = personIdOf('ben');

function wishlistNamed(name: string, id = name, ownerId: PersonId = anna): Wishlist {
  return Wishlist.create(wishlistIdOf(id), requireValid(Name.parse(name)), ownerId);
}

function namesOf(wishlists: readonly Wishlist[]): string[] {
  return wishlists.map((wishlist) => wishlist.name.value).sort();
}

let environment: RulesTestEnvironment;

beforeAll(async () => {
  environment = await startTestEnvironment();
});

beforeEach(async () => {
  await environment.clearFirestore();
});

afterAll(async () => {
  await environment.cleanup();
});

function familyRepository(): FirestoreWishlistRepository {
  return new FirestoreWishlistRepository(familyFirestore(environment), () => {});
}

describe('FirestoreWishlistRepository', () => {
  it('shows a saved wishlist with its owner on another device', async () => {
    const reports: (Wishlist | undefined)[] = [];
    familyRepository().watch(
      wishlistIdOf('b'),
      (wishlist) => reports.push(wishlist),
      ignoreFailure,
    );

    await familyRepository().save(wishlistNamed('Geburtstag', 'b', ben));

    await eventually(() => {
      expect(reports.at(-1)?.name.value).toBe('Geburtstag');
      expect(reports.at(-1)?.ownerId).toBe('ben');
    });
  });

  it('stores the name and the owner', async () => {
    await familyRepository().save(wishlistNamed('Geburtstag', 'b', ben));

    await eventually(async () => {
      const stored = await withoutRules(environment, async (firestore) =>
        (await getDoc(doc(firestore, WISHLISTS_COLLECTION, 'b'))).data(),
      );
      expect(stored).toEqual({ name: 'Geburtstag', ownerId: 'ben' });
    });
  });

  it('gives and reports only the wishlists of one owner', async () => {
    const repository = familyRepository();
    const reports: string[][] = [];
    repository.watchOwnedBy(ben, (wishlists) => reports.push(namesOf(wishlists)), ignoreFailure);
    await eventually(() => expect(reports).toEqual([[]]));

    await repository.save(wishlistNamed('Ostern', 'easter', ben));
    await repository.save(wishlistNamed('Geburtstag', 'birthday', anna));

    await eventually(() => expect(reports.at(-1)).toEqual(['Ostern']));
    expect(namesOf(await familyRepository().getOwnedBy(ben))).toEqual(['Ostern']);
    expect(reports.flat()).not.toContain('Geburtstag');
  });

  it('reports all wishlists at once and after each save and delete', async () => {
    const repository = familyRepository();
    const reports: string[][] = [];
    repository.watchAll((wishlists) => reports.push(namesOf(wishlists)), ignoreFailure);
    await eventually(() => expect(reports).toEqual([[]]));

    await repository.save(wishlistNamed('Geburtstag'));
    await eventually(() => expect(reports.at(-1)).toEqual(['Geburtstag']));
    await repository.delete(wishlistIdOf('Geburtstag'));

    await eventually(() => expect(reports.at(-1)).toEqual([]));
  });

  it('reports a single wishlist and its removal', async () => {
    const repository = familyRepository();
    const reports: (string | undefined)[] = [];
    repository.watch(
      wishlistIdOf('b'),
      (wishlist) => reports.push(wishlist?.name.value),
      ignoreFailure,
    );

    await repository.save(wishlistNamed('Geburtstag', 'b'));
    await eventually(() => expect(reports.at(-1)).toBe('Geburtstag'));
    await repository.delete(wishlistIdOf('b'));

    await eventually(() => expect(reports.at(-1)).toBeUndefined());
  });

  it('gives undefined for an unknown id', async () => {
    expect(await familyRepository().get(wishlistIdOf('unknown'))).toBeUndefined();
  });

  it('skips documents without a valid name or owner and keeps the others', async () => {
    await withoutRules(environment, async (firestore) => {
      const documents: Record<string, object> = {
        a: { name: '', ownerId: 'anna' },
        b: { name: 'Geburtstag', ownerId: 'anna' },
        c: { title: 'Ostern', ownerId: 'anna' },
        d: { name: 'Weihnachten' },
        e: { name: 'Pfingsten', ownerId: '' },
        f: { name: 'Nikolaus', ownerId: 7 },
      };
      for (const [id, data] of Object.entries(documents)) {
        await setDoc(doc(firestore, WISHLISTS_COLLECTION, id), data);
      }
    });
    const reports: string[][] = [];

    familyRepository().watchAll((wishlists) => reports.push(namesOf(wishlists)), ignoreFailure);

    await eventually(() => expect(reports.at(-1)).toEqual(['Geburtstag']));
  });

  it('does not wait for the server when saving', async () => {
    const firestore = familyFirestore(environment);
    const repository = new FirestoreWishlistRepository(firestore, () => {});
    const reports: (string | undefined)[] = [];
    repository.watch(
      wishlistIdOf('b'),
      (wishlist) => reports.push(wishlist?.name.value),
      ignoreFailure,
    );
    await eventually(() => expect(reports).toEqual([undefined]));
    await disableNetwork(firestore);

    await expect(
      Promise.race([
        repository.save(wishlistNamed('Geburtstag', 'b')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('save waited')), 1000)),
      ]),
    ).resolves.toBeUndefined();

    await eventually(() => expect(reports.at(-1)).toBe('Geburtstag'));
  });

  describe('without permission', () => {
    function visitorRepository(problems: WishlistProblem[]): FirestoreWishlistRepository {
      return new FirestoreWishlistRepository(
        asModularFirestore(environment.unauthenticatedContext()),
        (problem) => problems.push(problem),
      );
    }

    it('reports a listener that fails', async () => {
      const problems: WishlistProblem[] = [];
      let failures = 0;

      visitorRepository(problems).watchAll(
        () => {},
        () => (failures += 1),
      );

      await eventually(() => {
        expect(failures).toBe(1);
        expect(problems).toEqual(['loadFailed']);
      });
    });

    it('resolves a save and reports its rejection afterwards', async () => {
      const problems: WishlistProblem[] = [];

      await visitorRepository(problems).save(wishlistNamed('Geburtstag'));

      await eventually(() => expect(problems).toEqual(['writeRejected']));
    });
  });
});
