import { expect, test, type Page } from '@playwright/test';
import { seed } from './seed';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const filterButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const wishLink = (page: Page, name: string) =>
  page.getByRole('main').getByRole('link', { name: new RegExp(`^${name}`) });

test.beforeEach(async ({ page }) => {
  await seed(page, {
    wishlists: [{ id: 'birthday', name: 'Geburtstag' }],
    wishes: [
      { id: 'helmet', wishlistId: 'birthday', name: 'Fahrradhelm', gifted: false },
      { id: 'book', wishlistId: 'birthday', name: 'Buch', gifted: false },
    ],
  });
});

test('gifts a wish and moves it to the fulfilled wishes', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Geburtstag' }).click();
  await wishLink(page, 'Fahrradhelm').click();

  await page.getByRole('button', { name: 'Schenken', exact: true }).focus();
  await page.keyboard.press('Enter');

  await expect(page.getByRole('status')).toHaveText('Als erfüllt markiert.');
  await expect(page.getByRole('button', { name: 'Schenken zurücknehmen' })).toBeFocused();
  await expect(page.getByText('Erfüllt', { exact: true })).toBeVisible();

  await page.getByRole('link', { name: 'Zurück zu Geburtstag' }).click();

  await expect(filterButton(page, 'Offene Wünsche')).toHaveAttribute('aria-pressed', 'true');
  await expect(wishLink(page, 'Fahrradhelm')).toHaveCount(0);

  await filterButton(page, 'Erfüllte Wünsche').focus();
  await page.keyboard.press('Space');

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
  await expect(wishLink(page, 'Fahrradhelm')).toBeVisible();
  await expect(filterButton(page, 'Erfüllte Wünsche')).toBeFocused();
  await expect(filterButton(page, 'Erfüllte Wünsche')).toHaveAttribute('aria-pressed', 'true');
  await expect(pageHeading(page, 'Geburtstag')).not.toBeFocused();
  await expect(page).toHaveTitle('Geburtstag – Wunschliste');

  await wishLink(page, 'Fahrradhelm').click();
  await page.goBack();

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
  await expect(wishLink(page, 'Fahrradhelm')).toBeVisible();
});

test('switches the filter without adding history entries', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('link', { name: 'Geburtstag' }).click();

  await filterButton(page, 'Erfüllte Wünsche').click();
  await filterButton(page, 'Offene Wünsche').click();
  await filterButton(page, 'Erfüllte Wünsche').click();
  await expect(page).toHaveURL(/\/erfuellt$/);

  await page.goBack();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('takes a gift back so the wish is open again', async ({ page }) => {
  await page.goto('./#/wunsch/helmet');
  await page.getByRole('button', { name: 'Schenken', exact: true }).click();

  await page.getByRole('button', { name: 'Schenken zurücknehmen' }).click();

  await expect(page.getByRole('status')).toHaveText('Wieder offen.');
  await expect(page.getByText('Erfüllt', { exact: true })).toHaveCount(0);

  await page.goto('./#/liste/birthday');
  await expect(wishLink(page, 'Fahrradhelm')).toBeVisible();
});

test('shows the empty fulfilled wishes without a create button', async ({ page }) => {
  await page.goto('./#/liste/birthday/erfuellt');

  await expect(page.getByText('Noch keine erfüllten Wünsche.')).toBeVisible();
  await expect(page.getByRole('main').locator('.button-row').getByRole('link')).toHaveCount(0);
});
