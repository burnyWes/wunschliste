import type { WishId, WishlistId } from './ids';
import type { WishDetails } from './WishDetails';

export type RestoredWish = {
  id: WishId;
  wishlistId: WishlistId;
  details: WishDetails;
  gifted: boolean;
};

export class Wish {
  private constructor(
    readonly id: WishId,
    readonly wishlistId: WishlistId,
    readonly details: WishDetails,
    readonly gifted: boolean,
  ) {}

  static create(id: WishId, wishlistId: WishlistId, details: WishDetails): Wish {
    return new Wish(id, wishlistId, details, false);
  }

  static restore({ id, wishlistId, details, gifted }: RestoredWish): Wish {
    return new Wish(id, wishlistId, details, gifted);
  }

  get isOpen(): boolean {
    return !this.gifted;
  }

  edit(details: WishDetails): Wish {
    return new Wish(this.id, this.wishlistId, details, this.gifted);
  }
}

export class WishNotFound extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} does not exist.`);
    this.name = 'WishNotFound';
  }
}
