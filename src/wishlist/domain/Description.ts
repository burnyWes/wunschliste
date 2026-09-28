import { characterCount } from './characterCount';
import { invalid, valid, type Parsed } from './parsed';

export type DescriptionProblem = 'tooLong';

const MAXIMUM_CHARACTERS = 2000;

export class Description {
  private constructor(readonly value: string) {}

  static parse(raw: string): Parsed<Description | undefined, DescriptionProblem> {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return valid(undefined);
    }
    if (characterCount(trimmed) > MAXIMUM_CHARACTERS) {
      return invalid('tooLong');
    }
    return valid(new Description(trimmed));
  }
}
