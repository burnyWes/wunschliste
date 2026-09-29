import type { Page } from '@playwright/test';

export async function historyLength(page: Page): Promise<number> {
  return page.evaluate(() => history.length);
}
