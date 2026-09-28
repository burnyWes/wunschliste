import type { KeyValueStorage } from './StoredCollection';

export class MapStorage implements KeyValueStorage {
  readonly #items = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#items.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#items.set(key, value);
  }
}

export function storageEventFor(key: string | null): Event {
  return Object.assign(new Event('storage'), { key });
}
