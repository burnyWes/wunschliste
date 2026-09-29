import { Description } from '../../domain/Description';
import { wishIdOf, wishlistIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { valid } from '../../domain/parsed';
import { Price } from '../../domain/Price';
import { isRating, type Rating } from '../../domain/Rating';
import { Wish } from '../../domain/Wish';
import type { WishDetails } from '../../domain/WishDetails';
import { WishLink } from '../../domain/WishLink';
import { isObject } from './isObject';

export type WishDocument = {
  wishlistId: string;
  name: string;
  link?: string;
  description?: string;
  priceInCents?: number;
  rating?: Rating;
  gifted: boolean;
};

function isOptional(value: unknown, type: 'string' | 'number'): boolean {
  return value === undefined || typeof value === type;
}

function isWishDocument(candidate: unknown): candidate is WishDocument {
  return (
    isObject(candidate) &&
    typeof candidate.wishlistId === 'string' &&
    typeof candidate.name === 'string' &&
    isOptional(candidate.link, 'string') &&
    isOptional(candidate.description, 'string') &&
    isOptional(candidate.priceInCents, 'number') &&
    (candidate.rating === undefined || isRating(candidate.rating)) &&
    typeof candidate.gifted === 'boolean'
  );
}

function detailsOf(document: WishDocument): WishDetails | undefined {
  const name = Name.parse(document.name);
  const link = WishLink.parse(document.link ?? '');
  const description = Description.parse(document.description ?? '');
  const price =
    document.priceInCents === undefined ? valid(undefined) : Price.ofCents(document.priceInCents);
  if (!name.ok || !link.ok || !description.ok || !price.ok) {
    return undefined;
  }
  return {
    name: name.value,
    link: link.value,
    description: description.value,
    price: price.value,
    rating: document.rating,
  };
}

export function toWishDocument({ wishlistId, details, gifted }: Wish): WishDocument {
  return {
    wishlistId,
    name: details.name.value,
    ...(details.link && { link: details.link.href }),
    ...(details.description && { description: details.description.value }),
    ...(details.price && { priceInCents: details.price.cents }),
    ...(details.rating && { rating: details.rating }),
    gifted,
  };
}

export function wishFromDocument(id: string, data: unknown): Wish | undefined {
  if (!isWishDocument(data)) {
    return undefined;
  }
  const details = detailsOf(data);
  return (
    details &&
    Wish.restore({
      id: wishIdOf(id),
      wishlistId: wishlistIdOf(data.wishlistId),
      details,
      gifted: data.gifted,
    })
  );
}
