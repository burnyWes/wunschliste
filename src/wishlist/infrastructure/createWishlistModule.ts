import { CreateWish } from '../application/CreateWish';
import { CreateWishlist } from '../application/CreateWishlist';
import { DeleteWish } from '../application/DeleteWish';
import { DeleteWishlist } from '../application/DeleteWishlist';
import { EditWish } from '../application/EditWish';
import { GiftWish } from '../application/GiftWish';
import { RenameWishlist } from '../application/RenameWishlist';
import { TakeBackGift } from '../application/TakeBackGift';
import { WatchWish } from '../application/WatchWish';
import { WatchWishesOfWishlist } from '../application/WatchWishesOfWishlist';
import { WatchWishlist } from '../application/WatchWishlist';
import { WatchWishlists } from '../application/WatchWishlists';
import type { IdGenerator } from '../domain/ids';
import { LocalStorageWishlistRepository } from './localStorage/LocalStorageWishlistRepository';
import { LocalStorageWishRepository } from './localStorage/LocalStorageWishRepository';
import type { KeyValueStorage, StorageEvents } from './localStorage/StoredCollection';

export type WishlistModuleSetup = {
  storage: KeyValueStorage;
  storageEvents: StorageEvents;
  idGenerator: IdGenerator;
};

export function createWishlistModule({ storage, storageEvents, idGenerator }: WishlistModuleSetup) {
  const wishlists = new LocalStorageWishlistRepository(storage, storageEvents);
  const wishes = new LocalStorageWishRepository(storage, storageEvents);
  return {
    createWishlist: new CreateWishlist(wishlists, idGenerator),
    watchWishlists: new WatchWishlists(wishlists),
    watchWishlist: new WatchWishlist(wishlists),
    renameWishlist: new RenameWishlist(wishlists),
    deleteWishlist: new DeleteWishlist(wishlists, wishes),
    createWish: new CreateWish(wishlists, wishes, idGenerator),
    watchWishesOfWishlist: new WatchWishesOfWishlist(wishes),
    watchWish: new WatchWish(wishes),
    editWish: new EditWish(wishes),
    deleteWish: new DeleteWish(wishes),
    giftWish: new GiftWish(wishes),
    takeBackGift: new TakeBackGift(wishes),
  };
}

export type WishlistModule = ReturnType<typeof createWishlistModule>;
