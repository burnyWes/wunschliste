import { devices, type Browser } from '@playwright/test';
import { seed } from './emulators';
import { expect, signIn, test, type Page } from './fixtures';

test.use({ signedIn: false });

test.beforeEach(async () => {
  await seed({ persons: [{ id: 'ben', name: 'Ben' }] });
});

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const mainButton = (page: Page, name: string | RegExp) =>
  page.getByRole('main').getByRole('button', { name });

async function signedInDevice(browser: Browser, baseURL: string | undefined): Promise<Page> {
  const context = await browser.newContext({ ...devices['iPhone 15'], baseURL });
  const page = await context.newPage();
  await signIn(page);
  return page;
}

test('shows the changes of one device on another without reloading', async ({
  browser,
  baseURL,
}) => {
  const deviceA = await signedInDevice(browser, baseURL);
  const deviceB = await signedInDevice(browser, baseURL);

  await deviceA.getByRole('button', { name: 'Wunschliste erstellen' }).first().click();
  await deviceA.getByRole('textbox', { name: 'Name' }).fill('Geburtstag 2027');
  await deviceA.locator('label').filter({ hasText: 'Ben' }).click();
  await deviceA.getByRole('button', { name: 'Erstellen' }).click();
  await expect(pageHeading(deviceA, 'Geburtstag 2027')).toBeVisible();

  await mainButton(deviceB, 'Geburtstag 2027').click();
  await expect(pageHeading(deviceB, 'Geburtstag 2027')).toBeVisible();

  await deviceA.getByRole('button', { name: 'Wunsch erstellen' }).first().click();
  await deviceA.getByRole('textbox', { name: 'Name', exact: true }).fill('Fahrradhelm');
  await deviceA.getByRole('button', { name: 'Speichern' }).click();
  await expect(pageHeading(deviceA, 'Fahrradhelm')).toBeVisible();

  await expect(mainButton(deviceB, /^Fahrradhelm/)).toBeVisible();

  await deviceA.getByRole('button', { name: 'Schenken', exact: true }).click();

  await expect(mainButton(deviceB, /^Fahrradhelm/)).toHaveCount(0);
  await deviceB.getByRole('button', { name: /^Erfüllt( \d+)?$/ }).click();
  await expect(mainButton(deviceB, /^Fahrradhelm/)).toBeVisible();

  await deviceA.context().close();
  await deviceB.context().close();
});
