export type WatchStatus = 'loading' | 'found' | 'missing' | 'failed';

export class Watched<T> {
  status = $state<WatchStatus>('loading');
  value = $state.raw<T | undefined>();

  show(value: T | undefined): void {
    this.value = value;
    this.status = value === undefined ? 'missing' : 'found';
  }

  fail(): void {
    this.value = undefined;
    this.status = 'failed';
  }
}
