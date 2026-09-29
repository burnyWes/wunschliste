import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, storedWishes, wishRecord } from './emulators';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const wishLink = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name: new RegExp(`^${name}`) });
const secretCheckbox = (page: Page) => page.getByRole('checkbox', { name: 'Geheim' });
const actionBarButtons = (page: Page) => page.locator('.action-bar').getByRole('button');

test.beforeEach(async () => {
  await seed({
    persons: [{ id: 'ben', name: 'Ben' }],
    wishlists: [
      { id: 'birthday', name: 'Geburtstag', ownerId: 'ben' },
      { id: 'mine', name: 'Meine Liste', ownerId: 'anna' },
    ],
    wishes: [
      wishRecord({
        id: 'tickets',
        wishlistId: 'birthday',
        name: 'Konzertkarten',
        createdBy: 'anna',
        secret: true,
        giverId: 'anna',
      }),
      wishRecord({
        id: 'watch',
        wishlistId: 'birthday',
        name: 'Uhr',
        createdBy: 'anna',
        secret: true,
      }),
      wishRecord({ id: 'book', wishlistId: 'birthday', name: 'Buch', createdBy: 'ben' }),
      wishRecord({
        id: 'cake',
        wishlistId: 'mine',
        name: 'Torte',
        createdBy: 'ben',
        secret: true,
      }),
      wishRecord({
        id: 'flowers',
        wishlistId: 'mine',
        name: 'Blumen',
        createdBy: 'ben',
        secret: true,
        giverId: 'ben',
      }),
      wishRecord({
        id: 'bike',
        wishlistId: 'mine',
        name: 'Fahrrad',
        createdBy: 'ben',
        secret: true,
        giverId: 'ben',
        received: true,
      }),
    ],
  });
});

test('creates a secret wish in the wishlist of someone else', async ({ page }) => {
  await page.goto('./#/liste/birthday/wunsch/neu');

  await expect(secretCheckbox(page)).toBeChecked();
  await expect(secretCheckbox(page)).toHaveAccessibleDescription('Ben sieht nur „Überraschung“.');

  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Fahrradhelm');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Fahrradhelm')).toBeVisible();
  await expect(page.getByText('Geheim – von Anna')).toBeVisible();
  const helmet = (await storedWishes()).find(({ name }) => name === 'Fahrradhelm');
  expect(helmet).toMatchObject({ secret: true, createdBy: 'anna' });
});

test('offers no secret in the own wishlist', async ({ page }) => {
  await page.goto('./#/liste/mine/wunsch/neu');

  await expect(pageHeading(page, 'Wunsch erstellen')).toBeVisible();
  await expect(secretCheckbox(page)).toHaveCount(0);
});

test('shows the owner only one line for all surprises', async ({ page }) => {
  await page.goto('./#/liste/mine');

  await expect(page.getByRole('main').getByRole('listitem')).toHaveText(['🎁 2 Überraschungen']);
  await expect(page.getByRole('main').getByRole('button', { name: /Überraschung/ })).toHaveCount(0);
  await expect(page.getByText('Noch keine offenen Wünsche.')).toHaveCount(0);
  await expect(
    page.getByRole('main').locator('.button-row').getByRole('button', { name: 'Wunsch erstellen' }),
  ).toBeVisible();

  await page.goto('./#/liste/mine/erfuellt');
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1);
  await expect(wishLink(page, 'Fahrrad')).toBeVisible();
});

for (const path of ['./#/wunsch/cake', './#/wunsch/cake/bearbeiten']) {
  test(`keeps the surprise from the owner at ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(page.getByText('Diesen Wunsch gibt es nicht mehr.')).toBeVisible();
  });
}

test('lets the giver hand over a secret wish', async ({ page }) => {
  await page.goto('./#/wunsch/tickets');
  await expect(page.getByText('Geheim – von Anna')).toBeVisible();
  await expect(actionBarButtons(page)).toHaveText(['Bearbeiten', 'Übergeben']);
  await expect(
    page.getByRole('main').locator('.button-row').getByRole('button', {
      name: 'Schenken zurücknehmen',
    }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Übergeben', exact: true }).click();

  await expectAnnouncement(page, 'Übergabe vermerkt.');
  await expect(page.getByRole('button', { name: 'Übergabe zurücknehmen' })).toBeFocused();
  await expect(page.getByRole('button', { name: 'Schenken zurücknehmen' })).toHaveCount(0);
});

test('lets the giver take a secret gift back', async ({ page }) => {
  await page.goto('./#/wunsch/tickets');

  await page.getByRole('button', { name: 'Schenken zurücknehmen' }).click();

  await expectAnnouncement(page, 'Schenken zurückgenommen.');
  await expect(page.getByRole('button', { name: 'Schenken', exact: true })).toBeFocused();
});

test('shows the owner a handed over secret wish as a normal fulfilled wish', async ({ page }) => {
  await page.goto('./#/wunsch/bike');

  await expect(page.getByText('Erfüllt – von Ben', { exact: true })).toBeVisible();
  await expect(page.getByText(/Geheim/)).toHaveCount(0);
  await expect(actionBarButtons(page)).toHaveText(['Bearbeiten']);
});

test('reveals a secret wish when editing it', async ({ page }) => {
  await page.goto('./#/wunsch/watch/bearbeiten');
  await expect(secretCheckbox(page)).toBeChecked();

  await page.locator('label').filter({ hasText: 'Geheim' }).click();
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Uhr')).toBeVisible();
  await expect(page.getByText(/Geheim/)).toHaveCount(0);
  const watch = (await storedWishes()).find(({ id }) => id === 'watch');
  expect(watch?.secret).toBe(false);
});

test('offers no secret when editing a normal wish', async ({ page }) => {
  await page.goto('./#/wunsch/book/bearbeiten');

  await expect(pageHeading(page, 'Wunsch bearbeiten')).toBeVisible();
  await expect(secretCheckbox(page)).toHaveCount(0);
});
