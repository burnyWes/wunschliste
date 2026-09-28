import { describe, expect, it } from 'vitest';
import { backTargetFor } from './navigation';

const parent = '#/liste/a';

describe('backTargetFor', () => {
  it('goes back when the entry was opened from the parent page', () => {
    expect(backTargetFor({ entry: 'inApp', cameFrom: parent }, parent)).toBe('back');
  });

  it('falls back when the entry was opened from another page', () => {
    expect(backTargetFor({ entry: 'inApp', cameFrom: '#/wunsch/w' }, parent)).toBe('fallback');
  });

  it.each([{ entry: 'start' }, { entry: 'inApp' }, null, undefined, 'inApp'])(
    'falls back from %j, where going back could leave the app',
    (historyState) => {
      expect(backTargetFor(historyState, parent)).toBe('fallback');
    },
  );
});
