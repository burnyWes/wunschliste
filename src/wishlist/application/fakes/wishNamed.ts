import { CalendarDate } from '../../domain/CalendarDate';
import { personIdOf, wishIdOf, wishlistIdOf } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { requireValid } from '../../domain/parsed';
import { Wish, type RestoredWish } from '../../domain/Wish';

export function wishNamed(name: string, state: Partial<RestoredWish> = {}): Wish {
  return Wish.restore({
    id: wishIdOf(name),
    wishlistId: wishlistIdOf('birthday'),
    details: { name: requireValid(Name.parse(name)) },
    createdOn: CalendarDate.of(2026, 9, 29),
    createdBy: personIdOf('anna'),
    secret: false,
    giverId: undefined,
    received: false,
    removedByOwner: false,
    ...state,
  });
}
