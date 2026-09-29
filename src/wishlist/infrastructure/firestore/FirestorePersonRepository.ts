import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  type CollectionReference,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type QuerySnapshot,
} from 'firebase/firestore';
import type { PersonId } from '../../domain/ids';
import type { Person } from '../../domain/Person';
import type { PersonRepository } from '../../domain/PersonRepository';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import type { ReportWishlistProblem } from '../wishlistProblem';
import { cachedDocument } from './cachedDocument';
import { observedWrite } from './observedWrite';
import { personFromDocument, toPersonDocument } from './personDocument';
import { reportedFailure } from './reportedFailure';

export const PERSONS_COLLECTION = 'persons';

function personIn(snapshot: DocumentSnapshot): Person | undefined {
  return snapshot.exists() ? personFromDocument(snapshot.id, snapshot.data()) : undefined;
}

function personsIn(snapshot: QuerySnapshot): Person[] {
  return snapshot.docs.map(personIn).filter((person) => person !== undefined);
}

function isUnfilledCache(snapshot: QuerySnapshot): boolean {
  return snapshot.empty && snapshot.metadata.fromCache;
}

export class FirestorePersonRepository implements PersonRepository {
  readonly #firestore: Firestore;
  readonly #onProblem: ReportWishlistProblem;

  constructor(firestore: Firestore, onProblem: ReportWishlistProblem) {
    this.#firestore = firestore;
    this.#onProblem = onProblem;
  }

  watchAll(onChange: (persons: readonly Person[]) => void, onFailure: () => void): Unsubscribe {
    return onSnapshot(
      this.#persons(),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!isUnfilledCache(snapshot)) {
          onChange(personsIn(snapshot));
        }
      },
      reportedFailure(onFailure, this.#onProblem),
    );
  }

  async get(id: PersonId): Promise<Person | undefined> {
    return personIn(await cachedDocument(this.#reference(id)));
  }

  async getAll(): Promise<readonly Person[]> {
    return personsIn(await getDocs(this.#persons()));
  }

  async save(person: Person): Promise<void> {
    observedWrite(setDoc(this.#reference(person.id), toPersonDocument(person)), this.#onProblem);
  }

  async delete(id: PersonId): Promise<void> {
    observedWrite(deleteDoc(this.#reference(id)), this.#onProblem);
  }

  #persons(): CollectionReference {
    return collection(this.#firestore, PERSONS_COLLECTION);
  }

  #reference(id: PersonId): DocumentReference {
    return doc(this.#firestore, PERSONS_COLLECTION, id);
  }
}
