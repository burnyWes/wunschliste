import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Query,
} from 'firebase/firestore';
import type { WishId, WishlistId } from '../../domain/ids';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import type { Wish } from '../../domain/Wish';
import type { WishesOfWishlist, WishRepository } from '../../domain/WishRepository';
import type { ReportWishlistProblem } from '../wishlistProblem';
import { cachedDocument } from './cachedDocument';
import { observedWrite } from './observedWrite';
import { reportedFailure } from './reportedFailure';
import { toWishDocument, wishFromDocument } from './wishDocument';

export const WISHES_COLLECTION = 'wishes';

function wishIn(snapshot: DocumentSnapshot): Wish | undefined {
  return snapshot.exists() ? wishFromDocument(snapshot.id, snapshot.data()) : undefined;
}

export class FirestoreWishRepository implements WishRepository {
  readonly #firestore: Firestore;
  readonly #onProblem: ReportWishlistProblem;

  constructor(firestore: Firestore, onProblem: ReportWishlistProblem) {
    this.#firestore = firestore;
    this.#onProblem = onProblem;
  }

  watchAll(onChange: (wishes: readonly Wish[]) => void, onFailure: () => void): Unsubscribe {
    return this.#watchWishesIn(this.#allWishes(), onChange, onFailure);
  }

  watchByWishlist(
    wishlistId: WishlistId,
    onChange: (wishes: readonly Wish[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return this.#watchWishesIn(this.#wishesOf(wishlistId), onChange, onFailure);
  }

  watch(
    id: WishId,
    onChange: (wish: Wish | undefined) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return onSnapshot(
      this.#reference(id),
      (snapshot) => onChange(wishIn(snapshot)),
      reportedFailure(onFailure, this.#onProblem),
    );
  }

  async get(id: WishId): Promise<Wish | undefined> {
    return wishIn(await cachedDocument(this.#reference(id)));
  }

  async getByWishlist(wishlistId: WishlistId): Promise<WishesOfWishlist> {
    const snapshot = await getDocs(this.#wishesOf(wishlistId));
    return {
      wishes: snapshot.docs.map(wishIn).filter((wish) => wish !== undefined),
      confirmed: !snapshot.metadata.fromCache,
    };
  }

  async save(wish: Wish): Promise<void> {
    observedWrite(setDoc(this.#reference(wish.id), toWishDocument(wish)), this.#onProblem);
  }

  async delete(id: WishId): Promise<void> {
    observedWrite(deleteDoc(this.#reference(id)), this.#onProblem);
  }

  async deleteAllOf(wishlistId: WishlistId): Promise<void> {
    const wishes = await getDocs(this.#wishesOf(wishlistId));
    const batch = writeBatch(this.#firestore);
    for (const wish of wishes.docs) {
      batch.delete(wish.ref);
    }
    observedWrite(batch.commit(), this.#onProblem);
  }

  #watchWishesIn(
    wishes: Query,
    onChange: (wishes: readonly Wish[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return onSnapshot(
      wishes,
      (snapshot) => onChange(snapshot.docs.map(wishIn).filter((wish) => wish !== undefined)),
      reportedFailure(onFailure, this.#onProblem),
    );
  }

  #allWishes(): Query {
    return collection(this.#firestore, WISHES_COLLECTION);
  }

  #wishesOf(wishlistId: WishlistId): Query {
    return query(this.#allWishes(), where('wishlistId', '==', wishlistId));
  }

  #reference(id: WishId): DocumentReference {
    return doc(this.#firestore, WISHES_COLLECTION, id);
  }
}
