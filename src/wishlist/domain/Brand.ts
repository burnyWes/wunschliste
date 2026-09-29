import { characterCount } from './characterCount';
import { invalid, valid, type Parsed } from './parsed';

export type BrandProblem = 'tooLong';

const MAXIMUM_CHARACTERS = 100;

export class Brand {
  private constructor(readonly value: string) {}

  static parse(raw: string): Parsed<Brand | undefined, BrandProblem> {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return valid(undefined);
    }
    if (characterCount(trimmed) > MAXIMUM_CHARACTERS) {
      return invalid('tooLong');
    }
    return valid(new Brand(trimmed));
  }
}
