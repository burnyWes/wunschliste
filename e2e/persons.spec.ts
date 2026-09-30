import { expectAnnouncement } from './announcement';
import { seed } from './emulators';
import { chooseProfile, expect, test, type Page } from './fixtures';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const nameField = (page: Page) => page.getByRole('textbox', { name: 'Name' });
const personsSection = (page: Page) => page.getByRole('region', { name: 'Alle Personen' });
const personEntry = (page: Page, name: string) =>
  personsSection(page).getByRole('button', { name, exact: true });

test.beforeEach(async () => {
  await seed({
    persons: [
      { id: 'ben', name: 'Ben' },
      { id: 'grandma', name: 'Oma' },
    ],
    wishlists: [
      { id: 'easter', name: 'Ostern', ownerId: 'grandma' },
      { id: 'christmas', name: 'Weihnachten', ownerId: 'grandma' },
    ],
  });
});

async function openPersons(page: Page): Promise<void> {
  await page.goto('./#/personen');
  await expect(pageHeading(page, 'Personen')).toBeVisible();
}

async function deletePersonNamed(page: Page, name: string): Promise<void> {
  await personEntry(page, name).click();
  await expect(pageHeading(page, 'Person bearbeiten')).toBeVisible();
  await page.getByRole('button', { name: 'Person löschen' }).click();
  await expect(page.getByRole('dialog')).toContainText(`„${name}“ wird gelöscht.`);
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();
}

test('shows who uses the device in the settings and leads to the persons', async ({ page }) => {
  await page.goto('./#/einstellungen');
  await expect(pageHeading(page, 'Einstellungen')).toBeVisible();

  await expect(personsSection(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Wechseln' })).toHaveCount(0);
  await page.getByRole('button', { name: /^Personen\s*Ich bin Anna$/ }).click();

  await expect(page).toHaveURL(/#\/personen$/);
  await expect(pageHeading(page, 'Personen')).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Zurück zu Einstellungen' }).click();

  await expect(pageHeading(page, 'Einstellungen')).toBeFocused();
});

test('shows who uses the device and all persons on the persons page', async ({ page }) => {
  await openPersons(page);

  await expect(page.getByText('Ich bin Anna')).toBeVisible();
  await expect(personsSection(page).getByRole('listitem')).toHaveText(['Anna', 'Ben', 'Oma']);
});

test('switches the profile and goes back to the persons', async ({ page }) => {
  await openPersons(page);

  await page.getByRole('button', { name: 'Wechseln' }).click();

  await expect(pageHeading(page, 'Wer bist du?')).toBeFocused();
  await expect(page).toHaveURL(/#\/wer-bist-du$/);
  await expect(page.getByRole('button', { name: 'Zurück zu Personen' })).toBeVisible();

  await page.getByRole('main').getByRole('button', { name: 'Ben', exact: true }).click();

  await expect(pageHeading(page, 'Personen')).toBeFocused();
  await expect(page.getByText('Ich bin Ben')).toBeVisible();
  await expectAnnouncement(page, 'Du bist Ben.');
});

test('creates a person without changing the profile', async ({ page }) => {
  await openPersons(page);

  await page.getByRole('button', { name: 'Person erstellen' }).click();
  await expect(pageHeading(page, 'Person erstellen')).toBeVisible();
  await nameField(page).fill('Lea');
  await page.getByRole('button', { name: 'Erstellen' }).click();

  await expect(pageHeading(page, 'Personen')).toBeFocused();
  await expectAnnouncement(page, 'Person erstellt.');
  await expect(personsSection(page).getByRole('listitem')).toHaveText([
    'Anna',
    'Ben',
    'Lea',
    'Oma',
  ]);
  await expect(page.getByText('Ich bin Anna')).toBeVisible();
});

test('goes back to the persons when cancelling the creation', async ({ page }) => {
  await openPersons(page);

  await page.getByRole('button', { name: 'Person erstellen' }).click();
  await expect(pageHeading(page, 'Person erstellen')).toBeVisible();
  await page.getByRole('button', { name: 'Abbrechen' }).click();

  await expect(pageHeading(page, 'Personen')).toBeFocused();
});

test('leads from editing a person back to the persons', async ({ page }) => {
  await openPersons(page);
  await personEntry(page, 'Ben').click();
  await expect(pageHeading(page, 'Person bearbeiten')).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu Personen' }).click();

  await expect(pageHeading(page, 'Personen')).toBeFocused();
});

test('renames a person and refuses a name that is taken', async ({ page }) => {
  await openPersons(page);
  await personEntry(page, 'Ben').click();
  await expect(pageHeading(page, 'Person bearbeiten')).toBeVisible();

  await nameField(page).fill('anna');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByText('Diesen Namen gibt es schon.')).toBeVisible();
  await expect(nameField(page)).toBeFocused();

  await nameField(page).fill('Benjamin');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Personen')).toBeFocused();
  await expectAnnouncement(page, 'Gespeichert.');
  await expect(personEntry(page, 'Benjamin')).toBeVisible();
});

test('keeps a person who still owns wishlists', async ({ page }) => {
  await openPersons(page);

  await personEntry(page, 'Oma').click();

  await expect(
    page.getByText(
      'Oma gehören noch 2 Wunschlisten. Sie kann erst gelöscht werden, wenn sie keine mehr hat.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Person löschen' })).toHaveCount(0);
});

test('deletes a person without wishlists after confirming', async ({ page }) => {
  await openPersons(page);

  await deletePersonNamed(page, 'Ben');

  await expect(pageHeading(page, 'Personen')).toBeFocused();
  await expectAnnouncement(page, 'Person „Ben“ gelöscht.');
  await expect(personsSection(page).getByRole('listitem')).toHaveText(['Anna', 'Oma']);
});

test('asks who uses the device after deleting the own person', async ({ page }) => {
  await openPersons(page);

  await deletePersonNamed(page, 'Anna');

  await expect(pageHeading(page, 'Wer bist du?')).toBeFocused();
  await expect(page).toHaveURL(/#\/personen$/);
  await chooseProfile(page, 'Ben');
  await expect(pageHeading(page, 'Personen')).toBeFocused();
  await expect(page.getByText('Ich bin Ben')).toBeVisible();
});

test('asks who uses the device when another tab deletes the own person', async ({
  page,
  context,
}) => {
  await openPersons(page);
  const otherTab = await context.newPage();
  await otherTab.goto('./#/person/anna/bearbeiten');
  await expect(pageHeading(otherTab, 'Person bearbeiten')).toBeVisible();

  await otherTab.getByRole('button', { name: 'Person löschen' }).click();
  await otherTab.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();

  await expect(pageHeading(page, 'Wer bist du?')).toBeVisible();
});

test('explains an unknown person', async ({ page }) => {
  await page.goto('./#/person/gibtsnicht/bearbeiten');

  await expect(page.getByText('Diese Person gibt es nicht mehr.')).toBeVisible();
});
