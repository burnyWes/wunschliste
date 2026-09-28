import { expect, test, type Page } from '@playwright/test';

const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';
const INVERTED_BUTTON = 'rgb(218, 156, 20)';

const schemeOption = (page: Page, label: string) => page.getByRole('radio', { name: label });

async function tapSchemeRow(page: Page, label: string): Promise<void> {
  await page.locator('label').filter({ hasText: label }).click();
}

async function backgroundOf(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#/einstellungen');
});

test('uses the dark scheme by default', async ({ page }) => {
  await expect(schemeOption(page, 'Dunkel')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  expect(await backgroundOf(page, 'body')).toBe(BLACK);
});

test('keeps the chosen light scheme after a restart', async ({ page }) => {
  await tapSchemeRow(page, 'Hell');

  expect(await backgroundOf(page, 'body')).toBe(WHITE);

  await page.reload();

  await expect(schemeOption(page, 'Hell')).toBeChecked();
  expect(await backgroundOf(page, 'body')).toBe(WHITE);
});

test('applies the stored scheme before the application starts', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('wunschliste.colorScheme', 'light'));
  await page.route('**/assets/*.js', (route) => route.abort());

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
});

test('colors the navigation buttons in the inverted scheme', async ({ page }) => {
  await tapSchemeRow(page, 'Invertiert');

  expect(await backgroundOf(page, 'nav a')).toBe(INVERTED_BUTTON);
});

for (const label of ['Hell', 'Invertiert']) {
  test(`keeps the status bar backdrop black in the ${label} scheme`, async ({ page }) => {
    await tapSchemeRow(page, label);

    expect(await backgroundOf(page, '.status-bar-backdrop')).toBe(BLACK);
  });
}

test('switches the scheme with the arrow keys', async ({ page }) => {
  await schemeOption(page, 'Dunkel').focus();

  await page.keyboard.press('ArrowDown');

  await expect(schemeOption(page, 'Hell')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
});
