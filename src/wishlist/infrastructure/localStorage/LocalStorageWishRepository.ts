import { Description } from '../../domain/Description';
import { wishIdOf, wishlistIdOf, type WishId, type WishlistId } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { valid } from '../../domain/parsed';
import { Price } from '../../domain/Price';
import { isRating, type Rating } from '../../domain/Rating';
import type { Unsubscribe } from '../../domain/Unsubscribe';
import { Wish } from '../../domain/Wish';
import type { WishDetails } from '../../domain/WishDetails';
import { WishLink } from '../../domain/WishLink';
import type { WishRepository } from '../../domain/WishRepository';
import {
  isObject,
  StoredCollection,
  type KeyValueStorage,
  type StorageEvents,
} from './StoredCollection';

type WishRecord = {
  id: string;
  wishlistId: string;
  name: string;
  link?: string;
  description?: string;
  priceInCents?: number;
  rating?: Rating;
  gifted: boolean;
};

export const WISHES_KEY = 'wunschliste.wishes';

function isOptional(value: unknown, type: 'string' | 'number'): boolean {
  return value === undefined || typeof value === type;
}

function isWishRecord(candidate: unknown): candidate is WishRecord {
  return (
    isObject(candidate) &&
    typeof candidate.id === 'string' &&
    typeof candidate.wishlistId === 'string' &&
    typeof candidate.name === 'string' &&
    isOptional(candidate.link, 'string') &&
    isOptional(candidate.description, 'string') &&
    isOptional(candidate.priceInCents, 'number') &&
    (candidate.rating === undefined || isRating(candidate.rating)) &&
    typeof candidate.gifted === 'boolean'
  );
}

function toDetails(record: WishRecord): WishDetails | undefined {
  const name = Name.parse(record.name);
  const link = WishLink.parse(record.link ?? '');
  const description = Description.parse(record.description ?? '');
  const price =
    record.priceInCents === undefined ? valid(undefined) : Price.ofCents(record.priceInCents);
  if (!name.ok || !link.ok || !description.ok || !price.ok) {
    return undefined;
  }
  return {
    name: name.value,
    link: link.value,
    description: description.value,
    price: price.value,
    rating: record.rating,
  };
}

function toWish(record: WishRecord): Wish | undefined {
  const details = toDetails(record);
  return (
    details &&
    Wish.restore({
      id: wishIdOf(record.id),
      wishlistId: wishlistIdOf(record.wishlistId),
      details,
      gifted: record.gifted,
    })
  );
}

function toRecord({ id, wishlistId, details, gifted }: Wish): WishRecord {
  return {
    id,
    wishlistId,
    name: details.name.value,
    link: details.link?.href,
    description: details.description?.value,
    priceInCents: details.price?.cents,
    rating: details.rating,
    gifted,
  };
}

function toWishes(records: readonly WishRecord[]): Wish[] {
  return records.map(toWish).filter((wish) => wish !== undefined);
}

function findIn(records: readonly WishRecord[], id: WishId): Wish | undefined {
  return toWishes(records).find((wish) => wish.id === id);
}

export class LocalStorageWishRepository implements WishRepository {
  readonly #collection: StoredCollection<WishRecord>;

  constructor(storage: KeyValueStorage, storageEvents: StorageEvents) {
    this.#collection = new StoredCollection(
      { storage, storageEvents, key: WISHES_KEY },
      isWishRecord,
    );
  }

  watchByWishlist(
    wishlistId: WishlistId,
    onChange: (wishes: readonly Wish[]) => void,
  ): Unsubscribe {
    return this.#collection.observe((records) =>
      onChange(toWishes(records).filter((wish) => wish.wishlistId === wishlistId)),
    );
  }

  watch(id: WishId, onChange: (wish: Wish | undefined) => void): Unsubscribe {
    return this.#collection.observe((records) => onChange(findIn(records, id)));
  }

  async get(id: WishId): Promise<Wish | undefined> {
    return findIn(this.#collection.records(), id);
  }

  async save(wish: Wish): Promise<void> {
    this.#collection.put(toRecord(wish));
  }

  async delete(id: WishId): Promise<void> {
    this.#collection.removeWhere((record) => record.id === id);
  }

  async deleteAllOf(wishlistId: WishlistId): Promise<void> {
    this.#collection.removeWhere((record) => record.wishlistId === wishlistId);
  }
}
