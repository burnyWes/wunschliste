import type { DescriptionProblem } from '../../domain/Description';
import type { NameProblem } from '../../domain/Name';
import type { Price, PriceProblem } from '../../domain/Price';
import type { Rating } from '../../domain/Rating';
import type { WishDetails, WishDetailsInput } from '../../domain/WishDetails';
import type { WishLinkProblem } from '../../domain/WishLink';

export const NAME_PROBLEM_MESSAGES: Record<NameProblem, string> = {
  missing: 'Bitte einen Namen eingeben.',
  tooLong: 'Der Name darf höchstens 100 Zeichen lang sein.',
};

export type NameFormProblem = NameProblem | 'taken';

export const NAME_FORM_PROBLEM_MESSAGES: Record<NameFormProblem, string> = {
  ...NAME_PROBLEM_MESSAGES,
  taken: 'Diesen Namen gibt es schon.',
};

export const LINK_PROBLEM_MESSAGES: Record<WishLinkProblem, string> = {
  invalid: 'Das ist keine gültige Webadresse.',
};

export const DESCRIPTION_PROBLEM_MESSAGES: Record<DescriptionProblem, string> = {
  tooLong: 'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
};

export const PRICE_PROBLEM_MESSAGES: Record<PriceProblem, string> = {
  invalidFormat: 'Bitte einen Betrag wie 49,99 eingeben.',
  notPositive: 'Der Preis muss größer als 0 sein.',
  tooHigh: 'Der Preis darf höchstens 99.999,99 € betragen.',
};

const RATING_LABELS: Record<Rating, string> = {
  essential: 'unbedingt',
  wanted: 'gern',
  nice: 'nett',
};

const RATING_STARS: Record<Rating, string> = {
  essential: '★★★',
  wanted: '★★',
  nice: '★',
};

const euros = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

const CENTS_PER_EURO = 100;

export function formatPrice(price: Price): string {
  return euros.format(price.cents / CENTS_PER_EURO);
}

export function ratingLabel(rating: Rating): string {
  return RATING_LABELS[rating];
}

export function ratingStars(rating: Rating): string {
  return RATING_STARS[rating];
}

export function wishlistDeletionMessage(name: string, wishCount: number): string {
  if (wishCount === 0) {
    return `„${name}“ wird gelöscht.`;
  }
  const wishes = wishCount === 1 ? '1 Wunsch' : `${wishCount} Wünschen`;
  return `„${name}“ mit ${wishes} wird gelöscht.`;
}

export function wishDeletionMessage(name: string): string {
  return wishlistDeletionMessage(name, 0);
}

export const WISHLIST_CREATED_ANNOUNCEMENT = 'Wunschliste erstellt.';

export const WISH_CREATED_ANNOUNCEMENT = 'Wunsch erstellt.';

export const SAVED_ANNOUNCEMENT = 'Gespeichert.';

export const WISH_GIFTED_ANNOUNCEMENT = 'Als erfüllt markiert.';

export const GIFT_TAKEN_BACK_ANNOUNCEMENT = 'Wieder offen.';

export function wishlistDeletedAnnouncement(name: string): string {
  return `Wunschliste „${name}“ gelöscht.`;
}

export function wishDeletedAnnouncement(name: string): string {
  return `Wunsch „${name}“ gelöscht.`;
}

function priceInputOf(price: Price): string {
  return (price.cents / CENTS_PER_EURO).toFixed(2).replace('.', ',');
}

export function wishDetailsInputOf(details: WishDetails): WishDetailsInput {
  return {
    name: details.name.value,
    link: details.link?.href ?? '',
    description: details.description?.value ?? '',
    price: details.price ? priceInputOf(details.price) : '',
    rating: details.rating,
  };
}

export const LOAD_FAILED_MESSAGE = 'Die Daten konnten nicht geladen werden.';
