import { vi } from 'vitest';

const SYNC_TIME_LIMIT_MS = 5000;

export function eventually<T>(assertion: () => T | Promise<T>): Promise<T> {
  return vi.waitFor(assertion, { timeout: SYNC_TIME_LIMIT_MS });
}
