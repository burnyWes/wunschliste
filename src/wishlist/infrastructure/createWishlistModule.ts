import type { Firestore } from 'firebase/firestore';
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
import { FirestoreWishlistRepository } from './firestore/FirestoreWishlistRepository';
import { FirestoreWishRepository } from './firestore/FirestoreWishRepository';
import type { ReportWishlistProblem } from './wishlistProblem';

export type WishlistModuleSetup = {
  firestore: Firestore;
  idGenerator: IdGenerator;
  onProblem: ReportWishlistProblem;
};

export function createWishlistModule({ firestore, idGenerator, onProblem }: WishlistModuleSetup) {
  const wishlists = new FirestoreWishlistRepository(firestore, onProblem);
  const wishes = new FirestoreWishRepository(firestore, onProblem);
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
