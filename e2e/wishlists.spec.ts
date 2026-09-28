import { expect, test, type Page } from '@playwright/test';
import { expectAnnouncement } from './announcement';
import { historyLength, storedRecords } from './seed';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

async function createWishlist(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: 'Wunschliste erstellen' }).first().click();
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('button', { name: 'Erstellen' }).click();
  await expect(pageHeading(page, name)).toBeVisible();
}

test('opens the form from the empty overview with its name field focused', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByText('Noch keine Wunschlisten.')).toBeVisible();
  await page
    .getByRole('main')
    .getByRole('button', { name: 'Wunschliste erstellen' })
    .last()
    .click();

  await expect(page).toHaveURL(/#\/liste\/neu$/);
  await expect(pageHeading(page, 'Wunschliste erstellen')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeFocused();
});

test('points out a missing name at the focused field', async ({ page }) => {
  await page.goto('./#/liste/neu');

  await page.getByRole('button', { name: 'Erstellen' }).click();

  const nameField = page.getByRole('textbox', { name: 'Name' });
  await expect(page.getByText('Bitte einen Namen eingeben.')).toBeVisible();
  await expect(nameField).toHaveAttribute('aria-invalid', 'true');
  await expect(nameField).toBeFocused();
});

test('replaces the form with the new wishlist', async ({ page }) => {
  await page.goto('./');
  const startLength = await historyLength(page);

  await createWishlist(page, 'Geburtstag 2027');

  await expect(pageHeading(page, 'Geburtstag 2027')).toBeFocused();
  await expect(page).toHaveTitle('Geburtstag 2027 – Wunschliste');
  await expectAnnouncement(page, 'Wunschliste erstellt.');
  expect(await historyLength(page)).toBe(startLength);

  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('goes back to the overview on cancel without creating anything', async ({ page }) => {
  await page.goto('./#/liste/neu');
  await page.getByRole('textbox', { name: 'Name' }).fill('Verworfen');

  await page.getByRole('button', { name: 'Abbrechen' }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  expect(await storedRecords(page, 'wunschliste.wishlists')).toEqual([]);
});

test('lists wishlists alphabetically and keeps them after a restart', async ({ page }) => {
  await page.goto('./');
  await createWishlist(page, 'Weihnachten');
  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();
  await createWishlist(page, 'Geburtstag 2027');
  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  const wishlistLinks = page.getByRole('main').getByRole('listitem');
  await expect(wishlistLinks).toHaveText(['Geburtstag 2027', 'Weihnachten']);

  await page.reload();

  await expect(wishlistLinks).toHaveText(['Geburtstag 2027', 'Weihnachten']);
});

test('explains an unknown wishlist and leads to the overview', async ({ page }) => {
  await page.goto('./#/liste/gibtsnicht');

  await expect(page.getByText('Diese Wunschliste gibt es nicht mehr.')).toBeVisible();
  await page.getByRole('button', { name: 'Zur Übersicht' }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('shows a wishlist created in another tab without reloading', async ({ page, context }) => {
  await page.goto('./');
  const otherTab = await context.newPage();
  await otherTab.goto('./');

  await createWishlist(otherTab, 'Ostern');

  await expect(page.getByRole('main').getByRole('button', { name: 'Ostern' })).toBeVisible();
});
