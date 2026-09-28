import { describe, expect, it } from 'vitest';
import { Description } from './Description';
import { requireValid } from './parsed';

describe('Description.parse', () => {
  it('trims the edges and keeps inner line breaks', () => {
    expect(requireValid(Description.parse('\n Größe M,\ngern Dunkelblau. \n'))?.value).toBe(
      'Größe M,\ngern Dunkelblau.',
    );
  });

  it.each(['', ' \n '])('treats %j as no description', (raw) => {
    expect(Description.parse(raw)).toEqual({ ok: true, value: undefined });
  });

  it('accepts 2000 characters', () => {
    expect(Description.parse('a'.repeat(2000)).ok).toBe(true);
  });

  it('reports 2001 characters as too long', () => {
    expect(Description.parse('a'.repeat(2001))).toEqual({ ok: false, problem: 'tooLong' });
  });
});
