import type { CalendarDate } from './CalendarDate';

export interface Clock {
  today(): CalendarDate;
}
