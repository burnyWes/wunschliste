import type { CalendarDate } from './CalendarDate';
import type { PersonId, WishId, WishlistId } from './ids';
import { isOwner, type Perspective } from './Perspective';
import { allowedWishActions, type WishAction } from './wishActions';
import type { WishDetails } from './WishDetails';

export type RepeatedGift = { readonly recordedBy: PersonId };

export type WishTraits = { readonly secret: boolean; readonly repeatable: boolean };

export type RestoredWish = {
  id: WishId;
  wishlistId: WishlistId;
  details: WishDetails;
  createdOn: CalendarDate;
  createdBy: PersonId;
  secret: boolean;
  giverId: PersonId | undefined;
  received: boolean;
  removedByOwner: boolean;
  repeatable: boolean;
  gifts: readonly RepeatedGift[];
};

export type NewWish = {
  id: WishId;
  wishlistId: WishlistId;
  details: WishDetails;
  traits: WishTraits;
  createdOn: CalendarDate;
};

export type WishRemoval = { kind: 'delete' } | { kind: 'hideFromOwner'; wish: Wish };

type WishChange = Partial<Pick<RestoredWish, 'giverId' | 'received'>>;

type RepeatedGiftChange = (gifts: readonly RepeatedGift[], me: PersonId) => RepeatedGift[];

function withGiftBy(gifts: readonly RepeatedGift[], me: PersonId): RepeatedGift[] {
  return [...gifts, { recordedBy: me }];
}

function withoutLatestGiftBy(gifts: readonly RepeatedGift[], me: PersonId): RepeatedGift[] {
  const latestOwnGift = gifts.map(({ recordedBy }) => recordedBy).lastIndexOf(me);
  return gifts.filter((_, index) => index !== latestOwnGift);
}

const REPEATED_GIFT_CHANGE_BY_ACTION: Record<WishAction, RepeatedGiftChange> = {
  gift: withGiftBy,
  takeBackGift: withoutLatestGiftBy,
  receive: withGiftBy,
  undoReceive: withoutLatestGiftBy,
  handOver: withGiftBy,
  undoHandOver: withoutLatestGiftBy,
};

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
  readonly createdOn: CalendarDate;
  readonly createdBy: PersonId;
  readonly secret: boolean;
  readonly giverId: PersonId | undefined;
  readonly received: boolean;
  readonly removedByOwner: boolean;
  readonly repeatable: boolean;
  readonly gifts: readonly RepeatedGift[];

  private constructor(state: RestoredWish) {
    this.id = state.id;
    this.wishlistId = state.wishlistId;
    this.details = state.details;
    this.createdOn = state.createdOn;
    this.createdBy = state.createdBy;
    this.secret = state.secret;
    this.giverId = state.giverId;
    this.received = state.received;
    this.removedByOwner = state.removedByOwner;
    this.repeatable = state.repeatable;
    this.gifts = state.gifts;
  }

  static create(
    { id, wishlistId, details, traits, createdOn }: NewWish,
    perspective: Perspective,
  ): Wish {
    ensureCompatible(id, traits);
    if (traits.secret && isOwner(perspective)) {
      throw new OwnerCannotKeepSecrets(id);
    }
    return new Wish({
      id,
      wishlistId,
      details,
      createdOn,
      createdBy: perspective.me,
      secret: traits.secret,
      giverId: undefined,
      received: false,
      removedByOwner: false,
      repeatable: traits.repeatable,
      gifts: [],
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

  edit(details: WishDetails, { secret, repeatable }: WishTraits, perspective: Perspective): Wish {
    if (this.isHiddenFrom(perspective)) {
      throw new WishHiddenFromOwner(this.id);
    }
    ensureCompatible(this.id, { secret, repeatable });
    if (secret && !this.secret) {
      throw new WishCannotBecomeSecret(this.id);
    }
    if (repeatable !== this.repeatable && !canChangeRepeatability(this)) {
      throw new RepeatabilityLocked(this.id);
    }
    return this.#changed({ details, secret, repeatable });
  }

  perform(action: WishAction, perspective: Perspective): Wish {
    const { primary, secondary } = allowedWishActions(this, perspective);
    if (action !== primary && action !== secondary) {
      throw new WishActionNotAllowed(this.id, action);
    }
    if (this.repeatable) {
      return this.#changed({
        gifts: REPEATED_GIFT_CHANGE_BY_ACTION[action](this.gifts, perspective.me),
      });
    }
    return this.#changed(CHANGE_BY_ACTION[action](perspective));
  }

  hasGiftRecordedBy(personId: PersonId): boolean {
    return this.gifts.some(({ recordedBy }) => recordedBy === personId);
  }

  #changed(change: Partial<RestoredWish>): Wish {
    return new Wish({
      id: this.id,
      wishlistId: this.wishlistId,
      details: this.details,
      createdOn: this.createdOn,
      createdBy: this.createdBy,
      secret: this.secret,
      giverId: this.giverId,
      received: this.received,
      removedByOwner: this.removedByOwner,
      repeatable: this.repeatable,
      gifts: this.gifts,
      ...change,
    });
  }
}

function ensureCompatible(id: WishId, { secret, repeatable }: WishTraits): void {
  if (secret && repeatable) {
    throw new WishCannotBeSecretAndRepeatable(id);
  }
}

export function canChangeRepeatability(wish: Wish): boolean {
  return wish.giverId === undefined && !wish.received && wish.gifts.length === 0;
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

export class WishCannotBeSecretAndRepeatable extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} cannot be secret and repeatable at once.`);
    this.name = 'WishCannotBeSecretAndRepeatable';
  }
}

export class RepeatabilityLocked extends Error {
  constructor(readonly wishId: WishId) {
    super(`The wish ${wishId} was already gifted and cannot change its repeatability.`);
    this.name = 'RepeatabilityLocked';
  }
}
