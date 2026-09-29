import { CalendarDate } from '../domain/CalendarDate';
import type { Clock } from '../domain/Clock';

export class SystemClock implements Clock {
  today(): CalendarDate {
    const now = new Date();
    return CalendarDate.of(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
}
