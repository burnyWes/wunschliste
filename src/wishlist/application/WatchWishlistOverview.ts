import type { PersonId } from '../domain/ids';
import type { Person } from '../domain/Person';
import type { PersonRepository } from '../domain/PersonRepository';
import type { Unsubscribe } from '../domain/Unsubscribe';
import type { Wish } from '../domain/Wish';
import type { Wishlist } from '../domain/Wishlist';
import { groupWishlistsByOwner, type WishlistGroup } from '../domain/wishlistOverview';
import type { WishlistRepository } from '../domain/WishlistRepository';
import type { WishRepository } from '../domain/WishRepository';

export class WatchWishlistOverview {
  constructor(
    private readonly wishlists: WishlistRepository,
    private readonly persons: PersonRepository,
    private readonly wishes: WishRepository,
  ) {}

  execute(
    me: PersonId,
    onChange: (groups: readonly WishlistGroup[]) => void,
    onFailure: () => void,
  ): Unsubscribe {
    let knownWishlists: readonly Wishlist[] | undefined;
    let knownPersons: readonly Person[] | undefined;
    let knownWishes: readonly Wish[] | undefined;
    const reportGroups = () => {
      if (knownWishlists !== undefined && knownPersons !== undefined && knownWishes !== undefined) {
        onChange(groupWishlistsByOwner(knownWishlists, knownPersons, knownWishes, me));
      }
    };
    const stopWatchingWishlists = this.wishlists.watchAll((wishlists) => {
      knownWishlists = wishlists;
      reportGroups();
    }, onFailure);
    const stopWatchingPersons = this.persons.watchAll((persons) => {
      knownPersons = persons;
      reportGroups();
    }, onFailure);
    const stopWatchingWishes = this.wishes.watchAll((wishes) => {
      knownWishes = wishes;
      reportGroups();
    }, onFailure);
    return () => {
      stopWatchingWishlists();
      stopWatchingPersons();
      stopWatchingWishes();
    };
  }
}
