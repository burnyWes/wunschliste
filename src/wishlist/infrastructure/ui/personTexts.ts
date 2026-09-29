import type { Person } from '../../domain/Person';
import type { WishlistGroup } from '../../domain/wishlistOverview';

export function profileChosenAnnouncement(name: string): string {
  return `Du bist ${name}.`;
}

export const PERSON_CREATED_ANNOUNCEMENT = 'Person erstellt.';

export function ownerChoiceLabel(person: Person, isMe: boolean): string {
  return isMe ? `${person.name.value} (ich)` : person.name.value;
}

export function ownerGroupHeading({ owner, isMe }: WishlistGroup): string {
  return owner ? ownerChoiceLabel(owner, isMe) : 'Unbekannt';
}

export function ownerLine(owner: Person, isMe: boolean): string {
  return isMe ? 'für mich' : `für ${owner.name.value}`;
}

export function ownedByLabel(name: string): string {
  return `Für: ${name}`;
}
