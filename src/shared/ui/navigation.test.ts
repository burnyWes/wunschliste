import { describe, expect, it } from 'vitest';
import { backTargetFor } from './navigation';

describe('backTargetFor', () => {
  it('goes back from an entry created inside the app', () => {
    expect(backTargetFor({ entry: 'inApp' })).toBe('back');
  });

  it.each([{ entry: 'start' }, null, undefined, 'inApp'])(
    'falls back from %j, where going back could leave the app',
    (historyState) => {
      expect(backTargetFor(historyState)).toBe('fallback');
    },
  );
});
