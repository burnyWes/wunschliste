import type { DescriptionProblem } from '../../domain/Description';
import type { NameProblem } from '../../domain/Name';
import type { Price, PriceProblem } from '../../domain/Price';
import type { Rating } from '../../domain/Rating';
import type { WishLinkProblem } from '../../domain/WishLink';

export const NAME_PROBLEM_MESSAGES: Record<NameProblem, string> = {
  missing: 'Bitte einen Namen eingeben.',
  tooLong: 'Der Name darf höchstens 100 Zeichen lang sein.',
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
