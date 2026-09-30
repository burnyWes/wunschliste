import { expect, test, type Page } from './fixtures';
import { seed, wishRecord } from './emulators';
import { historyLength } from './history';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

test.beforeEach(async () => {
  await seed({
    wishlists: [{ id: 'birthday', name: 'Geburtstag', ownerId: 'anna' }],
    wishes: [
      wishRecord({ id: 'helmet', wishlistId: 'birthday', name: 'Fahrradhelm' }),
      wishRecord({ id: 'tent', wishlistId: 'birthday', name: 'Zelt', received: true }),
    ],
  });
});

test('leads from a wish back to its wishlist without a new history entry', async ({ page }) => {
  await page.goto('./');
  const startLength = await historyLength(page);
  await page.getByRole('button', { name: 'Geburtstag' }).click();
  await page.getByRole('button', { name: /^Fahrradhelm/ }).click();

  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(pageHeading(page, 'Geburtstag')).toBeFocused();
  expect(await historyLength(page)).toBe(startLength);
});

test('keeps the filter of the wishlist', async ({ page }) => {
  await page.goto('./#/liste/birthday');
  await page.getByRole('button', { name: /^Erfüllt( \d+)?$/ }).click();
  await page.getByRole('button', { name: /^Zelt/ }).click();

  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
});

test('leads to the open wishes when a wish was opened directly', async ({ page }) => {
  await page.goto('./#/wunsch/tent');

  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday$/);
});

test('stays in the app when a wish was opened directly', async ({ page }) => {
  await page.goto('./#/wunsch/helmet');

  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday$/);
  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('leads from a wishlist back to the overview', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Geburtstag' }).click();

  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeFocused();
});

test('does not lead back to a deleted wish', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Geburtstag' }).click();
  await page.getByRole('button', { name: /^Fahrradhelm/ }).click();
  await page.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.getByRole('button', { name: 'Wunsch löschen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();
  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});
