import type { Unsubscribe } from '../../domain/Unsubscribe';

type Observer = { onChange: () => void; onFailure: () => void };

export class ObservableMap<K, V> {
  readonly #entries = new Map<K, V>();
  readonly #observers = new Set<Observer>();

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

  observe(onChange: () => void, onFailure: () => void): Unsubscribe {
    const observer = { onChange, onFailure };
    this.#observers.add(observer);
    onChange();
    return () => this.#observers.delete(observer);
  }

  failObservers(): void {
    for (const { onFailure } of this.#observers) {
      onFailure();
    }
  }

  #notifyObservers(): void {
    for (const { onChange } of this.#observers) {
      onChange();
    }
  }
}
