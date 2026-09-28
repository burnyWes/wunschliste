import type { Page } from '@playwright/test';

export type WishlistRecord = { id: string; name: string };

export type WishRecord = {
  id: string;
  wishlistId: string;
  name: string;
  link?: string;
  description?: string;
  priceInCents?: number;
  rating?: 'essential' | 'wanted' | 'nice';
  gifted: boolean;
};

export type SeedData = { wishlists?: WishlistRecord[]; wishes?: WishRecord[] };

const STORAGE_KEYS: Record<keyof SeedData, string> = {
  wishlists: 'wunschliste.wishlists',
  wishes: 'wunschliste.wishes',
};

export async function seed(page: Page, data: SeedData): Promise<void> {
  const entries = Object.entries(data).map(([name, records]) => [
    STORAGE_KEYS[name as keyof SeedData],
    JSON.stringify(records),
  ]);
  await page.addInitScript((initialEntries) => {
    for (const [key, value] of initialEntries) {
      if (localStorage.getItem(key) === null) {
        localStorage.setItem(key, value);
      }
    }
  }, entries);
}

export async function storedRecords<T>(page: Page, key: string): Promise<T[]> {
  return page.evaluate((storageKey) => JSON.parse(localStorage.getItem(storageKey) ?? '[]'), key);
}
