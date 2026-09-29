import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { disableNetwork, doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { personIdOf, wishIdOf, wishlistIdOf, type WishlistId } from '../../src/wishlist/domain/ids';
import { Wish } from '../../src/wishlist/domain/Wish';
import { parseWishDetails, type WishDetailsInput } from '../../src/wishlist/domain/WishDetails';
import {
  FirestoreWishRepository,
  WISHES_COLLECTION,
} from '../../src/wishlist/infrastructure/firestore/FirestoreWishRepository';
import type { WishlistProblem } from '../../src/wishlist/infrastructure/wishlistProblem';
import { eventually } from './eventually';
import {
  asModularFirestore,
  familyFirestore,
  ignoreFailure,
  startTestEnvironment,
  withoutRules,
} from './testFirestore';

const birthday = wishlistIdOf('birthday');
const christmas = wishlistIdOf('christmas');
const anna = personIdOf('anna');
const ben = personIdOf('ben');

const ONLY_A_NAME: Omit<WishDetailsInput, 'name'> = {
  link: '',
  description: '',
  price: '',
  rating: undefined,
};

function wishOf(input: WishDetailsInput, wishlistId: WishlistId, id: string): Wish {
  const parsed = parseWishDetails(input);
  if (!parsed.ok) {
    throw new Error(`Invalid test wish ${input.name}`);
  }
  return Wish.create(
    { id: wishIdOf(id), wishlistId, details: parsed.details, secret: false },
    { me: anna, ownerId: anna },
  );
}

function wishNamed(name: string, wishlistId: WishlistId = birthday, id = name): Wish {
  return wishOf({ ...ONLY_A_NAME, name }, wishlistId, id);
}

function withoutField(document: object, field: string): object {
  return Object.fromEntries(Object.entries(document).filter(([key]) => key !== field));
}

function namesOf(wishes: readonly Wish[]): string[] {
  return wishes.map(({ details }) => details.name.value).sort();
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

function familyRepository(): FirestoreWishRepository {
  return new FirestoreWishRepository(familyFirestore(environment), () => {});
}

describe('FirestoreWishRepository', () => {
  it('restores every field on another device', async () => {
    const helmet = wishOf(
      {
        name: 'Fahrradhelm',
        link: 'amazon.de/helm',
        description: 'Größe M',
        price: '49,99',
        rating: 'essential',
      },
      birthday,
      'h',
    );
    let restored: Wish | undefined;
    familyRepository().watch(wishIdOf('h'), (wish) => (restored = wish), ignoreFailure);

    await familyRepository().save(helmet);

    await eventually(() => {
      expect(restored?.wishlistId).toBe(birthday);
      expect(restored?.details.name.value).toBe('Fahrradhelm');
      expect(restored?.details.link?.href).toBe('https://amazon.de/helm');
      expect(restored?.details.description?.value).toBe('Größe M');
      expect(restored?.details.price?.cents).toBe(4999);
      expect(restored?.details.rating).toBe('essential');
      expect(restored?.createdBy).toBe(anna);
      expect(restored?.secret).toBe(false);
      expect(restored?.giverId).toBeUndefined();
      expect(restored?.received).toBe(false);
      expect(restored?.removedByOwner).toBe(false);
    });
  });

  it('restores the giver and the receipt', async () => {
    const received = wishNamed('Helm')
      .perform('gift', { me: ben, ownerId: anna })
      .perform('receive', { me: anna, ownerId: anna });
    let restored: Wish | undefined;
    familyRepository().watch(wishIdOf('Helm'), (wish) => (restored = wish), ignoreFailure);

    await familyRepository().save(received);

    await eventually(() => {
      expect(restored?.giverId).toBe(ben);
      expect(restored?.received).toBe(true);
    });
  });

  it('restores a secret wish', async () => {
    const secret = Wish.create(
      {
        id: wishIdOf('Konzert'),
        wishlistId: birthday,
        details: { name: wishNamed('Konzert').details.name },
        secret: true,
      },
      { me: ben, ownerId: anna },
    );
    let restored: Wish | undefined;
    familyRepository().watch(wishIdOf('Konzert'), (wish) => (restored = wish), ignoreFailure);

    await familyRepository().save(secret);

    await eventually(() => {
      expect(restored?.secret).toBe(true);
      expect(restored?.createdBy).toBe(ben);
    });
  });

  it('stores only the fields a wish has', async () => {
    await familyRepository().save(wishNamed('Buch', birthday, 'b'));

    await eventually(async () => {
      const stored = await withoutRules(environment, async (firestore) =>
        (await getDoc(doc(firestore, WISHES_COLLECTION, 'b'))).data(),
      );
      expect(stored).toEqual({
        wishlistId: 'birthday',
        name: 'Buch',
        createdBy: 'anna',
        secret: false,
        received: false,
        removedByOwner: false,
      });
    });
  });

  it('reports only the wishes of one wishlist, at once and after each save and delete', async () => {
    const repository = familyRepository();
    const reports: string[][] = [];
    repository.watchByWishlist(birthday, (wishes) => reports.push(namesOf(wishes)), ignoreFailure);
    await eventually(() => expect(reports).toEqual([[]]));

    await repository.save(wishNamed('Helm'));
    await repository.save(wishNamed('Schlitten', christmas));
    await eventually(() => expect(reports.at(-1)).toEqual(['Helm']));
    await repository.delete(wishIdOf('Helm'));

    await eventually(() => expect(reports.at(-1)).toEqual([]));
    expect(reports.flat()).not.toContain('Schlitten');
  });

  it('reports a single wish and its removal', async () => {
    const repository = familyRepository();
    const reports: (string | undefined)[] = [];
    repository.watch(
      wishIdOf('Helm'),
      (wish) => reports.push(wish?.details.name.value),
      ignoreFailure,
    );

    await repository.save(wishNamed('Helm'));
    await eventually(() => expect(reports.at(-1)).toBe('Helm'));
    await repository.delete(wishIdOf('Helm'));

    await eventually(() => expect(reports.at(-1)).toBeUndefined());
  });

  it('gives undefined for an unknown id', async () => {
    expect(await familyRepository().get(wishIdOf('unknown'))).toBeUndefined();
  });

  it('deletes all wishes of one wishlist and keeps the others', async () => {
    const repository = familyRepository();
    await repository.save(wishNamed('Helm'));
    await repository.save(wishNamed('Buch'));
    await repository.save(wishNamed('Schlitten', christmas));

    const otherDevice = familyRepository();
    const remainingBirthdayWishes: string[][] = [];
    const remainingChristmasWishes: string[][] = [];
    otherDevice.watchByWishlist(
      birthday,
      (wishes) => remainingBirthdayWishes.push(namesOf(wishes)),
      ignoreFailure,
    );
    otherDevice.watchByWishlist(
      christmas,
      (wishes) => remainingChristmasWishes.push(namesOf(wishes)),
      ignoreFailure,
    );
    await eventually(() => expect(remainingBirthdayWishes.at(-1)).toEqual(['Buch', 'Helm']));

    await repository.deleteAllOf(birthday);

    await eventually(() => expect(remainingBirthdayWishes.at(-1)).toEqual([]));
    expect(remainingChristmasWishes.at(-1)).toEqual(['Schlitten']);
  });

  it('skips documents that break a rule and keeps the others', async () => {
    const valid = {
      wishlistId: 'birthday',
      name: 'Helm',
      createdBy: 'anna',
      secret: false,
      received: false,
      removedByOwner: false,
    };
    await withoutRules(environment, async (firestore) => {
      const documents: Record<string, object> = {
        ok: valid,
        price: { ...valid, priceInCents: 0 },
        fraction: { ...valid, priceInCents: 1.5 },
        link: { ...valid, link: 'javascript:alert(1)' },
        rating: { ...valid, rating: 'sehr' },
        name: { ...valid, name: ' ' },
        legacy: { wishlistId: 'birthday', name: 'Helm', gifted: true },
        createdBy: { ...valid, createdBy: '' },
        giverId: { ...valid, giverId: '' },
        received: { ...valid, received: 'ja' },
        secret: withoutField(valid, 'secret'),
        removedByOwner: withoutField(valid, 'removedByOwner'),
      };
      for (const [id, data] of Object.entries(documents)) {
        await setDoc(doc(firestore, WISHES_COLLECTION, id), data);
      }
    });
    const reports: string[][] = [];

    familyRepository().watchByWishlist(
      birthday,
      (wishes) => reports.push(wishes.map(({ id }) => id)),
      ignoreFailure,
    );

    await eventually(() => expect(reports.at(-1)).toEqual(['ok']));
  });

  it('does not wait for the server when saving', async () => {
    const firestore = familyFirestore(environment);
    const repository = new FirestoreWishRepository(firestore, () => {});
    const reports: (string | undefined)[] = [];
    repository.watch(
      wishIdOf('Helm'),
      (wish) => reports.push(wish?.details.name.value),
      ignoreFailure,
    );
    await eventually(() => expect(reports).toEqual([undefined]));
    await disableNetwork(firestore);

    await expect(
      Promise.race([
        repository.save(wishNamed('Helm')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('save waited')), 1000)),
      ]),
    ).resolves.toBeUndefined();

    await eventually(() => expect(reports.at(-1)).toBe('Helm'));
  });

  it('reports the wishes of a wishlist that cannot be loaded', async () => {
    const problems: WishlistProblem[] = [];
    let failures = 0;
    const visitorRepository = new FirestoreWishRepository(
      asModularFirestore(environment.unauthenticatedContext()),
      (problem) => problems.push(problem),
    );

    visitorRepository.watchByWishlist(
      birthday,
      () => {},
      () => (failures += 1),
    );

    await eventually(() => {
      expect(failures).toBe(1);
      expect(problems).toEqual(['loadFailed']);
    });
  });
});
