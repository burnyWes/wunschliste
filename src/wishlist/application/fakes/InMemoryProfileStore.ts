import type { PersonId } from '../../domain/ids';
import type { ProfileStore } from '../../domain/ProfileStore';
import type { Unsubscribe } from '../../domain/Unsubscribe';

export class InMemoryProfileStore implements ProfileStore {
  #chosenId: PersonId | undefined;
  readonly #observers = new Set<(id: PersonId | undefined) => void>();

  current(): PersonId | undefined {
    return this.#chosenId;
  }

  choose(id: PersonId): void {
    this.#change(id);
  }

  forget(): void {
    this.#change(undefined);
  }

  watch(onChange: (id: PersonId | undefined) => void): Unsubscribe {
    this.#observers.add(onChange);
    return () => this.#observers.delete(onChange);
  }

  #change(id: PersonId | undefined): void {
    this.#chosenId = id;
    for (const observer of this.#observers) {
      observer(id);
    }
  }
}
