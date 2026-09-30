import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, wishRecord } from './emulators';
import { historyLength } from './history';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const filterButton = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${name}( \\d+)?$`) });
const wishLink = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name: new RegExp(`^${name}`) });
const actionBarButtons = (page: Page) => page.locator('.action-bar').getByRole('button');

test.beforeEach(async () => {
  await seed({
    persons: [
      { id: 'ben', name: 'Ben' },
      { id: 'oma', name: 'Oma' },
    ],
    wishlists: [
      { id: 'birthday', name: 'Geburtstag', ownerId: 'ben' },
      { id: 'anniversary', name: 'Jubiläum', ownerId: 'anna' },
    ],
    wishes: [
      wishRecord({ id: 'helmet', wishlistId: 'birthday', name: 'Fahrradhelm', createdBy: 'ben' }),
      wishRecord({ id: 'book', wishlistId: 'birthday', name: 'Buch', createdBy: 'ben' }),
      wishRecord({
        id: 'lamp',
        wishlistId: 'birthday',
        name: 'Lampe',
        createdBy: 'ben',
        giverId: 'oma',
      }),
      wishRecord({
        id: 'kite',
        wishlistId: 'birthday',
        name: 'Drachen',
        createdBy: 'ben',
        giverId: 'anna',
        received: true,
      }),
      wishRecord({ id: 'watch', wishlistId: 'anniversary', name: 'Uhr', giverId: 'ben' }),
      wishRecord({ id: 'scarf', wishlistId: 'anniversary', name: 'Schal' }),
    ],
  });
});

test('gifts a wish and moves it to the fulfilled wishes', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Geburtstag' }).click();
  await wishLink(page, 'Fahrradhelm').click();

  await page.getByRole('button', { name: 'Schenken', exact: true }).focus();
  await page.keyboard.press('Enter');

  await expectAnnouncement(page, 'Als geschenkt markiert.');
  await expect(page.getByRole('button', { name: 'Schenken zurücknehmen' })).toBeFocused();
  await expect(page.getByText('Erfüllt – von Anna', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(filterButton(page, 'Noch offen')).toHaveAttribute('aria-pressed', 'true');
  await expect(wishLink(page, 'Fahrradhelm')).toHaveCount(0);

  await filterButton(page, 'Erfüllt').focus();
  await page.keyboard.press('Space');

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
  await expect(wishLink(page, 'Fahrradhelm')).toBeVisible();
  await expect(wishLink(page, 'Fahrradhelm')).toContainText('geschenkt von Anna');
  await expect(filterButton(page, 'Erfüllt')).toBeFocused();
  await expect(filterButton(page, 'Erfüllt')).toHaveAttribute('aria-pressed', 'true');
  await expect(pageHeading(page, 'Geburtstag')).not.toBeFocused();
  await expect(page).toHaveTitle('Geburtstag – Wunschliste');

  await wishLink(page, 'Fahrradhelm').click();
  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday\/erfuellt$/);
  await expect(wishLink(page, 'Fahrradhelm')).toBeVisible();
});

test('switches the filter without adding history entries', async ({ page }) => {
  await page.goto('./');
  const startLength = await historyLength(page);
  await page.getByRole('button', { name: 'Geburtstag' }).click();

  await filterButton(page, 'Erfüllt').click();
  await filterButton(page, 'Noch offen').click();
  await filterButton(page, 'Erfüllt').click();
  await expect(page).toHaveURL(/\/erfuellt$/);

  expect(await historyLength(page)).toBe(startLength);
});

test('takes a gift back so the wish is open again', async ({ page }) => {
  await page.goto('./#/wunsch/helmet');
  await page.getByRole('button', { name: 'Schenken', exact: true }).click();

  await page.getByRole('button', { name: 'Schenken zurücknehmen' }).click();

  await expectAnnouncement(page, 'Schenken zurückgenommen.');
  await expect(page.getByRole('button', { name: 'Schenken', exact: true })).toBeFocused();
  await expect(page.getByText(/^Erfüllt/)).toHaveCount(0);

  await page.goto('./#/liste/birthday');
  await expect(wishLink(page, 'Fahrradhelm')).toBeVisible();
});

test('shows the gift of someone else without a state button', async ({ page }) => {
  await page.goto('./#/wunsch/lamp');

  await expect(page.getByText('Erfüllt – von Oma', { exact: true })).toBeVisible();
  await expect(actionBarButtons(page)).toHaveText(['Bearbeiten']);
});

test('lets the owner receive a gifted wish without revealing the giver before', async ({
  page,
}) => {
  await page.goto('./#/liste/anniversary');
  await expect(wishLink(page, 'Uhr')).toHaveText('Uhr');
  await wishLink(page, 'Uhr').click();
  await expect(page.getByText(/^Erfüllt/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Erhalten', exact: true }).click();

  await expectAnnouncement(page, 'Als erhalten markiert.');
  await expect(page.getByRole('button', { name: 'Erhalten zurücknehmen' })).toBeFocused();
  await expect(page.getByText('Erfüllt – von Ben', { exact: true })).toBeVisible();

  await page.goto('./#/liste/anniversary/erfuellt');
  await expect(wishLink(page, 'Uhr')).toContainText('geschenkt von Ben');

  await wishLink(page, 'Uhr').click();
  await page.getByRole('button', { name: 'Erhalten zurücknehmen' }).click();

  await expectAnnouncement(page, 'Wieder offen.');
  await expect(page.getByRole('button', { name: 'Erhalten', exact: true })).toBeFocused();
});

test('lets the owner receive a wish nobody gifted', async ({ page }) => {
  await page.goto('./#/wunsch/scarf');

  await page.getByRole('button', { name: 'Erhalten', exact: true }).click();

  await expect(page.getByText('Erfüllt', { exact: true })).toBeVisible();
});

test('keeps a received gift from being taken back', async ({ page }) => {
  await page.goto('./#/wunsch/kite');

  await expect(page.getByText('Erfüllt – von Anna', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Schenken zurücknehmen' })).toHaveCount(0);
});

test('shows the empty fulfilled wishes without a create button', async ({ page }) => {
  await page.goto('./#/liste/anniversary/erfuellt');

  await expect(page.getByText('Noch keine erfüllten Wünsche.')).toBeVisible();
  await expect(
    page.getByRole('main').locator('.button-row').getByRole('button', { name: 'Wunsch erstellen' }),
  ).toHaveCount(0);
});
