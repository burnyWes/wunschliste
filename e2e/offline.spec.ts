import { devices, type Browser } from '@playwright/test';
import { expectAnnouncement } from './announcement';
import { seed } from './emulators';
import { expect, signIn, test, type Page } from './fixtures';

const SYNC_TIMEOUT = { timeout: 15_000 };
const OFFLINE_TEXT = 'Offline – Änderungen werden später abgeglichen.';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const offlineNotice = (page: Page) => page.getByRole('status').filter({ hasText: OFFLINE_TEXT });
const mainButton = (page: Page, name: string | RegExp) =>
  page.getByRole('main').getByRole('button', { name });

async function signedInDevice(browser: Browser, baseURL: string | undefined): Promise<Page> {
  const context = await browser.newContext({ ...devices['iPhone 15'], baseURL });
  const page = await context.newPage();
  await signIn(page);
  return page;
}

test.beforeEach(async () => {
  await seed({ wishlists: [{ id: 'birthday', name: 'Geburtstag', ownerId: 'anna' }] });
});

test('points out the missing connection and hides the notice once back online', async ({
  page,
  context,
}) => {
  await page.goto('./');
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  await expect(offlineNotice(page)).toHaveCount(0);

  await context.setOffline(true);

  await expect(offlineNotice(page)).toBeVisible();

  await context.setOffline(false);

  await expect(offlineNotice(page)).toHaveCount(0);
});

test('keeps working offline and syncs once back online', async ({ browser, baseURL }) => {
  const deviceA = await signedInDevice(browser, baseURL);
  const deviceB = await signedInDevice(browser, baseURL);
  await deviceA.goto('./#/liste/birthday');
  await deviceB.goto('./#/liste/birthday/erfuellt');
  await expect(pageHeading(deviceA, 'Geburtstag')).toBeVisible();
  await expect(pageHeading(deviceB, 'Geburtstag')).toBeVisible();
  await deviceA.context().setOffline(true);

  await deviceA.getByRole('button', { name: 'Wunsch erstellen' }).first().click();
  await deviceA.getByRole('textbox', { name: 'Name', exact: true }).fill('Fahrradhelm');
  await deviceA.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(deviceA, 'Fahrradhelm')).toBeVisible();

  await deviceA.getByRole('button', { name: 'Schenken', exact: true }).click();

  await expectAnnouncement(deviceA, 'Als erfüllt markiert.');
  await expect(mainButton(deviceB, /^Fahrradhelm/)).toHaveCount(0);

  await deviceA.context().setOffline(false);

  await expect(mainButton(deviceB, /^Fahrradhelm/)).toBeVisible(SYNC_TIMEOUT);

  await deviceA.context().close();
  await deviceB.context().close();
});

test('deletes a wishlist offline and shows the overview at once', async ({ page, context }) => {
  await page.goto('./#/liste/birthday/bearbeiten');
  await expect(pageHeading(page, 'Wunschliste bearbeiten')).toBeVisible();
  await context.setOffline(true);

  await page.getByRole('button', { name: 'Wunschliste löschen' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Löschen' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  await expect(mainButton(page, 'Geburtstag')).toHaveCount(0);
  await context.setOffline(false);
});
