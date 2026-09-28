import { expect, test, type Page } from '@playwright/test';

const mainNavigation = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });
const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

test('starts on the wishlists page without moving focus', async ({ page }) => {
  await page.goto('./');

  await expect(mainNavigation(page).getByRole('link', { name: 'Wunschlisten' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page).toHaveTitle('Wunschlisten – Wunschliste');
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  await expect(pageHeading(page, 'Wunschlisten')).not.toBeFocused();
});

test('moves focus to the heading of each newly shown page', async ({ page }) => {
  await page.goto('./');

  await mainNavigation(page).getByRole('link', { name: 'Einstellungen' }).click();

  await expect(page).toHaveURL(/#\/einstellungen$/);
  await expect(pageHeading(page, 'Einstellungen')).toBeFocused();
  await expect(mainNavigation(page).getByRole('link', { name: 'Einstellungen' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page).toHaveTitle('Einstellungen – Wunschliste');

  await page.goBack();

  await expect(pageHeading(page, 'Wunschlisten')).toBeFocused();
});

test('redirects unknown addresses to the wishlists page', async ({ page }) => {
  await page.goto('./#/quatsch');

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('keeps the navigation in view while scrolling', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    const tallContent = document.createElement('div');
    tallContent.style.height = '300vh';
    document.querySelector('main')?.append(tallContent);
    window.scrollTo(0, document.body.scrollHeight);
  });

  await expect(mainNavigation(page)).toBeInViewport();
});
