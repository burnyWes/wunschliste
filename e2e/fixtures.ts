import { test as base, expect, type Page } from '@playwright/test';
import { createAccount, FAMILY, familyAccountUid, resetAuth } from './emulators';

export { expect };
export type { Page } from '@playwright/test';

export async function signIn(page: Page, account: { email: string; password: string } = FAMILY) {
  await page.goto('./');
  await page.getByLabel('E-Mail').fill(account.email);
  await page.getByLabel('Passwort').fill(account.password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Wunschlisten' })).toBeVisible();
}

export const test = base.extend<{ signedIn: boolean; freshEmulators: void }>({
  signedIn: [true, { option: true }],
  freshEmulators: [
    async ({}, use) => {
      await resetAuth();
      await createAccount({ uid: familyAccountUid(), ...FAMILY });
      await use();
    },
    { auto: true },
  ],
  page: async ({ page, signedIn }, use) => {
    if (signedIn) {
      await signIn(page);
      await page.goto('about:blank');
    }
    await use(page);
  },
});
