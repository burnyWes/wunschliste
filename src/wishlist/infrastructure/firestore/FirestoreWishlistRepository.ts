import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
  type Query,
  type QuerySnapshot,
} from 'firebase/firestore';
import type { PersonId, WishlistId } from '../../domain/ids';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import type { Wishlist } from '../../domain/Wishlist';
import type { WishlistRepository } from '../../domain/WishlistRepository';
import type { ReportWishlistProblem } from '../wishlistProblem';
import { cachedDocument } from './cachedDocument';
import { observedWrite } from './observedWrite';
import { reportedFailure } from './reportedFailure';
import { toWishlistDocument, wishlistFromDocument } from './wishlistDocument';

export const WISHLISTS_COLLECTION = 'wishlists';

function wishlistIn(snapshot: DocumentSnapshot): Wishlist | undefined {
  return snapshot.exists() ? wishlistFromDocument(snapshot.id, snapshot.data()) : undefined;
}

function wishlistsIn(snapshot: QuerySnapshot): Wishlist[] {
  return snapshot.docs.map(wishlistIn).filter((wishlist) => wishlist !== undefined);
}

export class FirestoreWishlistRepository implements WishlistRepository {
  readonly #firestore: Firestore;
  readonly #onProblem: ReportWishlistProblem;

  constructor(firestore: Firestore, onProblem: ReportWishlistProblem) {
    this.#firestore = firestore;
    this.#onProblem = onProblem;
  }

  watchAll(onChange: (wishlists: readonly Wishlist[]) => void, onFailure: () => void): Unsubscribe {
    return onSnapshot(
      collection(this.#firestore, WISHLISTS_COLLECTION),
      (snapshot) => onChange(wishlistsIn(snapshot)),
      reportedFailure(onFailure, this.#onProblem),
    );
  }

  watchOwnedBy(
    ownerId: PersonId,
    onChange: (wishlists: readonly Wishlist[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return onSnapshot(
      this.#ownedBy(ownerId),
      (snapshot) => onChange(wishlistsIn(snapshot)),
      reportedFailure(onFailure, this.#onProblem),
    );
  }

  watch(
    id: WishlistId,
    onChange: (wishlist: Wishlist | undefined) => void,
    onFailure: () => void,
  ): Unsubscribe {
    return onSnapshot(
      this.#reference(id),
      (snapshot) => onChange(wishlistIn(snapshot)),
      reportedFailure(onFailure, this.#onProblem),
    );
  }

  async get(id: WishlistId): Promise<Wishlist | undefined> {
    return wishlistIn(await cachedDocument(this.#reference(id)));
  }

  async getOwnedBy(ownerId: PersonId): Promise<readonly Wishlist[]> {
    return wishlistsIn(await getDocs(this.#ownedBy(ownerId)));
  }

  async save(wishlist: Wishlist): Promise<void> {
    observedWrite(
      setDoc(this.#reference(wishlist.id), toWishlistDocument(wishlist)),
      this.#onProblem,
    );
  }

  async delete(id: WishlistId): Promise<void> {
    observedWrite(deleteDoc(this.#reference(id)), this.#onProblem);
  }

  #ownedBy(ownerId: PersonId): Query {
    return query(
      collection(this.#firestore, WISHLISTS_COLLECTION),
      where('ownerId', '==', ownerId),
    );
  }

  #reference(id: WishlistId): DocumentReference {
    return doc(this.#firestore, WISHLISTS_COLLECTION, id);
  }
}
