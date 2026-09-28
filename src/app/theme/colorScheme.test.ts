import { describe, expect, it } from 'vitest';
import { COLOR_SCHEMES, parseColorScheme } from './colorScheme';

describe('parseColorScheme', () => {
  it('falls back to dark when nothing is stored', () => {
    expect(parseColorScheme(null)).toBe('dark');
  });

  it.each(['dark', 'light', 'inverted'])('accepts the stored scheme %s', (stored) => {
    expect(parseColorScheme(stored)).toBe(stored);
  });

  it('falls back to dark for an unknown value', () => {
    expect(parseColorScheme('purple')).toBe('dark');
  });
});

describe('COLOR_SCHEMES', () => {
  it('offers dark, light and inverted in this order', () => {
    expect(COLOR_SCHEMES.map(({ label }) => label)).toEqual(['Dunkel', 'Hell', 'Invertiert']);
  });
});
