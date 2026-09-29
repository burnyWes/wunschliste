import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { disableNetwork, doc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { wishlistIdOf } from '../../src/wishlist/domain/ids';
import { Name } from '../../src/wishlist/domain/Name';
import { requireValid } from '../../src/wishlist/domain/parsed';
import { Wishlist } from '../../src/wishlist/domain/Wishlist';
import {
  FirestoreWishlistRepository,
  WISHLISTS_COLLECTION,
} from '../../src/wishlist/infrastructure/firestore/FirestoreWishlistRepository';
import { eventually } from './eventually';
import { familyFirestore, startTestEnvironment, withoutRules } from './testFirestore';

function wishlistNamed(name: string, id = name): Wishlist {
  return Wishlist.create(wishlistIdOf(id), requireValid(Name.parse(name)));
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
  it('shows a saved wishlist on another device', async () => {
    const reports: (string | undefined)[] = [];
    familyRepository().watch(wishlistIdOf('b'), (wishlist) => reports.push(wishlist?.name.value));

    await familyRepository().save(wishlistNamed('Geburtstag', 'b'));

    await eventually(() => expect(reports.at(-1)).toBe('Geburtstag'));
  });

  it('reports all wishlists at once and after each save and delete', async () => {
    const repository = familyRepository();
    const reports: string[][] = [];
    repository.watchAll((wishlists) => reports.push(namesOf(wishlists)));
    await eventually(() => expect(reports).toEqual([[]]));

    await repository.save(wishlistNamed('Geburtstag'));
    await eventually(() => expect(reports.at(-1)).toEqual(['Geburtstag']));
    await repository.delete(wishlistIdOf('Geburtstag'));

    await eventually(() => expect(reports.at(-1)).toEqual([]));
  });

  it('reports a single wishlist and its removal', async () => {
    const repository = familyRepository();
    const reports: (string | undefined)[] = [];
    repository.watch(wishlistIdOf('b'), (wishlist) => reports.push(wishlist?.name.value));

    await repository.save(wishlistNamed('Geburtstag', 'b'));
    await eventually(() => expect(reports.at(-1)).toBe('Geburtstag'));
    await repository.delete(wishlistIdOf('b'));

    await eventually(() => expect(reports.at(-1)).toBeUndefined());
  });

  it('gives undefined for an unknown id', async () => {
    expect(await familyRepository().get(wishlistIdOf('unknown'))).toBeUndefined();
  });

  it('skips a document with an empty name and keeps the others', async () => {
    await withoutRules(environment, async (firestore) => {
      await setDoc(doc(firestore, WISHLISTS_COLLECTION, 'a'), { name: '' });
      await setDoc(doc(firestore, WISHLISTS_COLLECTION, 'b'), { name: 'Geburtstag' });
      await setDoc(doc(firestore, WISHLISTS_COLLECTION, 'c'), { title: 'Ostern' });
    });
    const reports: string[][] = [];

    familyRepository().watchAll((wishlists) => reports.push(namesOf(wishlists)));

    await eventually(() => expect(reports.at(-1)).toEqual(['Geburtstag']));
  });

  it('does not wait for the server when saving', async () => {
    const firestore = familyFirestore(environment);
    const repository = new FirestoreWishlistRepository(firestore, () => {});
    const reports: (string | undefined)[] = [];
    repository.watch(wishlistIdOf('b'), (wishlist) => reports.push(wishlist?.name.value));
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
});
