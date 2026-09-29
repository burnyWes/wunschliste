import type { PersonId, WishId, WishlistId } from './ids';
import { isOwner, type Perspective } from './Perspective';
import { allowedWishActions, type WishAction } from './wishActions';
import type { WishDetails } from './WishDetails';

export type RestoredWish = {
  id: WishId;
  wishlistId: WishlistId;
  details: WishDetails;
  createdBy: PersonId;
  secret: boolean;
  giverId: PersonId | undefined;
  received: boolean;
  removedByOwner: boolean;
};

export type NewWish = {
  id: WishId;
  wishlistId: WishlistId;
  details: WishDetails;
  secret: boolean;
};

export type WishRemoval = { kind: 'delete' } | { kind: 'hideFromOwner'; wish: Wish };

type WishChange = Partial<Pick<RestoredWish, 'giverId' | 'received'>>;

const CHANGE_BY_ACTION: Record<WishAction, (perspective: Perspective) => WishChange> = {
  gift: ({ me }) => ({ giverId: me }),
  takeBackGift: () => ({ giverId: undefined }),
  receive: () => ({ received: true }),
  undoReceive: () => ({ received: false }),
  handOver: () => ({ received: true }),
  undoHandOver: () => ({ received: false }),
};

export class Wish {
  readonly id: WishId;
  readonly wishlistId: WishlistId;
  readonly details: WishDetails;
  readonly createdBy: PersonId;
  readonly secret: boolean;
  readonly giverId: PersonId | undefined;
  readonly received: boolean;
  readonly removedByOwner: boolean;

  private constructor(state: RestoredWish) {
    this.id = state.id;
    this.wishlistId = state.wishlistId;
    this.details = state.details;
    this.createdBy = state.createdBy;
    this.secret = state.secret;
    this.giverId = state.giverId;
    this.received = state.received;
    this.removedByOwner = state.removedByOwner;
  }

  static create({ id, wishlistId, details, secret }: NewWish, perspective: Perspective): Wish {
    if (secret && isOwner(perspective)) {
      throw new OwnerCannotKeepSecrets(id);
    }
    return new Wish({
      id,
      wishlistId,
      details,
      createdBy: perspective.me,
      secret,
      giverId: undefined,
      received: false,
      removedByOwner: false,
    });
  }

  static restore(state: RestoredWish): Wish {
    return new Wish(state);
  }

  get keepsSecretFromOwner(): boolean {
    return !this.received && (this.secret || this.giverId !== undefined);
  }

  isRemovedFor(perspective: Perspective): boolean {
    return perspective.wishlistIsHidden || (isOwner(perspective) && this.removedByOwner);
  }

  isSurpriseFor(perspective: Perspective): boolean {
    return isOwner(perspective) && this.secret && !this.received;
  }

  isHiddenFrom(perspective: Perspective): boolean {
    return this.isRemovedFor(perspective) || this.isSurpriseFor(perspective);
  }

  removeFor(perspective: Perspective): WishRemoval {
    if (this.isHiddenFrom(perspective)) {
      throw new WishHiddenFromOwner(this.id);
    }
    if (isOwner(perspective) && this.keepsSecretFromOwner) {
      return { kind: 'hideFromOwner', wish: this.#changed({ removedByOwner: true }) };
    }
    return { kind: 'delete' };
  }

  edit(details: WishDetails, secret: boolean, perspective: Perspective): Wish {
    if (this.isHiddenFrom(perspective)) {
      throw new WishHiddenFromOwner(this.id);
    }
    if (secret && !this.secret) {
      throw new WishCannotBecomeSecret(this.id);
    }
    return this.#changed({ details, secret });
  }

  perform(action: WishAction, perspective: Perspective): Wish {
    const { primary, secondary } = allowedWishActions(this, perspective);
    if (action !== primary && action !== secondary) {
      throw new WishActionNotAllowed(this.id, action);
    }
    return this.#changed(CHANGE_BY_ACTION[action](perspective));
  }

  #changed(change: Partial<RestoredWish>): Wish {
    return new Wish({
      id: this.id,
      wishlistId: this.wishlistId,
      details: this.details,
      createdBy: this.createdBy,
      secret: this.secret,
      giverId: this.giverId,
      received: this.received,
      removedByOwner: this.removedByOwner,
      ...change,
    });
  }
}

export class WishNotFound extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} does not exist.`);
    this.name = 'WishNotFound';
  }
}

export class WishActionNotAllowed extends Error {
  constructor(
    readonly wishId: WishId,
    readonly action: WishAction,
  ) {
    super(`The action ${action} is not allowed on the wish ${wishId}.`);
    this.name = 'WishActionNotAllowed';
  }
}

export class OwnerCannotKeepSecrets extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} cannot be kept secret in the own wishlist.`);
    this.name = 'OwnerCannotKeepSecrets';
  }
}

export class WishCannotBecomeSecret extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} was visible and cannot become secret.`);
    this.name = 'WishCannotBecomeSecret';
  }
}

export class WishHiddenFromOwner extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} is hidden from the owner.`);
    this.name = 'WishHiddenFromOwner';
  }
}
