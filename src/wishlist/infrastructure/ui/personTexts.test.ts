import { describe, expect, it } from 'vitest';
import { personIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { requireValid } from '../../domain/parsed';
import { Person } from '../../domain/Person';
import {
  ownedByLabel,
  ownerChoiceLabel,
  ownerGroupHeading,
  ownerLine,
  PERSON_CREATED_ANNOUNCEMENT,
  profileChosenAnnouncement,
} from './personTexts';

const anna = Person.create(personIdOf('anna'), requireValid(Name.parse('Anna')));

describe('announcements', () => {
  it('names the chosen profile', () => {
    expect(profileChosenAnnouncement('Anna')).toBe('Du bist Anna.');
  });

  it('reports a created person', () => {
    expect(PERSON_CREATED_ANNOUNCEMENT).toBe('Person erstellt.');
  });
});

describe('owner texts', () => {
  it.each([
    [{ owner: anna, isMe: true }, 'Anna (ich)'],
    [{ owner: anna, isMe: false }, 'Anna'],
    [{ owner: undefined, isMe: false }, 'Unbekannt'],
  ])('heads the group of %o as %s', (group, heading) => {
    expect(ownerGroupHeading({ ...group, wishlists: [] })).toBe(heading);
  });

  it('names the owner below the wishlist heading', () => {
    expect(ownerLine(anna, true)).toBe('für mich');
    expect(ownerLine(anna, false)).toBe('für Anna');
  });

  it('marks my own choice', () => {
    expect(ownerChoiceLabel(anna, true)).toBe('Anna (ich)');
    expect(ownerChoiceLabel(anna, false)).toBe('Anna');
  });

  it('names the owner of a wishlist being edited', () => {
    expect(ownedByLabel('Anna')).toBe('Für: Anna');
  });
});
