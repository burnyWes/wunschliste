import type { Unsubscribe } from '../../domain/Unsubscribe';

export class ObservableMap<K, V> {
  readonly #entries = new Map<K, V>();
  readonly #observers = new Set<() => void>();

  values(): V[] {
    return [...this.#entries.values()];
  }

  get(key: K): V | undefined {
    return this.#entries.get(key);
  }

  set(key: K, value: V): void {
    this.#entries.set(key, value);
    this.#notifyObservers();
  }

  delete(key: K): void {
    this.#entries.delete(key);
    this.#notifyObservers();
  }

  deleteWhere(isDeleted: (value: V) => boolean): void {
    for (const [key, value] of this.#entries) {
      if (isDeleted(value)) {
        this.#entries.delete(key);
      }
    }
    this.#notifyObservers();
  }

  observe(onChange: () => void): Unsubscribe {
    this.#observers.add(onChange);
    onChange();
    return () => this.#observers.delete(onChange);
  }

  #notifyObservers(): void {
    for (const notify of this.#observers) {
      notify();
    }
  }
}
