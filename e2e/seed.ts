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

export async function seed(page: Page, { wishlists = [], wishes = [] }: SeedData): Promise<void> {
  const entries: [string, string][] = [
    ['wunschliste.wishlists', JSON.stringify(wishlists)],
    ['wunschliste.wishes', JSON.stringify(wishes)],
  ];
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
