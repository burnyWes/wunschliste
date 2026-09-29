import { describe, expect, it } from 'vitest';
import { Brand } from './Brand';

function parsedValueOf(raw: string): string | undefined {
  const parsed = Brand.parse(raw);
  return parsed.ok ? parsed.value?.value : undefined;
}

describe('Brand.parse', () => {
  it('trims surrounding whitespace', () => {
    expect(parsedValueOf('  Uvex  ')).toBe('Uvex');
  });

  it.each(['', '   '])('treats %j as no brand', (raw) => {
    expect(Brand.parse(raw)).toEqual({ ok: true, value: undefined });
  });

  it('accepts 100 characters', () => {
    expect(parsedValueOf('a'.repeat(100))).toHaveLength(100);
  });

  it('reports 101 characters as too long', () => {
    expect(Brand.parse('a'.repeat(101))).toEqual({ ok: false, problem: 'tooLong' });
  });

  it('counts each emoji as one character', () => {
    expect(Brand.parse('🎁'.repeat(100)).ok).toBe(true);
    expect(Brand.parse('🎁'.repeat(101)).ok).toBe(false);
  });
});
