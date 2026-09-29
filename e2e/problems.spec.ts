import { createAccount, STRANGER } from './emulators';
import { expect, submitSignIn, test, type Page } from './fixtures';

test.use({ signedIn: false });

const LOAD_FAILED = 'Die Daten konnten nicht geladen werden.';

const problemNotice = (page: Page) => page.locator('header').getByRole('alert');
const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

test.beforeEach(async ({ page }) => {
  await createAccount(STRANGER);
  await page.goto('./#/einstellungen');
  await submitSignIn(page, STRANGER);
});

test('explains data that cannot be loaded without offering any other page', async ({ page }) => {
  await expect(pageHeading(page, 'Laden fehlgeschlagen')).toBeVisible();
  await expect(page.getByRole('main').getByText(LOAD_FAILED)).toBeVisible();
  await expect(problemNotice(page)).toHaveText(LOAD_FAILED);
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/einstellungen$/);
});

test('lets an account without access sign out again', async ({ page }) => {
  await expect(pageHeading(page, 'Laden fehlgeschlagen')).toBeVisible();

  await page.getByRole('button', { name: 'Abmelden' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Abmelden' }).click();

  await expect(pageHeading(page, 'Anmelden')).toBeVisible();
});
