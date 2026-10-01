import { expect, test, type Page } from './fixtures';

type Outcome = 'accepted' | 'dismissed';

const installSection = (page: Page) => page.getByRole('region', { name: 'App installieren' });

async function offerInstallationAnswering(page: Page, outcome: Outcome): Promise<void> {
  await page.evaluate((outcome) => {
    const installPrompt = Object.assign(new Event('beforeinstallprompt'), {
      prompt: async () => {
        document.documentElement.dataset.installPrompted = 'true';
      },
      userChoice: Promise.resolve({ outcome }),
    });
    window.dispatchEvent(installPrompt);
  }, outcome);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#/einstellungen');
  await expect(page.getByRole('heading', { level: 1, name: 'Einstellungen' })).toBeVisible();
});

test('hides the installation where the browser does not offer it', async ({ page }) => {
  await expect(installSection(page)).toHaveCount(0);
});

test('offers the installation when the browser allows it', async ({ page }) => {
  await offerInstallationAnswering(page, 'accepted');

  await expect(installSection(page).getByRole('button', { name: 'Installieren' })).toBeVisible();
});

test('shows the install prompt of the browser and confirms the installation', async ({ page }) => {
  await offerInstallationAnswering(page, 'accepted');

  await installSection(page).getByRole('button', { name: 'Installieren' }).click();

  await expect(page.locator('html')).toHaveAttribute('data-install-prompted', 'true');
  await expect(page.getByText('Die Wunschliste wird installiert')).toBeFocused();
});

test('points to the browser menu when the installation is dismissed', async ({ page }) => {
  await offerInstallationAnswering(page, 'dismissed');

  await installSection(page).getByRole('button', { name: 'Installieren' }).click();

  await expect(page.getByText('Installation abgebrochen.')).toBeFocused();
});

test('hides the installation once the app is installed from the browser menu', async ({ page }) => {
  await offerInstallationAnswering(page, 'accepted');

  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));

  await expect(installSection(page)).toHaveCount(0);
});
