import type { CalendarDate } from '../../domain/CalendarDate';
import type { Clock } from '../../domain/Clock';

export class FixedClock implements Clock {
  constructor(private readonly date: CalendarDate) {}

  today(): CalendarDate {
    return this.date;
  }
}
