import { FAMILY, seed } from './emulators';
import { expect, signIn, test, type Page } from './fixtures';

test.use({ signedIn: false });

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const emailField = (page: Page) => page.getByLabel('E-Mail');
const passwordField = (page: Page) => page.getByLabel('Passwort');
const signInProblem = (page: Page) => page.getByRole('alert');

async function submitSignIn(page: Page, email: string, password: string): Promise<void> {
  await emailField(page).fill(email);
  await passwordField(page).fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
}

test('shows only the sign-in page without signing in', async ({ page }) => {
  await page.goto('./#/einstellungen');

  await expect(pageHeading(page, 'Anmelden')).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page).toHaveTitle('Anmelden – Wunschliste');
});

test('offers the saved credentials of the device', async ({ page }) => {
  await page.goto('./');

  await expect(emailField(page)).toHaveAttribute('autocomplete', 'username');
  await expect(passwordField(page)).toHaveAttribute('autocomplete', 'current-password');
});

test('points out empty fields at the focused email field', async ({ page }) => {
  await page.goto('./');

  await page.getByRole('button', { name: 'Anmelden' }).click();

  await expect(page.getByText('Bitte die E-Mail-Adresse eingeben.')).toBeVisible();
  await expect(page.getByText('Bitte das Passwort eingeben.')).toBeVisible();
  await expect(emailField(page)).toBeFocused();
});

test('explains wrong credentials', async ({ page }) => {
  await page.goto('./');

  await submitSignIn(page, FAMILY.email, 'falsch-123');

  await expect(signInProblem(page)).toHaveText('E-Mail oder Passwort stimmt nicht.');
});

test('explains a missing connection', async ({ page, context }) => {
  await page.goto('./');
  await context.setOffline(true);

  await submitSignIn(page, FAMILY.email, FAMILY.password);

  await expect(signInProblem(page)).toHaveText('Keine Verbindung. Bitte später erneut versuchen.');
  await context.setOffline(false);
});

test('shows the requested page after signing in and stays signed in', async ({ page }) => {
  await page.goto('./#/einstellungen');

  await submitSignIn(page, FAMILY.email, FAMILY.password);

  await expect(pageHeading(page, 'Einstellungen')).toBeFocused();
  await expect(page).toHaveURL(/#\/einstellungen$/);

  await page.reload();

  await expect(pageHeading(page, 'Einstellungen')).toBeVisible();
  await expect(page.getByText(`Angemeldet als ${FAMILY.email}`)).toBeVisible();
});

test('signs out only after confirming', async ({ page }) => {
  await signIn(page);
  await page.goto('./#/einstellungen');
  const signOutButton = page.getByRole('button', { name: 'Abmelden' });
  const dialog = page.getByRole('dialog');

  await signOutButton.click();

  await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Abbrechen' }).click();
  await expect(pageHeading(page, 'Einstellungen')).toBeVisible();

  await signOutButton.click();
  await dialog.getByRole('button', { name: 'Abmelden' }).click();

  await expect(pageHeading(page, 'Anmelden')).toBeVisible();
});

test.describe('after signing out', () => {
  async function signOut(page: Page): Promise<void> {
    await page.goto('./#/einstellungen');
    await page.getByRole('button', { name: 'Abmelden' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Abmelden' }).click();
    await expect(pageHeading(page, 'Anmelden')).toBeVisible();
  }

  async function firestoreDatabasesOf(page: Page): Promise<string[]> {
    return page.evaluate(async () => {
      const databases = await indexedDB.databases();
      return databases
        .map(({ name }) => name ?? '')
        .filter((name) => name.startsWith('firestore/'));
    });
  }

  test('shows the data again after signing in anew', async ({ page }) => {
    await seed({ wishlists: [{ id: 'birthday', name: 'Geburtstag' }] });
    await signIn(page);
    await expect(page.getByRole('main').getByRole('button', { name: 'Geburtstag' })).toBeVisible();

    await signOut(page);
    await signIn(page);

    await expect(page.getByRole('main').getByRole('button', { name: 'Geburtstag' })).toBeVisible();
  });

  test('removes the offline cache of the device', async ({ page }) => {
    await signIn(page);
    await expect.poll(() => firestoreDatabasesOf(page)).not.toEqual([]);

    await signOut(page);

    await expect.poll(() => firestoreDatabasesOf(page)).toEqual([]);
  });

  test('signs out every tab even while another tab holds the cache', async ({ page, context }) => {
    await signIn(page);
    const otherTab = await context.newPage();
    await otherTab.goto('./');
    await expect(pageHeading(otherTab, 'Wunschlisten')).toBeVisible();

    await signOut(page);

    await expect(pageHeading(page, 'Anmelden')).toBeVisible({ timeout: 5000 });
    await expect(pageHeading(otherTab, 'Anmelden')).toBeVisible({ timeout: 5000 });
  });
});
