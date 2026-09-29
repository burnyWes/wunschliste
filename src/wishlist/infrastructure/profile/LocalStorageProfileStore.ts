import { personIdOf, type PersonId } from '../../domain/ids';
import type { ProfileStore } from '../../domain/ProfileStore';
import type { Unsubscribe } from '../../domain/Unsubscribe';

export const PROFILE_STORAGE_KEY = 'wunschliste.profile';

export type ProfileStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

type ProfileObserver = (id: PersonId | undefined) => void;

function personIdIn(storedValue: string | null | undefined): PersonId | undefined {
  return storedValue ? personIdOf(storedValue) : undefined;
}

export class LocalStorageProfileStore implements ProfileStore {
  readonly #storage: () => ProfileStorage;
  readonly #storageEvents: EventTarget;
  readonly #observers = new Set<ProfileObserver>();
  #sessionProfile: PersonId | undefined;

  constructor(storage: () => ProfileStorage, storageEvents: EventTarget = window) {
    this.#storage = storage;
    this.#storageEvents = storageEvents;
    this.#sessionProfile = personIdIn(
      this.#useStorage((storage) => storage.getItem(PROFILE_STORAGE_KEY)),
    );
  }

  current(): PersonId | undefined {
    return this.#sessionProfile;
  }

  choose(id: PersonId): void {
    this.#useStorage((storage) => storage.setItem(PROFILE_STORAGE_KEY, id));
    this.#change(id);
  }

  forget(): void {
    this.#useStorage((storage) => storage.removeItem(PROFILE_STORAGE_KEY));
    this.#change(undefined);
  }

  watch(onChange: ProfileObserver): Unsubscribe {
    const followOtherTabs = (event: Event) => {
      const { key, newValue } = event as StorageEvent;
      if (key === PROFILE_STORAGE_KEY) {
        this.#sessionProfile = personIdIn(newValue);
        onChange(this.#sessionProfile);
      }
    };
    this.#observers.add(onChange);
    this.#storageEvents.addEventListener('storage', followOtherTabs);
    return () => {
      this.#observers.delete(onChange);
      this.#storageEvents.removeEventListener('storage', followOtherTabs);
    };
  }

  #useStorage<T>(action: (storage: ProfileStorage) => T): T | undefined {
    try {
      return action(this.#storage());
    } catch {
      // Storage can be unavailable (e.g. blocked site data); the profile then lasts only for this
      // session. https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage#exceptions
      return undefined;
    }
  }

  #change(id: PersonId | undefined): void {
    this.#sessionProfile = id;
    for (const observer of this.#observers) {
      observer(id);
    }
  }
}
