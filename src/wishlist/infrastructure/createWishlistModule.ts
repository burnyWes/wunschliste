import { CreateWishlist } from '../application/CreateWishlist';
import { WatchWishlist } from '../application/WatchWishlist';
import { WatchWishlists } from '../application/WatchWishlists';
import type { IdGenerator } from '../domain/ids';
import { LocalStorageWishlistRepository } from './localStorage/LocalStorageWishlistRepository';
import type { KeyValueStorage, StorageEvents } from './localStorage/StoredCollection';

export type WishlistModuleSetup = {
  storage: KeyValueStorage;
  storageEvents: StorageEvents;
  idGenerator: IdGenerator;
};

export function createWishlistModule({ storage, storageEvents, idGenerator }: WishlistModuleSetup) {
  const wishlists = new LocalStorageWishlistRepository(storage, storageEvents);
  return {
    createWishlist: new CreateWishlist(wishlists, idGenerator),
    watchWishlists: new WatchWishlists(wishlists),
    watchWishlist: new WatchWishlist(wishlists),
  };
}

export type WishlistModule = ReturnType<typeof createWishlistModule>;
