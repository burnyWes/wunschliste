import { describe, expect, it } from 'vitest';
import { personIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Person } from './Person';
import { ensureNameIsFree, PersonNameTaken } from './personRules';

function nameOf(raw: string): Name {
  return requireValid(Name.parse(raw));
}

const anna = Person.create(personIdOf('anna'), nameOf('Anna'));
const ben = Person.create(personIdOf('ben'), nameOf('Ben'));
const persons = [anna, ben];

describe('ensureNameIsFree', () => {
  it('accepts a name nobody has', () => {
    expect(() => ensureNameIsFree(nameOf('Oma'), persons)).not.toThrow();
  });

  it('rejects a name that differs only in case', () => {
    expect(() => ensureNameIsFree(nameOf('ben'), persons)).toThrow(PersonNameTaken);
  });

  it('treats a name with an accent as another name', () => {
    expect(() => ensureNameIsFree(nameOf('Bén'), persons)).not.toThrow();
  });

  it('lets a person keep its own name in another spelling', () => {
    expect(() => ensureNameIsFree(nameOf('BEN'), persons, ben.id)).not.toThrow();
  });

  it('rejects the name of another person when renaming', () => {
    expect(() => ensureNameIsFree(nameOf('Anna'), persons, ben.id)).toThrow(PersonNameTaken);
  });
});
