import { expect, test, type Page } from './fixtures';
import { seed, seedDocument, wishRecord } from './emulators';

const filterButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

const overviewEntry = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name: new RegExp(`^${name}`) });

const watch = wishRecord({ id: 'watch', wishlistId: 'bens', name: 'Uhr', createdBy: 'ben' });

async function giveWatchElsewhere(): Promise<void> {
  const { id, ...fields } = watch;
  await seedDocument('wishes', id, { ...fields, giverId: 'oma' });
}

test.beforeEach(async () => {
  await seed({
    persons: [
      { id: 'ben', name: 'Ben' },
      { id: 'oma', name: 'Oma' },
    ],
    wishlists: [
      { id: 'mine', name: 'Geburtstag', ownerId: 'anna' },
      { id: 'bens', name: 'Weihnachten', ownerId: 'ben' },
      { id: 'empty', name: 'Ostern', ownerId: 'ben' },
    ],
    wishes: [
      wishRecord({ id: 'helmet', wishlistId: 'mine', name: 'Fahrradhelm' }),
      wishRecord({ id: 'book', wishlistId: 'mine', name: 'Buch', giverId: 'ben' }),
      wishRecord({
        id: 'kite',
        wishlistId: 'mine',
        name: 'Drachen',
        giverId: 'ben',
        received: true,
      }),
      wishRecord({
        id: 'surprise',
        wishlistId: 'mine',
        name: 'Konzert',
        secret: true,
        createdBy: 'ben',
      }),
      watch,
      wishRecord({ id: 'socks', wishlistId: 'bens', name: 'Socken', createdBy: 'ben' }),
      wishRecord({
        id: 'scarf',
        wishlistId: 'bens',
        name: 'Schal',
        createdBy: 'ben',
        giverId: 'anna',
      }),
      wishRecord({ id: 'cap', wishlistId: 'bens', name: 'Mütze', secret: true }),
    ],
  });
});

test('counts the wishes behind each filter as the owner sees them', async ({ page }) => {
  await page.goto('./#/liste/mine');

  await expect(filterButton(page, 'Noch offen 2')).toBeVisible();
  await expect(filterButton(page, 'Erfüllt 1')).toBeVisible();
  await expect(page.getByText('1 Überraschung')).toBeVisible();
});

test('counts given and secret wishes on the wishlist of someone else', async ({ page }) => {
  await page.goto('./#/liste/bens');

  await expect(filterButton(page, 'Noch offen 3')).toBeVisible();
  await expect(filterButton(page, 'Erfüllt 1')).toBeVisible();
});

test('updates the counts when a wish is given elsewhere', async ({ page }) => {
  await page.goto('./#/liste/bens');
  await expect(filterButton(page, 'Noch offen 3')).toBeVisible();

  await giveWatchElsewhere();

  await expect(filterButton(page, 'Noch offen 2')).toBeVisible();
  await expect(filterButton(page, 'Erfüllt 2')).toBeVisible();
});

test('shows the counts of each wishlist in the overview', async ({ page }) => {
  await page.goto('./');

  await expect(overviewEntry(page, 'Geburtstag')).toContainText('2 offen · 1 erfüllt');
  await expect(overviewEntry(page, 'Weihnachten')).toContainText('3 offen · 1 erfüllt');
  await expect(overviewEntry(page, 'Ostern')).toContainText('0 offen · 0 erfüllt');
});

test('updates the counts in the overview when a wish is given elsewhere', async ({ page }) => {
  await page.goto('./');
  await expect(overviewEntry(page, 'Weihnachten')).toContainText('3 offen · 1 erfüllt');

  await giveWatchElsewhere();

  await expect(overviewEntry(page, 'Weihnachten')).toContainText('2 offen · 2 erfüllt');
});

test('counts a gifted repeatable wish as open and as fulfilled', async ({ page }) => {
  await seed({
    wishlists: [{ id: 'sweets', name: 'Naschen', ownerId: 'ben' }],
    wishes: [
      wishRecord({
        id: 'chocolate',
        wishlistId: 'sweets',
        name: 'Schokolade',
        createdBy: 'ben',
        repeatable: true,
        gifts: [{ recordedBy: 'anna' }],
      }),
    ],
  });
  await page.goto('./#/liste/sweets');

  await expect(filterButton(page, 'Noch offen 1')).toBeVisible();
  await expect(filterButton(page, 'Erfüllt 1')).toBeVisible();

  await page.goto('./');
  await expect(overviewEntry(page, 'Naschen')).toContainText('1 offen · 1 erfüllt');
});
