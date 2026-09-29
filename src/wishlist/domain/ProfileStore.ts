import type { PersonId } from './ids';
import type { Unsubscribe } from './Unsubscribe';

export interface ProfileStore {
  current(): PersonId | undefined;
  choose(id: PersonId): void;
  forget(): void;
  watch(onChange: (id: PersonId | undefined) => void): Unsubscribe;
}
