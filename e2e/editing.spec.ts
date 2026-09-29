import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, storedWishes, storedWishlists, type SeedData } from './emulators';
import { historyLength } from './history';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true });
const dialog = (page: Page) => page.getByRole('dialog');

const data: SeedData = {
  wishlists: [
    { id: 'birthday', name: 'Geburtstag' },
    { id: 'christmas', name: 'Weihnachten' },
  ],
  wishes: [
    {
      id: 'helmet',
      wishlistId: 'birthday',
      name: 'Fahrradhelm',
      priceInCents: 4999,
      rating: 'essential',
      gifted: false,
    },
    { id: 'book', wishlistId: 'birthday', name: 'Buch', gifted: false },
    { id: 'sledge', wishlistId: 'christmas', name: 'Schlitten', gifted: false },
  ],
};

test.beforeEach(async () => {
  await seed(data);
});

test('renames a wishlist and goes back to it', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Geburtstag' }).click();
  await page.getByRole('button', { name: 'Wunschliste bearbeiten' }).click();

  await field(page, 'Name').fill('Zeltlager');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Zeltlager')).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveText([
    'Weihnachten',
    'Zeltlager',
  ]);
});

test('returns to the fulfilled filter after saving', async ({ page }) => {
  await page.goto('./#/liste/birthday/erfuellt');
  await page.getByRole('button', { name: 'Wunschliste bearbeiten' }).click();

  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
});

test('asks before deleting a wishlist with its wishes', async ({ page }) => {
  await page.goto('./');
  const startLength = await historyLength(page);
  await page.getByRole('button', { name: 'Geburtstag' }).click();
  await page.getByRole('button', { name: 'Wunschliste bearbeiten' }).click();
  const deleteButton = page.getByRole('button', { name: 'Wunschliste löschen' });

  await deleteButton.focus();
  await page.keyboard.press('Enter');

  await expect(dialog(page)).toContainText('„Geburtstag“ mit 2 Wünschen wird gelöscht.');
  await expect(dialog(page).getByRole('button', { name: 'Abbrechen' })).toBeFocused();

  await dialog(page).getByRole('button', { name: 'Abbrechen' }).click();

  await expect(dialog(page)).toBeHidden();
  await expect(deleteButton).toBeFocused();

  await deleteButton.focus();
  await page.keyboard.press('Enter');
  await expect(dialog(page)).toBeVisible();
  await page.keyboard.press('Escape');

  await expect(dialog(page)).toBeHidden();
  await expect(deleteButton).toBeFocused();
  expect(await storedWishlists()).toHaveLength(2);

  await deleteButton.focus();
  await page.keyboard.press('Enter');
  await dialog(page).getByRole('button', { name: 'Löschen' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  await expect(page.getByRole('main').getByRole('listitem')).toHaveText(['Weihnachten']);
  await expect.poll(async () => (await storedWishes()).map(({ id }) => id)).toEqual(['sledge']);
  expect(await historyLength(page)).toBe(startLength);
});

test('removes price and rating from a wish', async ({ page }) => {
  await page.goto('./#/liste/birthday');
  await page.getByRole('button', { name: /^Fahrradhelm/ }).click();
  await page.getByRole('button', { name: 'Bearbeiten' }).click();

  await expect(field(page, 'Preis in Euro')).toHaveValue('49,99');
  await field(page, 'Preis in Euro').fill('');
  await page.locator('label').filter({ hasText: 'keine Angabe' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Fahrradhelm')).toBeFocused();
  await expect(page).toHaveURL(/#\/wunsch\/helmet$/);
  await expectAnnouncement(page, 'Gespeichert.');
  await expect(page.getByRole('main')).not.toContainText('€');
  await expect(page.getByRole('main')).not.toContainText('★');
});

test('deletes a wish', async ({ page }) => {
  await page.goto('./#/liste/birthday');
  await page.getByRole('button', { name: /^Fahrradhelm/ }).click();
  await page.getByRole('button', { name: 'Bearbeiten' }).click();

  await page.getByRole('button', { name: 'Wunsch löschen' }).click();
  await expect(dialog(page)).toContainText('„Fahrradhelm“ wird gelöscht.');
  await dialog(page).getByRole('button', { name: 'Löschen' }).click();

  await expect(pageHeading(page, 'Geburtstag')).toBeFocused();
  await expect(page.getByRole('main').locator('.wish-name')).toHaveText(['Buch']);
  await expectAnnouncement(page, 'Wunsch „Fahrradhelm“ gelöscht.');
});

test('focuses the heading of the edit pages', async ({ page }) => {
  await page.goto('./#/liste/birthday');

  await page.getByRole('button', { name: 'Wunschliste bearbeiten' }).click();

  await expect(pageHeading(page, 'Wunschliste bearbeiten')).toBeFocused();

  await page.getByRole('button', { name: 'Abbrechen' }).click();
  await page.getByRole('button', { name: /^Fahrradhelm/ }).click();
  await page.getByRole('button', { name: 'Bearbeiten' }).click();

  await expect(pageHeading(page, 'Wunsch bearbeiten')).toBeFocused();
});
