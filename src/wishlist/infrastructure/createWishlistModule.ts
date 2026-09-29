import type { Firestore } from 'firebase/firestore';
import { ChooseProfile } from '../application/ChooseProfile';
import { CreatePerson } from '../application/CreatePerson';
import { CreateWish } from '../application/CreateWish';
import { CreateWishlist } from '../application/CreateWishlist';
import { DeleteWish } from '../application/DeleteWish';
import { DeleteWishlist } from '../application/DeleteWishlist';
import { EditWish } from '../application/EditWish';
import { ForgetProfile } from '../application/ForgetProfile';
import { GiftWish } from '../application/GiftWish';
import { RenameWishlist } from '../application/RenameWishlist';
import { TakeBackGift } from '../application/TakeBackGift';
import { WatchCurrentPerson } from '../application/WatchCurrentPerson';
import { WatchPerson } from '../application/WatchPerson';
import { WatchPersons } from '../application/WatchPersons';
import { WatchWish } from '../application/WatchWish';
import { WatchWishesOfWishlist } from '../application/WatchWishesOfWishlist';
import { WatchWishlist } from '../application/WatchWishlist';
import { WatchWishlistOverview } from '../application/WatchWishlistOverview';
import type { IdGenerator } from '../domain/ids';
import type { ProfileStore } from '../domain/ProfileStore';
import { FirestorePersonRepository } from './firestore/FirestorePersonRepository';
import { FirestoreWishlistRepository } from './firestore/FirestoreWishlistRepository';
import { FirestoreWishRepository } from './firestore/FirestoreWishRepository';
import type { ReportWishlistProblem } from './wishlistProblem';

export type WishlistModuleSetup = {
  firestore: Firestore;
  idGenerator: IdGenerator;
  profileStore: ProfileStore;
  onProblem: ReportWishlistProblem;
};

export function createWishlistModule({
  firestore,
  idGenerator,
  profileStore,
  onProblem,
}: WishlistModuleSetup) {
  const persons = new FirestorePersonRepository(firestore, onProblem);
  const wishlists = new FirestoreWishlistRepository(firestore, onProblem);
  const wishes = new FirestoreWishRepository(firestore, onProblem);
  return {
    createPerson: new CreatePerson(persons, idGenerator),
    watchPersons: new WatchPersons(persons),
    watchPerson: new WatchPerson(persons),
    chooseProfile: new ChooseProfile(persons, profileStore),
    forgetProfile: new ForgetProfile(profileStore),
    watchCurrentPerson: new WatchCurrentPerson(persons, profileStore),
    createWishlist: new CreateWishlist(wishlists, persons, idGenerator),
    watchWishlistOverview: new WatchWishlistOverview(wishlists, persons),
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
