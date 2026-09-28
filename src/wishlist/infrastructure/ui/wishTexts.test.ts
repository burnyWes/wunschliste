import { describe, expect, it } from 'vitest';
import { requireValid } from '../../domain/parsed';
import { Price } from '../../domain/Price';
import {
  DESCRIPTION_PROBLEM_MESSAGES,
  formatPrice,
  LINK_PROBLEM_MESSAGES,
  NAME_PROBLEM_MESSAGES,
  PRICE_PROBLEM_MESSAGES,
  ratingLabel,
  ratingStars,
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
