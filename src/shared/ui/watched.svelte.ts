export type WatchStatus = 'loading' | 'found' | 'missing';

export class Watched<T> {
  status = $state<WatchStatus>('loading');
  value = $state.raw<T | undefined>();

  show(value: T | undefined): void {
    this.value = value;
    this.status = value === undefined ? 'missing' : 'found';
  }
}
