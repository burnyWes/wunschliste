import { describe, expect, it } from 'vitest';
import { PERSON_CREATED_ANNOUNCEMENT, profileChosenAnnouncement } from './personTexts';

describe('announcements', () => {
  it('names the chosen profile', () => {
    expect(profileChosenAnnouncement('Anna')).toBe('Du bist Anna.');
  });

  it('reports a created person', () => {
    expect(PERSON_CREATED_ANNOUNCEMENT).toBe('Person erstellt.');
  });
});
