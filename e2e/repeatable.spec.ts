import { expect, test, type Page } from './fixtures';
import { expectAnnouncement } from './announcement';
import { seed, storedWishes, wishRecord } from './emulators';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const wishLink = (page: Page, name: string) =>
  page.getByRole('main').getByRole('button', { name: new RegExp(`^${name}`) });
const repeatableCheckbox = (page: Page) =>
  page.getByRole('checkbox', { name: 'Mehrmals schenkbar' });
const secretCheckbox = (page: Page) => page.getByRole('checkbox', { name: 'Geheim' });
const toggle = (page: Page, label: string) =>
  page.locator('label').filter({ hasText: label }).click();
const giftNote = (page: Page, text: string) => page.getByText(new RegExp(`${text}$`));
const actionButton = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

test.beforeEach(async () => {
  await seed({
    persons: [
      { id: 'ben', name: 'Ben' },
      { id: 'oma', name: 'Oma' },
    ],
    wishlists: [
      { id: 'bens', name: 'Weihnachten', ownerId: 'ben' },
      { id: 'mine', name: 'Geburtstag', ownerId: 'anna' },
    ],
    wishes: [
      wishRecord({
        id: 'chocolate',
        wishlistId: 'bens',
        name: 'Schokolade',
        createdBy: 'ben',
        repeatable: true,
      }),
      wishRecord({
        id: 'lamp',
        wishlistId: 'bens',
        name: 'Lampe',
        createdBy: 'ben',
        giverId: 'oma',
      }),
      wishRecord({
        id: 'gummies',
        wishlistId: 'mine',
        name: 'Gummibärchen',
        repeatable: true,
        gifts: [{ recordedBy: 'ben' }, { recordedBy: 'oma' }, { recordedBy: 'ben' }],
      }),
    ],
  });
});

test('creates a repeatable wish and shows it as repeatable', async ({ page }) => {
  await page.goto('./#/liste/mine/wunsch/neu');
  await expect(repeatableCheckbox(page)).not.toBeChecked();
  await expect(repeatableCheckbox(page)).toHaveAccessibleDescription(
    'Kann immer wieder geschenkt werden, z. B. Süßigkeiten.',
  );

  await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Kinder-Schokolade');
  await toggle(page, 'Mehrmals schenkbar');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Kinder-Schokolade')).toBeVisible();
  await expect(giftNote(page, 'mehrmals schenkbar')).toBeVisible();
  const stored = (await storedWishes()).find(({ name }) => name === 'Kinder-Schokolade');
  expect(stored).toMatchObject({ repeatable: true });

  await page.goto('./#/liste/mine');
  await expect(wishLink(page, 'Kinder-Schokolade')).toContainText('mehrmals schenkbar');
});

test('keeps secret and repeatable apart in the wishlist of someone else', async ({ page }) => {
  await page.goto('./#/liste/bens/wunsch/neu');

  await expect(secretCheckbox(page)).toBeChecked();
  await expect(repeatableCheckbox(page)).toBeDisabled();
  await expect(repeatableCheckbox(page)).toHaveAccessibleDescription(
    'Nicht zusammen mit „Geheim“ möglich.',
  );

  await toggle(page, 'Geheim');
  await toggle(page, 'Mehrmals schenkbar');

  await expect(repeatableCheckbox(page)).toBeChecked();
  await expect(secretCheckbox(page)).toBeDisabled();
  await expect(secretCheckbox(page)).toHaveAccessibleDescription(
    'Nicht zusammen mit „Mehrmals schenkbar“ möglich.',
  );
});

test('locks the repeatability of a gifted wish', async ({ page }) => {
  await page.goto('./#/wunsch/lamp/bearbeiten');

  await expect(repeatableCheckbox(page)).toBeDisabled();
  await expect(repeatableCheckbox(page)).toHaveAccessibleDescription(
    'Bereits geschenkt – erst zurücknehmen.',
  );
});

test('gifts a repeatable wish again and again and takes the latest gift back', async ({ page }) => {
  await page.goto('./#/wunsch/chocolate');
  await expect(giftNote(page, 'mehrmals schenkbar')).toBeVisible();

  await actionButton(page, 'Schenken').click();
  await expectAnnouncement(page, 'Als geschenkt markiert.');
  await expect(actionButton(page, 'Schenken')).toBeFocused();
  await actionButton(page, 'Schenken').click();

  await expect(giftNote(page, '2-mal geschenkt – von Anna')).toBeVisible();
  await expect(actionButton(page, 'Schenken zurücknehmen')).toBeVisible();

  await page.goto('./#/liste/bens');
  await expect(wishLink(page, 'Schokolade')).toContainText('2-mal geschenkt');
  await page.goto('./#/liste/bens/erfuellt');
  await expect(wishLink(page, 'Schokolade')).toContainText('2-mal geschenkt');

  await wishLink(page, 'Schokolade').click();
  await actionButton(page, 'Schenken zurücknehmen').click();

  await expectAnnouncement(page, 'Schenken zurückgenommen.');
  await expect(giftNote(page, '1-mal geschenkt – von Anna')).toBeVisible();
});

test('lets the owner receive a repeatable wish and undo only her own receipt', async ({ page }) => {
  await page.goto('./#/wunsch/gummies');
  await expect(giftNote(page, '3-mal geschenkt – von Ben, Oma')).toBeVisible();
  await expect(actionButton(page, 'Erhalten zurücknehmen')).toHaveCount(0);

  await actionButton(page, 'Erhalten').click();

  await expectAnnouncement(page, 'Als erhalten markiert.');
  await expect(giftNote(page, '4-mal geschenkt – von Ben, Oma')).toBeVisible();

  await actionButton(page, 'Erhalten zurücknehmen').click();

  await expect(giftNote(page, '3-mal geschenkt – von Ben, Oma')).toBeVisible();
  await expect(actionButton(page, 'Erhalten zurücknehmen')).toHaveCount(0);
});
