import { describe, expect, it } from 'vitest';
import { requireValid } from './parsed';
import { Price } from './Price';

describe('Price.parse', () => {
  it.each([
    ['49', 4900],
    ['49,9', 4990],
    ['49.99', 4999],
    [' 0,01 ', 1],
    ['99999,99', 9999999],
  ])('reads %j as %i cents', (raw, cents) => {
    expect(requireValid(Price.parse(raw))?.cents).toBe(cents);
  });

  it.each(['', '  '])('treats %j as no price', (raw) => {
    expect(Price.parse(raw)).toEqual({ ok: true, value: undefined });
  });

  it.each(['1.299', '49,999', 'abc', '-5', '1 000', ',5'])(
    'reports %j as invalid format',
    (raw) => {
      expect(Price.parse(raw)).toEqual({ ok: false, problem: 'invalidFormat' });
    },
  );

  it.each(['0', '0,00'])('reports %j as not positive', (raw) => {
    expect(Price.parse(raw)).toEqual({ ok: false, problem: 'notPositive' });
  });

  it('reports 100000 as too high', () => {
    expect(Price.parse('100000')).toEqual({ ok: false, problem: 'tooHigh' });
  });
});

describe('Price.ofCents', () => {
  it('restores whole cents', () => {
    expect(requireValid(Price.ofCents(4999)).cents).toBe(4999);
  });

  it.each<[number, string]>([
    [0, 'notPositive'],
    [-1, 'notPositive'],
    [10000000, 'tooHigh'],
    [1.5, 'notWholeCents'],
  ])('rejects %d cents as %s', (cents, problem) => {
    expect(Price.ofCents(cents)).toEqual({ ok: false, problem });
  });
});
