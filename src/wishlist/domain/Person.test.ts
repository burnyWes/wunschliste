import { describe, expect, it } from 'vitest';
import { personIdOf } from './ids';
import { Name } from './Name';
import { requireValid } from './parsed';
import { Person, personsMeFirst, sortPersons } from './Person';

function nameOf(raw: string): Name {
  return requireValid(Name.parse(raw));
}

function personNamed(raw: string, id = raw): Person {
  return Person.create(personIdOf(id), nameOf(raw));
}

describe('Person', () => {
  it('carries its id and name', () => {
    const anna = personNamed('Anna', 'anna');

    expect(anna.id).toBe('anna');
    expect(anna.name.value).toBe('Anna');
  });

  it('is renamed into a new person with the same id', () => {
    const grandma = personNamed('Oma', 'grandma');

    const renamed = grandma.rename(nameOf('Omi'));

    expect(renamed.id).toBe('grandma');
    expect(renamed.name.value).toBe('Omi');
    expect(grandma.name.value).toBe('Oma');
  });

  it('is restored with its id and name', () => {
    const restored = Person.restore(personIdOf('ben'), nameOf('Ben'));

    expect(restored.id).toBe('ben');
    expect(restored.name.value).toBe('Ben');
  });
});

describe('sortPersons', () => {
  it('sorts alphabetically in German', () => {
    const sorted = sortPersons(['Oma', 'Ärni', 'Anna'].map((name) => personNamed(name)));

    expect(sorted.map((person) => person.name.value)).toEqual(['Anna', 'Ärni', 'Oma']);
  });

  it('orders equal names by id to stay stable', () => {
    const sorted = sortPersons([personNamed('Ben', 'b'), personNamed('Ben', 'a')]);

    expect(sorted.map((person) => person.id)).toEqual(['a', 'b']);
  });
});

describe('personsMeFirst', () => {
  it('puts me first and sorts the others by name', () => {
    const ordered = personsMeFirst(
      ['Oma', 'Ben', 'Anna'].map((name) => personNamed(name)),
      personIdOf('Oma'),
    );

    expect(ordered.map((person) => person.name.value)).toEqual(['Oma', 'Anna', 'Ben']);
  });

  it('only sorts when I am not among the persons', () => {
    const ordered = personsMeFirst(
      ['Oma', 'Anna'].map((name) => personNamed(name)),
      personIdOf('gone'),
    );

    expect(ordered.map((person) => person.name.value)).toEqual(['Anna', 'Oma']);
  });
});
