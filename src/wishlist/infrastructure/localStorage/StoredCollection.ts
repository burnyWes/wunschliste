import type { Unsubscribe } from '../../domain/Unsubscribe';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

export type StorageEvents = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;

export type StoredRecord = { readonly id: string };

export type CollectionLocation = {
  storage: KeyValueStorage;
  storageEvents: StorageEvents;
  key: string;
};

export function isObject(candidate: unknown): candidate is Record<string, unknown> {
  return typeof candidate === 'object' && candidate !== null;
}

function keyChangedBy(event: Event): string | null | undefined {
  return 'key' in event ? (event.key as string | null) : undefined;
}

export class StoredCollection<R extends StoredRecord> {
  readonly #location: CollectionLocation;
  readonly #isRecord: (candidate: unknown) => candidate is R;
  readonly #observers = new Set<() => void>();

  constructor(location: CollectionLocation, isRecord: (candidate: unknown) => candidate is R) {
    this.#location = location;
    this.#isRecord = isRecord;
  }

  records(): R[] {
    const stored = this.#location.storage.getItem(this.#location.key);
    if (stored === null) {
      return [];
    }
    try {
      const parsed: unknown = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.filter(this.#isRecord) : [];
    } catch {
      return [];
    }
  }

  put(record: R): void {
    this.#write([...this.records().filter(({ id }) => id !== record.id), record]);
  }

  removeWhere(isRemoved: (record: R) => boolean): void {
    this.#write(this.records().filter((record) => !isRemoved(record)));
  }

  observe(onChange: (records: R[]) => void): Unsubscribe {
    const notify = () => onChange(this.records());
    const notifyOnStorageChange = (event: Event) => {
      if (this.#isAffectedBy(event)) {
        notify();
      }
    };
    this.#observers.add(notify);
    this.#location.storageEvents.addEventListener('storage', notifyOnStorageChange);
    notify();
    return () => {
      this.#observers.delete(notify);
      this.#location.storageEvents.removeEventListener('storage', notifyOnStorageChange);
    };
  }

  #isAffectedBy(event: Event): boolean {
    const changedKey = keyChangedBy(event);
    return changedKey === this.#location.key || changedKey === null;
  }

  #write(records: R[]): void {
    this.#location.storage.setItem(this.#location.key, JSON.stringify(records));
    for (const notify of this.#observers) {
      notify();
    }
  }
}
