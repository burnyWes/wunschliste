import type { Firestore } from 'firebase/firestore';
import { ChangeWishState } from '../application/ChangeWishState';
import { ChooseProfile } from '../application/ChooseProfile';
import { CreatePerson } from '../application/CreatePerson';
import { CreateWish } from '../application/CreateWish';
import { CreateWishlist } from '../application/CreateWishlist';
import { DeletePerson } from '../application/DeletePerson';
import { DeleteWish } from '../application/DeleteWish';
import { DeleteWishlist } from '../application/DeleteWishlist';
import { EditWish } from '../application/EditWish';
import { ForgetProfile } from '../application/ForgetProfile';
import { RenamePerson } from '../application/RenamePerson';
import { RenameWishlist } from '../application/RenameWishlist';
import { WatchCurrentPerson } from '../application/WatchCurrentPerson';
import { WatchPerson } from '../application/WatchPerson';
import { WatchPersons } from '../application/WatchPersons';
import { WatchWish } from '../application/WatchWish';
import { WatchWishesOfWishlist } from '../application/WatchWishesOfWishlist';
import { WatchWishlist } from '../application/WatchWishlist';
import { WatchWishlistOverview } from '../application/WatchWishlistOverview';
import { WatchWishlistsOwnedBy } from '../application/WatchWishlistsOwnedBy';
import type { IdGenerator } from '../domain/ids';
import type { ProfileStore } from '../domain/ProfileStore';
import { FirestorePersonRepository } from './firestore/FirestorePersonRepository';
import { FirestoreWishlistRepository } from './firestore/FirestoreWishlistRepository';
import { FirestoreWishRepository } from './firestore/FirestoreWishRepository';
import { SystemClock } from './SystemClock';
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
    renamePerson: new RenamePerson(persons),
    deletePerson: new DeletePerson(persons, wishlists),
    chooseProfile: new ChooseProfile(persons, profileStore),
    forgetProfile: new ForgetProfile(profileStore),
    watchCurrentPerson: new WatchCurrentPerson(persons, profileStore),
    createWishlist: new CreateWishlist(wishlists, persons, idGenerator),
    watchWishlistOverview: new WatchWishlistOverview(wishlists, persons),
    watchWishlistsOwnedBy: new WatchWishlistsOwnedBy(wishlists),
    watchWishlist: new WatchWishlist(wishlists),
    renameWishlist: new RenameWishlist(wishlists),
    deleteWishlist: new DeleteWishlist(wishlists, wishes),
    createWish: new CreateWish(wishlists, wishes, idGenerator, new SystemClock()),
    watchWishesOfWishlist: new WatchWishesOfWishlist(wishes),
    watchWish: new WatchWish(wishes),
    editWish: new EditWish(wishes, wishlists),
    deleteWish: new DeleteWish(wishes, wishlists),
    changeWishState: new ChangeWishState(wishes, wishlists),
  };
}

export type WishlistModule = ReturnType<typeof createWishlistModule>;
