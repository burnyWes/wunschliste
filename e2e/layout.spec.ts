import { expect, test, type Page } from '@playwright/test';

const actionBar = (page: Page) => page.locator('.action-bar');

async function bottomGapOf(page: Page): Promise<number> {
  return actionBar(page).evaluate((bar) => window.innerHeight - bar.getBoundingClientRect().bottom);
}

test('pins the action bar to the bottom of the viewport below short content', async ({ page }) => {
  await page.goto('./#/liste/neu');

  await expect(actionBar(page)).toBeInViewport();
  expect(Math.abs(await bottomGapOf(page))).toBeLessThan(1);
});

test('keeps the action bar at the bottom of the viewport while scrolling tall content', async ({
  page,
}) => {
  await page.goto('./#/liste/neu');
  await page.evaluate(() => {
    const tallContent = document.createElement('div');
    tallContent.style.height = '300vh';
    document.querySelector('.action-bar')?.before(tallContent);
    window.scrollTo(0, document.body.scrollHeight / 2);
  });

  await expect(actionBar(page)).toBeInViewport();
  expect(Math.abs(await bottomGapOf(page))).toBeLessThan(1);
});
