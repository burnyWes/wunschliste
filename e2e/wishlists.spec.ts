import { expect, test, type Page } from '@playwright/test';
import { seed } from './seed';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const mainNavigation = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });

async function createWishlist(page: Page, name: string): Promise<void> {
  await page.getByRole('link', { name: 'Wunschliste erstellen' }).first().click();
  await page.getByRole('textbox', { name: 'Name' }).fill(name);
  await page.getByRole('button', { name: 'Erstellen' }).click();
  await expect(pageHeading(page, name)).toBeVisible();
}

test('opens the form from the empty overview with its heading focused', async ({ page }) => {
  await page.goto('./');

  await expect(page.getByText('Noch keine Wunschlisten.')).toBeVisible();
  await page.getByRole('main').getByRole('link', { name: 'Wunschliste erstellen' }).last().click();

  await expect(page).toHaveURL(/#\/liste\/neu$/);
  await expect(pageHeading(page, 'Wunschliste erstellen')).toBeFocused();
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

  await createWishlist(page, 'Geburtstag 2027');

  await expect(pageHeading(page, 'Geburtstag 2027')).toBeFocused();
  await expect(page).toHaveTitle('Geburtstag 2027 – Wunschliste');

  await page.goBack();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('lists wishlists alphabetically and keeps them after a restart', async ({ page }) => {
  await page.goto('./');
  await createWishlist(page, 'Weihnachten');
  await page.goBack();
  await createWishlist(page, 'Geburtstag 2027');
  await page.goBack();

  const wishlistLinks = page.getByRole('main').getByRole('listitem');
  await expect(wishlistLinks).toHaveText(['Geburtstag 2027', 'Weihnachten']);

  await page.reload();

  await expect(wishlistLinks).toHaveText(['Geburtstag 2027', 'Weihnachten']);
});

test('explains an unknown wishlist and links to the overview', async ({ page }) => {
  await page.goto('./#/liste/gibtsnicht');

  await expect(page.getByText('Diese Wunschliste gibt es nicht mehr.')).toBeVisible();
  await page.getByRole('link', { name: 'Zur Übersicht' }).click();

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('keeps the wishlists navigation marked on a wishlist page', async ({ page }) => {
  await seed(page, { wishlists: [{ id: 'b', name: 'Geburtstag' }] });
  await page.goto('./#/liste/b');

  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();
  await expect(mainNavigation(page).getByRole('link', { name: 'Wunschlisten' })).toHaveAttribute(
    'aria-current',
    'true',
  );
});

test('shows a wishlist created in another tab without reloading', async ({ page, context }) => {
  await page.goto('./');
  const otherTab = await context.newPage();
  await otherTab.goto('./');

  await createWishlist(otherTab, 'Ostern');

  await expect(page.getByRole('main').getByRole('link', { name: 'Ostern' })).toBeVisible();
});
