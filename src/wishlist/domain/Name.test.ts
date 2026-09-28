import { describe, expect, it } from 'vitest';
import { Name } from './Name';

function parsedValueOf(raw: string): string | undefined {
  const parsed = Name.parse(raw);
  return parsed.ok ? parsed.value.value : undefined;
}

describe('Name.parse', () => {
  it('trims surrounding whitespace', () => {
    expect(parsedValueOf('  Geburtstag  ')).toBe('Geburtstag');
  });

  it.each(['', '   '])('reports %j as missing', (raw) => {
    expect(Name.parse(raw)).toEqual({ ok: false, problem: 'missing' });
  });

  it('accepts 100 characters', () => {
    expect(parsedValueOf('a'.repeat(100))).toHaveLength(100);
  });

  it('reports 101 characters as too long', () => {
    expect(Name.parse('a'.repeat(101))).toEqual({ ok: false, problem: 'tooLong' });
  });

  it('counts each emoji as one character', () => {
    expect(Name.parse('🎁'.repeat(100)).ok).toBe(true);
    expect(Name.parse('🎁'.repeat(101)).ok).toBe(false);
  });
});
