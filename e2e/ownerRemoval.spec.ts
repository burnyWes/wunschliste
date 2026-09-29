import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, storedWishes, storedWishlists, wishRecord } from './emulators';

const BEN = { id: 'ben', name: 'Ben' };

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const dialog = (page: Page) => page.getByRole('dialog');
const mainButton = (page: Page, name: string | RegExp) =>
  page.getByRole('main').getByRole('button', { name });

async function confirmDeletion(page: Page, buttonName: string): Promise<void> {
  await page.getByRole('button', { name: buttonName }).click();
  await dialog(page).getByRole('button', { name: 'Löschen' }).click();
}

test.describe('as the owner', () => {
  test.beforeEach(async () => {
    await seed({
      persons: [BEN],
      wishlists: [
        { id: 'birthday', name: 'Geburtstag', ownerId: 'anna' },
        { id: 'secrets', name: 'Geheimnisse', ownerId: 'anna' },
        { id: 'plain', name: 'Ostern', ownerId: 'anna' },
      ],
      wishes: [
        wishRecord({ id: 'helmet', wishlistId: 'birthday', name: 'Fahrradhelm', giverId: 'ben' }),
        wishRecord({ id: 'book', wishlistId: 'birthday', name: 'Buch' }),
        wishRecord({
          id: 'tickets',
          wishlistId: 'secrets',
          name: 'Konzertkarten',
          createdBy: 'ben',
          secret: true,
        }),
        wishRecord({ id: 'scarf', wishlistId: 'secrets', name: 'Schal' }),
        wishRecord({ id: 'pen', wishlistId: 'plain', name: 'Füller' }),
      ],
    });
  });

  test('hides a gift not yet received only from herself', async ({ page }) => {
    await page.goto('./#/wunsch/helmet/bearbeiten');

    await confirmDeletion(page, 'Wunsch löschen');

    await expectAnnouncement(page, 'Wunsch „Fahrradhelm“ gelöscht.');
    await expect(page).toHaveURL(/#\/liste\/birthday$/);
    await expect(mainButton(page, /^Fahrradhelm/)).toHaveCount(0);
    await expect(page.getByText('Diesen Wunsch gibt es nicht mehr.')).toHaveCount(0);
    await expect
      .poll(async () => (await storedWishes()).find(({ id }) => id === 'helmet')?.removedByOwner)
      .toBe(true);
  });

  test('deletes an open wish for good', async ({ page }) => {
    await page.goto('./#/wunsch/book/bearbeiten');

    await confirmDeletion(page, 'Wunsch löschen');

    await expect(page).toHaveURL(/#\/liste\/birthday$/);
    await expect.poll(async () => (await storedWishes()).map(({ id }) => id)).not.toContain('book');
  });

  test('hides a wishlist with secrets only from herself', async ({ page }) => {
    await page.goto('./#/liste/secrets/bearbeiten');

    await page.getByRole('button', { name: 'Wunschliste löschen' }).click();
    await expect(dialog(page)).toContainText('„Geheimnisse“ mit 1 Wunsch wird gelöscht.');
    await dialog(page).getByRole('button', { name: 'Löschen' }).click();

    await expectAnnouncement(page, 'Wunschliste „Geheimnisse“ gelöscht.');
    await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
    await expect(mainButton(page, 'Geheimnisse')).toHaveCount(0);
    await expect
      .poll(async () => (await storedWishlists()).find(({ id }) => id === 'secrets'))
      .toMatchObject({ removedByOwner: true });
    const secretWishes = (await storedWishes()).filter(
      ({ wishlistId }) => wishlistId === 'secrets',
    );
    expect(secretWishes.map(({ id, removedByOwner }) => ({ id, removedByOwner }))).toEqual([
      { id: 'scarf', removedByOwner: false },
      { id: 'tickets', removedByOwner: false },
    ]);

    for (const path of ['./#/liste/secrets', './#/liste/secrets/wunsch/neu']) {
      await page.goto(path);
      await expect(page.getByText('Diese Wunschliste gibt es nicht mehr.')).toBeVisible();
    }
    await page.goto('./#/wunsch/scarf');
    await expect(page.getByText('Diesen Wunsch gibt es nicht mehr.')).toBeVisible();
  });

  test('deletes a wishlist without secrets for good', async ({ page }) => {
    await page.goto('./#/liste/plain/bearbeiten');

    await confirmDeletion(page, 'Wunschliste löschen');

    await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
    await expect
      .poll(async () => (await storedWishlists()).map(({ id }) => id).sort())
      .toEqual(['birthday', 'secrets']);
    await expect.poll(async () => (await storedWishes()).map(({ id }) => id)).not.toContain('pen');
  });
});

test.describe('as someone else', () => {
  test.beforeEach(async () => {
    await seed({
      persons: [BEN],
      wishlists: [
        { id: 'easter', name: 'Ostern', ownerId: 'ben', removedByOwner: true },
        { id: 'christmas', name: 'Weihnachten', ownerId: 'ben' },
      ],
      wishes: [
        wishRecord({ id: 'kite', wishlistId: 'easter', name: 'Drachen', createdBy: 'ben' }),
        wishRecord({
          id: 'sledge',
          wishlistId: 'christmas',
          name: 'Schlitten',
          createdBy: 'ben',
          giverId: 'anna',
          removedByOwner: true,
        }),
      ],
    });
  });

  test('sees and deletes a wishlist removed by its owner', async ({ page }) => {
    await page.goto('./');
    await expect(mainButton(page, /^Ostern/)).toContainText('von Ben entfernt');

    await mainButton(page, /^Ostern/).click();
    await expect(page.getByText('Ben hat diese Wunschliste entfernt.')).toBeVisible();

    await page.getByRole('button', { name: 'Endgültig löschen' }).click();
    await expect(dialog(page)).toContainText('„Ostern“ mit 1 Wunsch wird gelöscht.');
    await dialog(page).getByRole('button', { name: 'Löschen' }).click();

    await expectAnnouncement(page, 'Wunschliste „Ostern“ gelöscht.');
    await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
    await expect(mainButton(page, /^Ostern/)).toHaveCount(0);
    await expect
      .poll(async () => (await storedWishlists()).map(({ id }) => id))
      .toEqual(['christmas']);
  });

  test('sees and deletes a wish removed by the owner', async ({ page }) => {
    await page.goto('./#/liste/christmas/erfuellt');
    await expect(mainButton(page, /^Schlitten/)).toContainText('von Ben entfernt');

    await mainButton(page, /^Schlitten/).click();
    await expect(page.getByText('Ben hat diesen Wunsch entfernt.')).toBeVisible();

    await confirmDeletion(page, 'Endgültig löschen');

    await expectAnnouncement(page, 'Wunsch „Schlitten“ gelöscht.');
    await expect(page).toHaveURL(/#\/liste\/christmas\/erfuellt$/);
    await expect(mainButton(page, /^Schlitten/)).toHaveCount(0);
    await expect.poll(async () => (await storedWishes()).map(({ id }) => id)).toEqual(['kite']);
  });
});

test('keeps the own person from being deleted while only hidden wishlists remain', async ({
  page,
}) => {
  await seed({
    wishlists: [{ id: 'easter', name: 'Ostern', ownerId: 'anna', removedByOwner: true }],
  });

  await page.goto('./#/person/anna/bearbeiten');

  await expect(page.getByText('Anna kann gerade nicht gelöscht werden.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Person löschen' })).toHaveCount(0);
});
