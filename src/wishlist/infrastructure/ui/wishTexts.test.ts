import { describe, expect, it } from 'vitest';
import { requireValid } from '../../domain/parsed';
import { parseWishDetails } from '../../domain/WishDetails';
import { Price } from '../../domain/Price';
import {
  DESCRIPTION_PROBLEM_MESSAGES,
  GIFT_TAKEN_BACK_ANNOUNCEMENT,
  SAVED_ANNOUNCEMENT,
  WISH_CREATED_ANNOUNCEMENT,
  WISH_GIFTED_ANNOUNCEMENT,
  WISHLIST_CREATED_ANNOUNCEMENT,
  formatPrice,
  LINK_PROBLEM_MESSAGES,
  NAME_FORM_PROBLEM_MESSAGES,
  NAME_PROBLEM_MESSAGES,
  PRICE_PROBLEM_MESSAGES,
  ratingLabel,
  ratingStars,
  wishDeletedAnnouncement,
  wishDeletionMessage,
  wishDetailsInputOf,
  wishlistDeletedAnnouncement,
  wishlistDeletionMessage,
} from './wishTexts';

describe('formatPrice', () => {
  it('shows euros with a comma and a non-breaking space before the sign', () => {
    expect(formatPrice(requireValid(Price.ofCents(4999)))).toBe('49,99 €');
  });

  it('groups thousands', () => {
    expect(formatPrice(requireValid(Price.ofCents(9999999)))).toBe('99.999,99 €');
  });
});

describe('ratings', () => {
  it.each([
    ['essential', 'unbedingt', '★★★'],
    ['wanted', 'gern', '★★'],
    ['nice', 'nett', '★'],
  ] as const)('names %s as %s with %s', (rating, label, stars) => {
    expect(ratingLabel(rating)).toBe(label);
    expect(ratingStars(rating)).toBe(stars);
  });
});

describe('problem messages', () => {
  it('explains every problem of the form', () => {
    expect(NAME_PROBLEM_MESSAGES).toEqual({
      missing: 'Bitte einen Namen eingeben.',
      tooLong: 'Der Name darf höchstens 100 Zeichen lang sein.',
    });
    expect(NAME_FORM_PROBLEM_MESSAGES).toEqual({
      ...NAME_PROBLEM_MESSAGES,
      taken: 'Diesen Namen gibt es schon.',
    });
    expect(LINK_PROBLEM_MESSAGES).toEqual({ invalid: 'Das ist keine gültige Webadresse.' });
    expect(DESCRIPTION_PROBLEM_MESSAGES).toEqual({
      tooLong: 'Die Beschreibung darf höchstens 2000 Zeichen lang sein.',
    });
    expect(PRICE_PROBLEM_MESSAGES).toEqual({
      invalidFormat: 'Bitte einen Betrag wie 49,99 eingeben.',
      notPositive: 'Der Preis muss größer als 0 sein.',
      tooHigh: 'Der Preis darf höchstens 99.999,99 € betragen.',
    });
  });
});

describe('deletion messages', () => {
  it.each([
    [0, '„Geburtstag“ wird gelöscht.'],
    [1, '„Geburtstag“ mit 1 Wunsch wird gelöscht.'],
    [5, '„Geburtstag“ mit 5 Wünschen wird gelöscht.'],
  ])('names a wishlist with %i wishes', (wishCount, message) => {
    expect(wishlistDeletionMessage('Geburtstag', wishCount)).toBe(message);
  });

  it('names the wish', () => {
    expect(wishDeletionMessage('Fahrradhelm')).toBe('„Fahrradhelm“ wird gelöscht.');
  });
});

describe('announcements', () => {
  it('reports each finished action', () => {
    expect(WISHLIST_CREATED_ANNOUNCEMENT).toBe('Wunschliste erstellt.');
    expect(WISH_CREATED_ANNOUNCEMENT).toBe('Wunsch erstellt.');
    expect(SAVED_ANNOUNCEMENT).toBe('Gespeichert.');
    expect(WISH_GIFTED_ANNOUNCEMENT).toBe('Als erfüllt markiert.');
    expect(GIFT_TAKEN_BACK_ANNOUNCEMENT).toBe('Wieder offen.');
  });

  it('names the deleted wishlist', () => {
    expect(wishlistDeletedAnnouncement('Geburtstag')).toBe('Wunschliste „Geburtstag“ gelöscht.');
  });

  it('names the deleted wish', () => {
    expect(wishDeletedAnnouncement('Fahrradhelm')).toBe('Wunsch „Fahrradhelm“ gelöscht.');
  });
});

describe('wishDetailsInputOf', () => {
  it.each([
    {
      name: 'Fahrradhelm',
      link: 'https://amazon.de/helm',
      description: 'Größe M',
      price: '49,99',
      rating: 'essential' as const,
    },
    { name: 'Buch', link: '', description: '', price: '12,00', rating: undefined },
  ])('fills the form so that saving it unchanged keeps $name', (input) => {
    const parsed = parseWishDetails(input);
    if (!parsed.ok) {
      throw new Error('Invalid test input');
    }

    expect(wishDetailsInputOf(parsed.details)).toEqual(input);
  });
});
