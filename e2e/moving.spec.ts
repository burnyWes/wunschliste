import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, storedWishes, wishRecord } from './emulators';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const moveButton = (page: Page) =>
  page.getByRole('button', { name: 'In andere Liste verschieben' });
const moveTargets = (page: Page) => page.getByRole('main').getByRole('listitem');
const overviewEntry = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name: new RegExp(`^${name}`) });

test.beforeEach(async () => {
  await seed({
    persons: [
      { id: 'ben', name: 'Ben' },
      { id: 'oma', name: 'Oma' },
    ],
    wishlists: [
      { id: 'birthday', name: 'Geburtstag', ownerId: 'anna' },
      { id: 'christmas', name: 'Weihnachten', ownerId: 'anna' },
      { id: 'easter', name: 'Ostern', ownerId: 'anna' },
      { id: 'oldList', name: 'Alt', ownerId: 'anna', removedByOwner: true },
      { id: 'bens', name: 'Bens Liste', ownerId: 'ben' },
      { id: 'bensSecond', name: 'Bens Weihnachten', ownerId: 'ben' },
      { id: 'bensOld', name: 'Bens Alte', ownerId: 'ben', removedByOwner: true },
      { id: 'omas', name: 'Omas Liste', ownerId: 'oma' },
    ],
    wishes: [
      wishRecord({ id: 'helmet', wishlistId: 'birthday', name: 'Fahrradhelm', giverId: 'ben' }),
      wishRecord({ id: 'book', wishlistId: 'birthday', name: 'Buch' }),
      wishRecord({ id: 'sledge', wishlistId: 'christmas', name: 'Schlitten' }),
      wishRecord({
        id: 'tickets',
        wishlistId: 'bens',
        name: 'Konzertkarten',
        createdBy: 'anna',
        secret: true,
      }),
      wishRecord({ id: 'kite', wishlistId: 'bensOld', name: 'Drachen', createdBy: 'ben' }),
      wishRecord({ id: 'scarf', wishlistId: 'omas', name: 'Schal', createdBy: 'oma' }),
    ],
  });
});

async function openEditPage(page: Page, wishId: string): Promise<void> {
  await page.goto(`./#/wunsch/${wishId}/bearbeiten`);
  await expect(pageHeading(page, 'Wunsch bearbeiten')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wunsch löschen' })).toBeVisible();
}

async function storedWishlistOf(wishId: string): Promise<string | undefined> {
  const wishes = await storedWishes();
  return wishes.find(({ id }) => id === wishId)?.wishlistId;
}

test('moves a wish into another wishlist of the owner', async ({ page }) => {
  await page.goto('./');
  await expect(overviewEntry(page, 'Geburtstag')).toContainText('2 offen · 0 erfüllt');
  await expect(overviewEntry(page, 'Weihnachten')).toContainText('1 offen · 0 erfüllt');

  await openEditPage(page, 'helmet');
  await moveButton(page).click();

  await expect(pageHeading(page, 'Wohin verschieben?')).toBeFocused();
  await expect(page.getByText('„Fahrradhelm“ liegt in „Geburtstag“.')).toBeVisible();
  await expect(moveTargets(page)).toHaveText(['Ostern', 'Weihnachten']);

  await moveTargets(page).getByRole('button', { name: 'Weihnachten' }).click();

  await expect(pageHeading(page, 'Fahrradhelm')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Zurück zu Weihnachten' })).toBeVisible();
  await expectAnnouncement(page, 'In „Weihnachten“ verschoben.');

  const helmet = (await storedWishes()).find(({ id }) => id === 'helmet');
  expect(helmet?.wishlistId).toBe('christmas');
  expect(helmet?.giverId).toBe('ben');

  await page.goto('./');
  await expect(overviewEntry(page, 'Geburtstag')).toContainText('1 offen · 0 erfüllt');
  await expect(overviewEntry(page, 'Weihnachten')).toContainText('2 offen · 0 erfüllt');
});

test('goes back to editing without moving', async ({ page }) => {
  await openEditPage(page, 'helmet');
  await moveButton(page).click();
  await expect(moveTargets(page)).toHaveCount(2);

  await page.getByRole('button', { name: 'Zurück zu Wunsch bearbeiten' }).click();

  await expect(pageHeading(page, 'Wunsch bearbeiten')).toBeVisible();
  expect(await storedWishlistOf('helmet')).toBe('birthday');
});

test('moves a secret wish within the wishlists of its owner', async ({ page }) => {
  await openEditPage(page, 'tickets');
  await moveButton(page).click();

  await expect(moveTargets(page)).toHaveText(['Bens Weihnachten']);

  await moveTargets(page).getByRole('button', { name: 'Bens Weihnachten' }).click();

  await expect(pageHeading(page, 'Konzertkarten')).toBeVisible();
  const tickets = (await storedWishes()).find(({ id }) => id === 'tickets');
  expect(tickets?.wishlistId).toBe('bensSecond');
  expect(tickets?.secret).toBe(true);
});

async function expectNoMoveFor(page: Page, wishId: string): Promise<void> {
  await page.goto(`./#/wunsch/${wishId}/verschieben`);
  await expect(pageHeading(page, 'Wohin verschieben?')).toBeVisible();
  await expect(page.getByText('Keine andere Liste vorhanden.')).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu Wunsch bearbeiten' }).click();

  await expect(pageHeading(page, 'Wunsch bearbeiten')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Wunsch löschen' })).toBeVisible();
  await expect(moveButton(page)).toHaveCount(0);
}

test('offers no move out of a wishlist the owner removed', async ({ page }) => {
  await expectNoMoveFor(page, 'kite');
});

test('offers no move when the owner has no other wishlist', async ({ page }) => {
  await expectNoMoveFor(page, 'scarf');
});

test('tells when the wish to move is gone', async ({ page }) => {
  await page.goto('./#/wunsch/unbekannt/verschieben');

  await expect(page.getByText('Diesen Wunsch gibt es nicht mehr.')).toBeVisible();
});
