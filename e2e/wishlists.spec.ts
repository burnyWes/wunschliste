import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, seedDocument, storedWishlists } from './emulators';
import { historyLength } from './history';

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
  expect(await storedWishlists()).toEqual([]);
});

test('keeps created wishlists after a restart', async ({ page }) => {
  await page.goto('./');
  await createWishlist(page, 'Weihnachten');
  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();
  await createWishlist(page, 'Geburtstag 2027');
  await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();

  const wishlistNames = page.getByRole('main').locator('.wishlist-name');
  await expect(wishlistNames).toHaveText(['Geburtstag 2027', 'Weihnachten']);

  await page.reload();

  await expect(wishlistNames).toHaveText(['Geburtstag 2027', 'Weihnachten']);
});

test.describe('with several owners', () => {
  test.beforeEach(async () => {
    await seed({
      persons: [
        { id: 'ben', name: 'Ben' },
        { id: 'grandma', name: 'Oma' },
      ],
      wishlists: [
        { id: 'christmas', name: 'Weihnachten', ownerId: 'ben' },
        { id: 'easter', name: 'Ostern', ownerId: 'ben' },
        { id: 'birthday', name: 'Geburtstag 2027', ownerId: 'anna' },
        { id: 'camping', name: 'Zelten', ownerId: 'gone' },
      ],
    });
  });

  const groupNamed = (page: Page, heading: string) =>
    page.getByRole('main').getByRole('region', { name: heading });

  test('groups the overview by owner, my own group first', async ({ page }) => {
    await page.goto('./');

    await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
      'Anna (ich)',
      'Ben',
      'Unbekannt',
    ]);
    await expect(groupNamed(page, 'Anna (ich)').locator('.wishlist-name')).toHaveText([
      'Geburtstag 2027',
    ]);
    await expect(groupNamed(page, 'Ben').locator('.wishlist-name')).toHaveText([
      'Ostern',
      'Weihnachten',
    ]);
    await expect(groupNamed(page, 'Unbekannt').locator('.wishlist-name')).toHaveText(['Zelten']);
  });

  test('creates a wishlist for another person', async ({ page }) => {
    await page.goto('./#/liste/neu');
    await expect(page.getByRole('radio', { name: 'Anna (ich)' })).toBeChecked();
    await expect(page.getByRole('group', { name: 'Für' }).getByRole('radio')).toHaveCount(3);

    await page.getByRole('textbox', { name: 'Name' }).fill('Nikolaus');
    await page.locator('label').filter({ hasText: 'Oma' }).click();
    await page.getByRole('button', { name: 'Erstellen' }).click();

    await expect(pageHeading(page, 'Nikolaus')).toBeVisible();
    await expect(page.getByText('für Oma')).toBeVisible();
    await page.getByRole('button', { name: 'Zurück zu Wunschlisten' }).click();
    await expect(groupNamed(page, 'Oma').locator('.wishlist-name')).toHaveText(['Nikolaus']);
  });

  test('names the owner on the wishlist page', async ({ page }) => {
    await page.goto('./#/liste/birthday');
    await expect(page.getByRole('main').getByText('für mich')).toBeVisible();

    await page.goto('./#/liste/easter');
    await expect(page.getByRole('main').getByText('für Ben')).toBeVisible();
  });

  test('shows the owner on the edit page without letting it change', async ({ page }) => {
    await page.goto('./#/liste/birthday/bearbeiten');

    await expect(page.getByText('Für: Anna')).toBeVisible();
    await expect(page.getByRole('radio')).toHaveCount(0);
  });
});

test('hides a person without wishlists and a wishlist without owner', async ({ page }) => {
  await seed({
    persons: [{ id: 'ben', name: 'Ben' }],
    wishlists: [{ id: 'birthday', name: 'Geburtstag', ownerId: 'anna' }],
  });
  await seedDocument('wishlists', 'old', { name: 'Alte Liste' });

  await page.goto('./');

  await expect(page.getByRole('main').getByRole('heading', { level: 2 })).toHaveText([
    'Anna (ich)',
  ]);
  await expect(page.getByRole('main').locator('.wishlist-name')).toHaveText(['Geburtstag']);
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
