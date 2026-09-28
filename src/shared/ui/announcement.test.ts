import { describe, expect, it } from 'vitest';
import { announcementText } from './announcement';

const REPETITION_MARKER = '​';

describe('announcementText', () => {
  it('stays empty while nothing has been announced', () => {
    expect(announcementText('', 0)).toBe('');
  });

  it('carries the text unchanged on an even repetition', () => {
    expect(announcementText('Gespeichert.', 2)).toBe('Gespeichert.');
  });

  it('marks the text on an odd repetition so the same text is read again', () => {
    expect(announcementText('Gespeichert.', 1)).toBe(`Gespeichert.${REPETITION_MARKER}`);
  });
});
