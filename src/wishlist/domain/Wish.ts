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

  gift(): Wish {
    if (this.gifted) {
      throw new WishAlreadyGifted(this.id);
    }
    return new Wish(this.id, this.wishlistId, this.details, true);
  }

  takeBackGift(): Wish {
    if (!this.gifted) {
      throw new WishNotGifted(this.id);
    }
    return new Wish(this.id, this.wishlistId, this.details, false);
  }
}

export class WishNotFound extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} does not exist.`);
    this.name = 'WishNotFound';
  }
}

export class WishAlreadyGifted extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} has already been gifted.`);
    this.name = 'WishAlreadyGifted';
  }
}

export class WishNotGifted extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} has not been gifted.`);
    this.name = 'WishNotGifted';
  }
}
