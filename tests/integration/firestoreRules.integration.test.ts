import {
  assertFails,
  assertSucceeds,
  type RulesTestContext,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { familyAccountUidFrom, readFamilyRules } from '../familyAccount';
import { asModularFirestore, startTestEnvironment } from './testFirestore';

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

function familyAccount(): RulesTestContext {
  return environment.authenticatedContext(familyAccountUidFrom(readFamilyRules()));
}

async function readSucceeds(context: RulesTestContext, path: string): Promise<void> {
  await assertSucceeds(getDoc(doc(asModularFirestore(context), path)));
}

async function writeSucceeds(context: RulesTestContext, path: string): Promise<void> {
  await assertSucceeds(setDoc(doc(asModularFirestore(context), path), { name: 'Geburtstag' }));
}

async function readFails(context: RulesTestContext, path: string): Promise<void> {
  await assertFails(getDoc(doc(asModularFirestore(context), path)));
}

async function writeFails(context: RulesTestContext, path: string): Promise<void> {
  await assertFails(setDoc(doc(asModularFirestore(context), path), { name: 'Geburtstag' }));
}

describe('firestore rules', () => {
  it.each(['wishlists/a', 'wishes/b'])('let the family account read and write %s', async (path) => {
    await writeSucceeds(familyAccount(), path);
    await readSucceeds(familyAccount(), path);
  });

  it.each(['wishlists/a', 'wishes/b'])('keep another account out of %s', async (path) => {
    const stranger = environment.authenticatedContext('stranger');

    await writeFails(stranger, path);
    await readFails(stranger, path);
  });

  it.each(['wishlists/a', 'wishes/b'])('keep visitors without sign-in out of %s', async (path) => {
    const visitor = environment.unauthenticatedContext();

    await writeFails(visitor, path);
    await readFails(visitor, path);
  });

  it('keep even the family account out of other paths', async () => {
    await writeFails(familyAccount(), 'other/x');
    await readFails(familyAccount(), 'other/x');
  });
});
