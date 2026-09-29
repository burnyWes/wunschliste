import {
  collection,
  deleteDoc,
  doc,
  getDocsFromCache,
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
import type { WishRepository } from '../../domain/WishRepository';
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

  watchByWishlist(
    wishlistId: WishlistId,
    onChange: (wishes: readonly Wish[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return onSnapshot(
      this.#wishesOf(wishlistId),
      (snapshot) => onChange(snapshot.docs.map(wishIn).filter((wish) => wish !== undefined)),
      reportedFailure(onFailure, this.#onProblem),
    );
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

  async save(wish: Wish): Promise<void> {
    observedWrite(setDoc(this.#reference(wish.id), toWishDocument(wish)), this.#onProblem);
  }

  async delete(id: WishId): Promise<void> {
    observedWrite(deleteDoc(this.#reference(id)), this.#onProblem);
  }

  async deleteAllOf(wishlistId: WishlistId): Promise<void> {
    const cachedWishes = await getDocsFromCache(this.#wishesOf(wishlistId));
    const batch = writeBatch(this.#firestore);
    for (const wish of cachedWishes.docs) {
      batch.delete(wish.ref);
    }
    observedWrite(batch.commit(), this.#onProblem);
  }

  #wishesOf(wishlistId: WishlistId): Query {
    return query(
      collection(this.#firestore, WISHES_COLLECTION),
      where('wishlistId', '==', wishlistId),
    );
  }

  #reference(id: WishId): DocumentReference {
    return doc(this.#firestore, WISHES_COLLECTION, id);
  }
}
