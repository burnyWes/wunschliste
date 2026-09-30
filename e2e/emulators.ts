import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDocs, setDoc, writeBatch, type Firestore } from 'firebase/firestore';
import { familyAccountUidFrom, readFamilyRules } from '../tests/familyAccount';
import { startTestEnvironment, withoutRules } from '../tests/integration/testFirestore';

export const PROJECT_ID = 'demo-wunschliste';

export type PersonRecord = { id: string; name: string };

export type WishlistRecord = {
  id: string;
  name: string;
  ownerId: string;
  removedByOwner?: boolean;
};

export type WishRecord = {
  id: string;
  wishlistId: string;
  name: string;
  brand?: string;
  link?: string;
  description?: string;
  priceInCents?: number;
  rating?: 'essential' | 'wanted' | 'nice';
  createdOn?: string;
  createdBy: string;
  secret: boolean;
  giverId?: string;
  received: boolean;
  removedByOwner: boolean;
  repeatable?: boolean;
  gifts?: { recordedBy: string }[];
};

type WishRecordDefaults = 'createdBy' | 'secret' | 'received' | 'removedByOwner';

export function wishRecord(
  fields: Omit<WishRecord, WishRecordDefaults> & Partial<Pick<WishRecord, WishRecordDefaults>>,
): WishRecord {
  return { createdBy: 'anna', secret: false, received: false, removedByOwner: false, ...fields };
}

export type SeedData = {
  persons?: PersonRecord[];
  wishlists?: WishlistRecord[];
  wishes?: WishRecord[];
};

let testEnvironment: Promise<RulesTestEnvironment> | undefined;

function emulatedFirestore(): Promise<RulesTestEnvironment> {
  testEnvironment ??= startTestEnvironment();
  return testEnvironment;
}

export async function resetFirestore(): Promise<void> {
  await (await emulatedFirestore()).clearFirestore();
}

export async function seed({ persons = [], wishlists = [], wishes = [] }: SeedData): Promise<void> {
  await withoutRules(await emulatedFirestore(), async (firestore) => {
    const batch = writeBatch(firestore);
    for (const { id, ...person } of persons) {
      batch.set(doc(firestore, 'persons', id), person);
    }
    for (const { id, ...wishlist } of wishlists) {
      batch.set(doc(firestore, 'wishlists', id), wishlist);
    }
    for (const { id, ...wish } of wishes) {
      batch.set(doc(firestore, 'wishes', id), wish);
    }
    await batch.commit();
  });
}

export async function seedDocument(
  collectionName: string,
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await withoutRules(await emulatedFirestore(), async (firestore) => {
    await setDoc(doc(firestore, collectionName, id), data);
  });
}

async function storedRecords<T>(collectionName: string): Promise<T[]> {
  return withoutRules(await emulatedFirestore(), async (firestore: Firestore) => {
    const snapshot = await getDocs(collection(firestore, collectionName));
    return snapshot.docs.map((stored) => ({ id: stored.id, ...stored.data() }) as T);
  });
}

export function storedPersons(): Promise<PersonRecord[]> {
  return storedRecords<PersonRecord>('persons');
}

export function storedWishlists(): Promise<WishlistRecord[]> {
  return storedRecords<WishlistRecord>('wishlists');
}

export function storedWishes(): Promise<WishRecord[]> {
  return storedRecords<WishRecord>('wishes');
}

export const FAMILY = { email: 'familie@example.de', password: 'geheim-123' };

export const STRANGER = { uid: 'stranger', email: 'fremd@example.de', password: 'fremd-123' };

const AUTH_EMULATOR = 'http://127.0.0.1:9099';

export type Account = { uid: string; email: string; password: string };

export function familyAccountUid(): string {
  return familyAccountUidFrom(readFamilyRules());
}

async function requireSuccess(response: Response, action: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`${action} failed: ${response.status} ${await response.text()}`);
  }
}

export async function resetAuth(): Promise<void> {
  const response = await fetch(`${AUTH_EMULATOR}/emulator/v1/projects/${PROJECT_ID}/accounts`, {
    method: 'DELETE',
  });
  await requireSuccess(response, 'Resetting the auth emulator');
}

export async function createAccount({ uid, email, password }: Account): Promise<void> {
  const response = await fetch(
    `${AUTH_EMULATOR}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts`,
    {
      method: 'POST',
      headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
      body: JSON.stringify({ localId: uid, email, password }),
    },
  );
  await requireSuccess(response, `Creating the account ${email}`);
}
