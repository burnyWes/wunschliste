import { describe, expect, it } from 'vitest';
import { hashFor, pageTitleFor, resolveRoute } from './routes';

describe('resolveRoute', () => {
  it.each([
    ['', 'wishlists'],
    ['#/', 'wishlists'],
    ['#/einstellungen', 'settings'],
    ['#/quatsch', 'wishlists'],
  ])('resolves %j to %s', (hash, route) => {
    expect(resolveRoute(hash)).toBe(route);
  });
});

describe('hashFor', () => {
  it('gives the canonical hash of each route', () => {
    expect(hashFor('settings')).toBe('#/einstellungen');
    expect(hashFor('wishlists')).toBe('#/');
  });
});

describe('pageTitleFor', () => {
  it('names the settings page', () => {
    expect(pageTitleFor('settings')).toBe('Einstellungen');
  });

  it('names the wishlists page', () => {
    expect(pageTitleFor('wishlists')).toBe('Wunschlisten');
  });
});
