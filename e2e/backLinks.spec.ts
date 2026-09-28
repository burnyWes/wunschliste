import { expect, test, type Page } from '@playwright/test';
import { seed } from './seed';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

test.beforeEach(async ({ page }) => {
  await seed(page, {
    wishlists: [{ id: 'birthday', name: 'Geburtstag' }],
    wishes: [
      { id: 'helmet', wishlistId: 'birthday', name: 'Fahrradhelm', gifted: false },
      { id: 'tent', wishlistId: 'birthday', name: 'Zelt', gifted: true },
    ],
  });
});

test('leads from a wish back to its wishlist without a new history entry', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Geburtstag' }).click();
  await page.getByRole('link', { name: /^Fahrradhelm/ }).click();

  await page.getByRole('link', { name: 'Zurück zu Geburtstag' }).click();

  await expect(pageHeading(page, 'Geburtstag')).toBeFocused();

  await page.goBack();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('keeps the filter of the wishlist', async ({ page }) => {
  await page.goto('./#/liste/birthday/erfuellt');
  await page.getByRole('link', { name: /^Zelt/ }).click();

  await page.getByRole('link', { name: 'Zurück zu Geburtstag' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
});

test('stays in the app when a wish was opened directly', async ({ page }) => {
  await page.goto('./#/wunsch/helmet');

  await page.getByRole('link', { name: 'Zurück zu Geburtstag' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday$/);
  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();

  await page.getByRole('link', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('leads from a wishlist back to the overview', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Geburtstag' }).click();

  await page.getByRole('link', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeFocused();
});

test('does not lead back to a deleted wish', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Geburtstag' }).click();
  await page.getByRole('link', { name: /^Fahrradhelm/ }).click();
  await page.getByRole('link', { name: 'Bearbeiten' }).click();
  await page.getByRole('button', { name: 'Wunsch löschen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();

  await page.getByRole('link', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});
