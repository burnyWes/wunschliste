import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { disableNetwork, doc, enableNetwork, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { personIdOf } from '../../src/wishlist/domain/ids';
import { Name } from '../../src/wishlist/domain/Name';
import { requireValid } from '../../src/wishlist/domain/parsed';
import { Person } from '../../src/wishlist/domain/Person';
import {
  FirestorePersonRepository,
  PERSONS_COLLECTION,
} from '../../src/wishlist/infrastructure/firestore/FirestorePersonRepository';
import type { WishlistProblem } from '../../src/wishlist/infrastructure/wishlistProblem';
import { eventually } from './eventually';
import {
  asModularFirestore,
  familyFirestore,
  ignoreFailure,
  startTestEnvironment,
  withoutRules,
} from './testFirestore';

const QUIET_PERIOD_MS = 500;

function personNamed(name: string, id = name.toLowerCase()): Person {
  return Person.create(personIdOf(id), requireValid(Name.parse(name)));
}

function namesOf(persons: readonly Person[]): string[] {
  return persons.map((person) => person.name.value).sort();
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

function familyRepository(): FirestorePersonRepository {
  return new FirestorePersonRepository(familyFirestore(environment), () => {});
}

async function seedPersons(names: Record<string, unknown>): Promise<void> {
  await withoutRules(environment, async (firestore) => {
    for (const [id, data] of Object.entries(names)) {
      await setDoc(doc(firestore, PERSONS_COLLECTION, id), data);
    }
  });
}

describe('FirestorePersonRepository', () => {
  it('shows a saved person on another device', async () => {
    const reports: string[][] = [];
    familyRepository().watchAll((persons) => reports.push(namesOf(persons)), ignoreFailure);

    await familyRepository().save(personNamed('Anna'));

    await eventually(() => expect(reports.at(-1)).toEqual(['Anna']));
  });

  it('reports all persons at once and after each save and delete', async () => {
    const repository = familyRepository();
    const reports: string[][] = [];
    repository.watchAll((persons) => reports.push(namesOf(persons)), ignoreFailure);
    await eventually(() => expect(reports).toEqual([[]]));

    await repository.save(personNamed('Anna'));
    await eventually(() => expect(reports.at(-1)).toEqual(['Anna']));
    await repository.delete(personIdOf('anna'));

    await eventually(() => expect(reports.at(-1)).toEqual([]));
  });

  it('gives a fresh device all persons from the server', async () => {
    await seedPersons({ anna: { name: 'Anna' }, ben: { name: 'Ben' } });

    expect(namesOf(await familyRepository().getAll())).toEqual(['Anna', 'Ben']);
  });

  it('gives a watched person by its id', async () => {
    const repository = familyRepository();
    await seedPersons({ anna: { name: 'Anna' } });
    const reports: string[][] = [];
    repository.watchAll((persons) => reports.push(namesOf(persons)), ignoreFailure);
    await eventually(() => expect(reports.at(-1)).toEqual(['Anna']));

    expect((await repository.get(personIdOf('anna')))?.name.value).toBe('Anna');
    expect(await repository.get(personIdOf('unknown'))).toBeUndefined();
  });

  it('skips documents without a valid name and keeps the others', async () => {
    await seedPersons({ a: { name: '' }, b: { name: 'Ben' }, c: { title: 'Oma' } });
    const reports: string[][] = [];

    familyRepository().watchAll((persons) => reports.push(namesOf(persons)), ignoreFailure);

    await eventually(() => expect(reports.at(-1)).toEqual(['Ben']));
  });

  it('does not report an empty cache as no persons', async () => {
    const firestore = familyFirestore(environment);
    const repository = new FirestorePersonRepository(firestore, () => {});
    await disableNetwork(firestore);
    const reports: string[][] = [];

    repository.watchAll((persons) => reports.push(namesOf(persons)), ignoreFailure);
    await new Promise((resolve) => setTimeout(resolve, QUIET_PERIOD_MS));

    expect(reports).toEqual([]);
    await enableNetwork(firestore);
    await eventually(() => expect(reports.at(-1)).toEqual([]));
  });

  it('reports an empty cache once the server confirmed it', async () => {
    const firestore = familyFirestore(environment);
    const repository = new FirestorePersonRepository(firestore, () => {});
    const firstReports: string[][] = [];
    const stopFirstWatch = repository.watchAll(
      (persons) => firstReports.push(namesOf(persons)),
      ignoreFailure,
    );
    await eventually(() => expect(firstReports).toEqual([[]]));
    stopFirstWatch();
    const laterReports: string[][] = [];

    repository.watchAll((persons) => laterReports.push(namesOf(persons)), ignoreFailure);

    await eventually(() => expect(laterReports.at(-1)).toEqual([]));
  });

  it('does not wait for the server when saving', async () => {
    const firestore = familyFirestore(environment);
    const repository = new FirestorePersonRepository(firestore, () => {});
    const reports: string[][] = [];
    repository.watchAll((persons) => reports.push(namesOf(persons)), ignoreFailure);
    await eventually(() => expect(reports).toEqual([[]]));
    await disableNetwork(firestore);

    await expect(
      Promise.race([
        repository.save(personNamed('Anna')),
        new Promise((_, reject) => setTimeout(() => reject(new Error('save waited')), 1000)),
      ]),
    ).resolves.toBeUndefined();

    await eventually(() => expect(reports.at(-1)).toEqual(['Anna']));
  });

  describe('without permission', () => {
    function visitorRepository(problems: WishlistProblem[]): FirestorePersonRepository {
      return new FirestorePersonRepository(
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

      await visitorRepository(problems).save(personNamed('Anna'));

      await eventually(() => expect(problems).toEqual(['writeRejected']));
    });
  });
});
