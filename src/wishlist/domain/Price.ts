import { invalid, valid, type Parsed } from './parsed';

export type PriceProblem = 'invalidFormat' | 'notPositive' | 'tooHigh';

export type StoredPriceProblem = 'notPositive' | 'tooHigh' | 'notWholeCents';

const EURO_AMOUNT = /^(\d+)(?:[.,](\d{1,2}))?$/;
const CENTS_PER_EURO = 100;
const MAXIMUM_CENTS = 9_999_999;

function centsOf(euros: string, cents = ''): number {
  return Number(euros) * CENTS_PER_EURO + Number(cents.padEnd(2, '0'));
}

export class Price {
  private constructor(readonly cents: number) {}

  static parse(raw: string): Parsed<Price | undefined, PriceProblem> {
    const amount = raw.trim();
    if (amount === '') {
      return valid(undefined);
    }
    const match = EURO_AMOUNT.exec(amount);
    if (match === null) {
      return invalid('invalidFormat');
    }
    return Price.#ofWholeCents(centsOf(match[1], match[2]));
  }

  static ofCents(cents: number): Parsed<Price, StoredPriceProblem> {
    return Number.isInteger(cents) ? Price.#ofWholeCents(cents) : invalid('notWholeCents');
  }

  static #ofWholeCents(cents: number): Parsed<Price, 'notPositive' | 'tooHigh'> {
    if (cents <= 0) {
      return invalid('notPositive');
    }
    if (cents > MAXIMUM_CENTS) {
      return invalid('tooHigh');
    }
    return valid(new Price(cents));
  }
}
