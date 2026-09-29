import { personIdOf, wishlistIdOf, type PersonId } from '../../domain/ids';
import { Name } from '../../domain/Name';
import { requireValid } from '../../domain/parsed';
import { Wishlist } from '../../domain/Wishlist';

export function wishlistNamed(
  name: string,
  id = name,
  ownerId: PersonId = personIdOf('anna'),
): Wishlist {
  return Wishlist.create(wishlistIdOf(id), requireValid(Name.parse(name)), ownerId);
}
