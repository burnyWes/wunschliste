import { characterCount } from './characterCount';
import { invalid, valid, type Parsed } from './parsed';

export type NameProblem = 'missing' | 'tooLong';

const MAXIMUM_CHARACTERS = 100;

export class Name {
  private constructor(readonly value: string) {}

  static parse(raw: string): Parsed<Name, NameProblem> {
    const trimmed = raw.trim();
    if (trimmed === '') {
      return invalid('missing');
    }
    if (characterCount(trimmed) > MAXIMUM_CHARACTERS) {
      return invalid('tooLong');
    }
    return valid(new Name(trimmed));
  }
}
