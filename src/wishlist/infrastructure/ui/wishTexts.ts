import type { BrandProblem } from '../../domain/Brand';
import type { CalendarDate } from '../../domain/CalendarDate';
import type { DescriptionProblem } from '../../domain/Description';
import type { NameProblem } from '../../domain/Name';
import type { Price, PriceProblem } from '../../domain/Price';
import type { Rating } from '../../domain/Rating';
import type { WishAction } from '../../domain/wishActions';
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

export const BRAND_PROBLEM_MESSAGES: Record<BrandProblem, string> = {
  tooLong: 'Die Marke darf höchstens 100 Zeichen lang sein.',
};

export const BRAND_PREFIX = 'Marke: ';

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

const longDates = new Intl.DateTimeFormat('de-DE', { dateStyle: 'long', timeZone: 'UTC' });

export function wishedSinceNote(date: CalendarDate): string {
  return `gewünscht seit ${longDates.format(Date.UTC(date.year, date.month - 1, date.day))}`;
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

export const WISH_ACTION_LABELS: Record<WishAction, string> = {
  gift: 'Schenken',
  takeBackGift: 'Schenken zurücknehmen',
  receive: 'Erhalten',
  undoReceive: 'Erhalten zurücknehmen',
  handOver: 'Übergeben',
  undoHandOver: 'Übergabe zurücknehmen',
};

export const WISH_ACTION_ANNOUNCEMENTS: Record<WishAction, string> = {
  gift: 'Als geschenkt markiert.',
  takeBackGift: 'Schenken zurückgenommen.',
  receive: 'Als erhalten markiert.',
  undoReceive: 'Wieder offen.',
  handOver: 'Übergabe vermerkt.',
  undoHandOver: 'Übergabe zurückgenommen.',
};

export function fulfilledNote(giverName?: string): string {
  return giverName === undefined ? 'Erfüllt' : `Erfüllt – von ${giverName}`;
}

export function giverNote(giverName: string): string {
  return `geschenkt von ${giverName}`;
}

export function secretNote(creatorName?: string): string {
  return creatorName === undefined ? 'Geheim' : `Geheim – von ${creatorName}`;
}

export function secretHint(ownerName: string): string {
  return `${ownerName} sieht nur „Überraschung“.`;
}

export function wishRemovedByOwnerMessage(ownerName?: string): string {
  return `${ownerName ?? 'Die Besitzerin'} hat diesen Wunsch entfernt.`;
}

export function wishlistRemovedByOwnerMessage(ownerName?: string): string {
  return `${ownerName ?? 'Die Besitzerin'} hat diese Wunschliste entfernt.`;
}

export function removedByOwnerNote(ownerName?: string): string {
  return `von ${ownerName ?? 'der Besitzerin'} entfernt`;
}

export const FINAL_DELETION_LABEL = 'Endgültig löschen';

export function surpriseLine(count: number): string {
  return count === 1 ? '1 Überraschung' : `${count} Überraschungen`;
}

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
    brand: details.brand?.value ?? '',
    link: details.link?.href ?? '',
    description: details.description?.value ?? '',
    price: details.price ? priceInputOf(details.price) : '',
    rating: details.rating,
  };
}

export const LOAD_FAILED_MESSAGE = 'Die Daten konnten nicht geladen werden.';
