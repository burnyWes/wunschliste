import { describe, expect, it } from 'vitest';
import { CalendarDate, InvalidCalendarDate } from './CalendarDate';

describe('CalendarDate', () => {
  it('writes the day as year, month and day with leading zeros', () => {
    expect(CalendarDate.of(2026, 9, 3).isoString).toBe('2026-09-03');
  });

  it('reads a day written as year, month and day', () => {
    const parsed = CalendarDate.parse('2026-09-29');

    expect(parsed.ok && [parsed.value.year, parsed.value.month, parsed.value.day]).toEqual([
      2026, 9, 29,
    ]);
  });

  it.each(['', '29.09.2026', '2026-9-29', '2026-02-30', '2026-13-01', '2026-09-29T10:00'])(
    'reports %j as invalid',
    (raw) => {
      expect(CalendarDate.parse(raw)).toEqual({ ok: false, problem: 'invalid' });
    },
  );

  it('refuses a day that does not exist', () => {
    expect(() => CalendarDate.of(2026, 2, 30)).toThrow(InvalidCalendarDate);
  });

  it('equals another instance of the same day', () => {
    expect(CalendarDate.of(2026, 9, 29)).toEqual(CalendarDate.of(2026, 9, 29));
  });
});
