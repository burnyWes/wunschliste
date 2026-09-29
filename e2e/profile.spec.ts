import { expectAnnouncement } from './announcement';
import { seed, storedPersons } from './emulators';
import { ANNA, chooseProfile, expect, signIn, submitSignIn, test, type Page } from './fixtures';

test.use({ signedIn: false });

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const nameField = (page: Page) => page.getByRole('textbox', { name: 'Name' });
const mainButton = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name, exact: true });

async function openCreatePerson(page: Page): Promise<void> {
  await expect(pageHeading(page, 'Wer bist du?')).toBeVisible();
  await page.getByRole('button', { name: 'Neue Person' }).click();
  await expect(pageHeading(page, 'Person erstellen')).toBeVisible();
}

async function signOut(page: Page): Promise<void> {
  await page.goto('./#/einstellungen');
  await page.getByRole('button', { name: 'Abmelden' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Abmelden' }).click();
  await expect(pageHeading(page, 'Anmelden')).toBeVisible();
}

const storedProfile = (page: Page) =>
  page.evaluate(() => localStorage.getItem('wunschliste.profile'));

test.describe('without any person', () => {
  test.use({ profile: null });

  test('creates the first person and chooses it as the profile', async ({ page }) => {
    await page.goto('./');
    await submitSignIn(page);

    await expect(pageHeading(page, 'Wer bist du?')).toBeFocused();
    await expect(page.getByText('Noch keine Personen.')).toBeVisible();
    await expect(page.getByRole('navigation')).toHaveCount(0);

    await page.getByRole('button', { name: 'Neue Person' }).click();

    await expect(pageHeading(page, 'Person erstellen')).toBeVisible();
    await expect(nameField(page)).toBeFocused();

    await nameField(page).fill('Lea');
    await page.getByRole('button', { name: 'Erstellen' }).click();

    await expect(pageHeading(page, 'Wunschlisten')).toBeFocused();
    await expectAnnouncement(page, 'Du bist Lea.');
    await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();
  });

  test('creates only one person when tapping twice', async ({ page }) => {
    await signIn(page, undefined, null);
    await page.getByRole('button', { name: 'Neue Person' }).click();
    await nameField(page).fill('Lea');

    await page.getByRole('button', { name: 'Erstellen' }).dblclick();

    await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
    await expect.poll(async () => (await storedPersons()).map(({ name }) => name)).toEqual(['Lea']);
  });
});

test('shows the requested page after choosing the profile', async ({ page }) => {
  await page.goto('./#/einstellungen');
  await submitSignIn(page);

  await expect(pageHeading(page, 'Wer bist du?')).toBeVisible();
  await expect(page).toHaveURL(/#\/einstellungen$/);
  await chooseProfile(page, 'Anna');

  await expect(pageHeading(page, 'Einstellungen')).toBeFocused();
  await expectAnnouncement(page, 'Du bist Anna.');
});

test('lists the persons alphabetically', async ({ page }) => {
  await seed({
    persons: [
      { id: 'grandma', name: 'Oma' },
      { id: 'ben', name: 'Ben' },
    ],
  });
  await page.goto('./');
  await submitSignIn(page);
  await expect(pageHeading(page, 'Wer bist du?')).toBeVisible();

  await expect(page.getByRole('main').getByRole('listitem')).toHaveText(['Anna', 'Ben', 'Oma']);
});

test('points out a name that is already taken', async ({ page }) => {
  await page.goto('./');
  await submitSignIn(page);
  await openCreatePerson(page);

  await nameField(page).fill(' anna ');
  await page.getByRole('button', { name: 'Erstellen' }).click();

  await expect(page.getByText('Diesen Namen gibt es schon.')).toBeVisible();
  await expect(nameField(page)).toBeFocused();
  expect(await storedPersons()).toEqual([ANNA]);
});

test('goes back to the choice when cancelling', async ({ page }) => {
  await page.goto('./');
  await submitSignIn(page);
  await openCreatePerson(page);

  await page.getByRole('button', { name: 'Abbrechen' }).click();

  await expect(pageHeading(page, 'Wer bist du?')).toBeFocused();
  await expect(mainButton(page, 'Anna')).toBeVisible();
});

test('keeps the profile after reloading', async ({ page }) => {
  await signIn(page);

  await page.reload();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  expect(await storedProfile(page)).toBe('anna');
});

test('forgets the profile when signing out', async ({ page }) => {
  await signIn(page);

  await signOut(page);

  expect(await storedProfile(page)).toBeNull();
  await submitSignIn(page);
  await expect(pageHeading(page, 'Wer bist du?')).toBeVisible();
});

test('follows a profile forgotten in another tab without reloading', async ({ page, context }) => {
  await signIn(page);
  const otherTab = await context.newPage();
  await otherTab.goto('./');
  await expect(pageHeading(otherTab, 'Wunschlisten')).toBeVisible();

  await otherTab.evaluate(() => localStorage.removeItem('wunschliste.profile'));

  await expect(pageHeading(page, 'Wer bist du?')).toBeVisible();
});
