import type { Person } from '../../domain/Person';
import type { WishlistGroup } from '../../domain/wishlistOverview';

export function profileChosenAnnouncement(name: string): string {
  return `Du bist ${name}.`;
}

export const PERSON_CREATED_ANNOUNCEMENT = 'Person erstellt.';

export function personDeletedAnnouncement(name: string): string {
  return `Person „${name}“ gelöscht.`;
}

export function personDeletionMessage(name: string): string {
  return `„${name}“ wird gelöscht.`;
}

export function ownedWishlistsHint(name: string, wishlistCount: number): string {
  const wishlists = wishlistCount === 1 ? '1 Wunschliste' : `${wishlistCount} Wunschlisten`;
  return `${name} gehören noch ${wishlists}. Sie kann erst gelöscht werden, wenn sie keine mehr hat.`;
}

export function personNotDeletableRightNowHint(name: string): string {
  return `${name} kann gerade nicht gelöscht werden.`;
}

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
