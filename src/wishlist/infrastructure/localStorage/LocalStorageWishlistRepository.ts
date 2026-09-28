import { wishlistIdOf, type WishlistId } from '../../domain/ids';
import { Name } from '../../domain/Name';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import { Wishlist } from '../../domain/Wishlist';
import type { WishlistRepository } from '../../domain/WishlistRepository';
import {
  isObject,
  StoredCollection,
  type KeyValueStorage,
  type StorageEvents,
} from './StoredCollection';

type WishlistRecord = { id: string; name: string };

export const WISHLISTS_KEY = 'wunschliste.wishlists';

function isWishlistRecord(candidate: unknown): candidate is WishlistRecord {
  return (
    isObject(candidate) && typeof candidate.id === 'string' && typeof candidate.name === 'string'
  );
}

function toWishlist(record: WishlistRecord): Wishlist | undefined {
  const name = Name.parse(record.name);
  return name.ok ? Wishlist.restore(wishlistIdOf(record.id), name.value) : undefined;
}

function toRecord(wishlist: Wishlist): WishlistRecord {
  return { id: wishlist.id, name: wishlist.name.value };
}

function toWishlists(records: readonly WishlistRecord[]): Wishlist[] {
  return records.map(toWishlist).filter((wishlist) => wishlist !== undefined);
}

function findIn(records: readonly WishlistRecord[], id: WishlistId): Wishlist | undefined {
  return toWishlists(records).find((wishlist) => wishlist.id === id);
}

export class LocalStorageWishlistRepository implements WishlistRepository {
  readonly #collection: StoredCollection<WishlistRecord>;

  constructor(storage: KeyValueStorage, storageEvents: StorageEvents) {
    this.#collection = new StoredCollection(
      { storage, storageEvents, key: WISHLISTS_KEY },
      isWishlistRecord,
    );
  }

  watchAll(onChange: (wishlists: readonly Wishlist[]) => void): Unsubscribe {
    return this.#collection.observe((records) => onChange(toWishlists(records)));
  }

  watch(id: WishlistId, onChange: (wishlist: Wishlist | undefined) => void): Unsubscribe {
    return this.#collection.observe((records) => onChange(findIn(records, id)));
  }

  async get(id: WishlistId): Promise<Wishlist | undefined> {
    return findIn(this.#collection.records(), id);
  }

  async save(wishlist: Wishlist): Promise<void> {
    this.#collection.put(toRecord(wishlist));
  }

  async delete(id: WishlistId): Promise<void> {
    this.#collection.removeWhere((record) => record.id === id);
  }
}
