import { describe, expect, it } from 'vitest';
import { personIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { requireValid } from '../../domain/parsed';
import { Person } from '../../domain/Person';
import {
  ownedByLabel,
  ownedWishlistsHint,
  personNotDeletableRightNowHint,
  ownerChoiceLabel,
  ownerGroupHeading,
  ownerLine,
  PERSON_CREATED_ANNOUNCEMENT,
  personDeletedAnnouncement,
  personDeletionMessage,
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

  it('names the deleted person', () => {
    expect(personDeletedAnnouncement('Oma')).toBe('Person „Oma“ gelöscht.');
  });
});

describe('deleting a person', () => {
  it('names the person in the confirmation', () => {
    expect(personDeletionMessage('Oma')).toBe('„Oma“ wird gelöscht.');
  });

  it.each([
    [1, 'Oma gehören noch 1 Wunschliste. Sie kann erst gelöscht werden, wenn sie keine mehr hat.'],
    [2, 'Oma gehören noch 2 Wunschlisten. Sie kann erst gelöscht werden, wenn sie keine mehr hat.'],
  ])('explains why a person with %i wishlists stays', (count, hint) => {
    expect(ownedWishlistsHint('Oma', count)).toBe(hint);
  });
});

describe('owner texts', () => {
  it.each([
    [{ owner: anna, isMe: true }, 'Anna (ich)'],
    [{ owner: anna, isMe: false }, 'Anna'],
    [{ owner: undefined, isMe: false }, 'Unbekannt'],
  ])('heads the group of %o as %s', (group, heading) => {
    expect(ownerGroupHeading({ ...group, entries: [] })).toBe(heading);
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

describe('personNotDeletableRightNowHint', () => {
  it('names the person without giving a reason', () => {
    expect(personNotDeletableRightNowHint('Anna')).toBe('Anna kann gerade nicht gelöscht werden.');
  });
});
