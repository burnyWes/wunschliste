import { createAccount, seed, STRANGER } from './emulators';
import { expect, signIn, test, type Page } from './fixtures';

test.use({ signedIn: false });

const LOAD_FAILED = 'Die Daten konnten nicht geladen werden.';
const WRITE_REJECTED = 'Eine Änderung konnte nicht gespeichert werden.';

const problemNotice = (page: Page) => page.locator('header').getByRole('alert');
const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

test.beforeEach(async ({ page }) => {
  await seed({ wishlists: [{ id: 'birthday', name: 'Geburtstag' }] });
  await createAccount(STRANGER);
  await signIn(page, STRANGER);
});

test('explains data that cannot be loaded, until the page changes', async ({ page }) => {
  await expect(page.getByRole('main').getByText(LOAD_FAILED)).toBeVisible();
  await expect(problemNotice(page)).toHaveText(LOAD_FAILED);

  await page
    .getByRole('navigation', { name: 'Hauptnavigation' })
    .getByRole('button', { name: 'Einstellungen' })
    .click();

  await expect(pageHeading(page, 'Einstellungen')).toBeVisible();
  await expect(problemNotice(page)).toHaveText('');
});

test('explains a change the server rejected', async ({ page }) => {
  await page.goto('./#/liste/neu');
  await page.getByRole('textbox', { name: 'Name' }).fill('Test');

  await page.getByRole('button', { name: 'Erstellen' }).click();

  await expect(problemNotice(page).getByText(WRITE_REJECTED)).toBeVisible();
});

test('shows a wishlist that cannot be loaded as such', async ({ page }) => {
  await page.goto('./#/liste/birthday');

  await expect(pageHeading(page, 'Laden fehlgeschlagen')).toBeVisible();
  await expect(page.getByRole('main').getByText(LOAD_FAILED)).toBeVisible();
});
