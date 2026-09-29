import { describe, expect, it } from 'vitest';
import { personIdOf, type PersonId } from '../../domain/ids';
import {
  LocalStorageProfileStore,
  PROFILE_STORAGE_KEY,
  type ProfileStorage,
} from './LocalStorageProfileStore';

class MapStorage implements ProfileStorage {
  readonly entries = new Map<string, string>();

  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.entries.set(key, value);
  }

  removeItem(key: string): void {
    this.entries.delete(key);
  }
}

const anna = personIdOf('anna');
const ben = personIdOf('ben');

function storageEvent(key: string, newValue: string | null): Event {
  return Object.assign(new Event('storage'), { key, newValue });
}

function setUp(storage: () => ProfileStorage = () => new MapStorage()) {
  const storageEvents = new EventTarget();
  const store = new LocalStorageProfileStore(storage, storageEvents);
  const reports: (PersonId | undefined)[] = [];
  const unsubscribe = store.watch((id) => reports.push(id));
  return { store, storageEvents, reports, unsubscribe };
}

describe('LocalStorageProfileStore', () => {
  it('keeps the chosen profile in the storage', () => {
    const storage = new MapStorage();
    const { store } = setUp(() => storage);

    store.choose(anna);

    expect(store.current()).toBe('anna');
    expect(storage.getItem(PROFILE_STORAGE_KEY)).toBe('anna');
    expect(new LocalStorageProfileStore(() => storage, new EventTarget()).current()).toBe('anna');
  });

  it('forgets the profile', () => {
    const storage = new MapStorage();
    const { store } = setUp(() => storage);
    store.choose(anna);

    store.forget();

    expect(store.current()).toBeUndefined();
    expect(storage.getItem(PROFILE_STORAGE_KEY)).toBeNull();
  });

  it('tells its observers about each change in this tab', () => {
    const { store, reports } = setUp();

    store.choose(anna);
    store.forget();

    expect(reports).toEqual([anna, undefined]);
  });

  it('follows a change of the profile in another tab', () => {
    const { store, storageEvents, reports } = setUp();

    storageEvents.dispatchEvent(storageEvent(PROFILE_STORAGE_KEY, 'ben'));
    storageEvents.dispatchEvent(storageEvent(PROFILE_STORAGE_KEY, null));

    expect(reports).toEqual([ben, undefined]);
    expect(store.current()).toBeUndefined();
  });

  it('ignores changes of other keys in another tab', () => {
    const { storageEvents, reports } = setUp();

    storageEvents.dispatchEvent(storageEvent('wunschliste.colorScheme', 'light'));

    expect(reports).toEqual([]);
  });

  it('stops telling an observer once unsubscribed', () => {
    const { store, storageEvents, reports, unsubscribe } = setUp();

    unsubscribe();
    store.choose(anna);
    storageEvents.dispatchEvent(storageEvent(PROFILE_STORAGE_KEY, 'ben'));

    expect(reports).toEqual([]);
  });

  it('keeps the profile for the session when the storage cannot be reached', () => {
    const { store, reports } = setUp(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });

    store.choose(anna);

    expect(store.current()).toBe('anna');
    expect(reports).toEqual([anna]);
  });

  it('keeps the profile for the session when the storage refuses to write', () => {
    const refusingStorage: ProfileStorage = {
      getItem: () => null,
      setItem: () => {
        throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
      },
      removeItem: () => {},
    };
    const { store } = setUp(() => refusingStorage);

    store.choose(anna);

    expect(store.current()).toBe('anna');
  });
});
