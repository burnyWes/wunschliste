import { invalid, valid, type Parsed } from './parsed';

export type CalendarDateProblem = 'invalid';

const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})$/;

function exists(year: number, month: number, day: number): boolean {
  const utc = new Date(Date.UTC(year, month - 1, day));
  return (
    utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day
  );
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0');
}

export class CalendarDate {
  private constructor(
    readonly year: number,
    readonly month: number,
    readonly day: number,
  ) {}

  static of(year: number, month: number, day: number): CalendarDate {
    if (!exists(year, month, day)) {
      throw new InvalidCalendarDate(year, month, day);
    }
    return new CalendarDate(year, month, day);
  }

  static parse(raw: string): Parsed<CalendarDate, CalendarDateProblem> {
    const match = ISO_DAY.exec(raw);
    if (match === null) {
      return invalid('invalid');
    }
    const [year, month, day] = match.slice(1).map(Number);
    if (!exists(year, month, day)) {
      return invalid('invalid');
    }
    return valid(new CalendarDate(year, month, day));
  }

  get isoString(): string {
    return `${this.year}-${twoDigits(this.month)}-${twoDigits(this.day)}`;
  }
}

export class InvalidCalendarDate extends Error {
  constructor(year: number, month: number, day: number) {
    super(`The day ${year}-${month}-${day} does not exist.`);
    this.name = 'InvalidCalendarDate';
  }
}
