import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  type Auth,
} from 'firebase/auth';
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { firebaseOptions, useEmulators } from './firebaseConfig';

const app = initializeApp(firebaseOptions);

let auth: Auth | undefined;

export function familyAuth(): Auth {
  auth ??= startFamilyAuth();
  return auth;
}

function startFamilyAuth(): Auth {
  const startedAuth = initializeAuth(app, { persistence: indexedDBLocalPersistence });
  if (useEmulators) {
    connectAuthEmulator(startedAuth, 'http://127.0.0.1:9099', { disableWarnings: true });
  }
  return startedAuth;
}

export function openFamilyDatabase(): Firestore {
  const firestore = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
  if (useEmulators) {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
  }
  return firestore;
}

export function forgetFamilyDatabase(firestore: Firestore): Promise<void> {
  return clearIndexedDbPersistence(firestore);
}
