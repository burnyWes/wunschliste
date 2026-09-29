import { test as base, expect, type Page } from '@playwright/test';
import {
  createAccount,
  FAMILY,
  familyAccountUid,
  resetAuth,
  resetFirestore,
  seed,
  type PersonRecord,
} from './emulators';

export { expect };
export type { Page } from '@playwright/test';

export type Profile = 'Anna' | null;

export const ANNA: PersonRecord = { id: 'anna', name: 'Anna' };

type Credentials = { email: string; password: string };

export async function submitSignIn(page: Page, account: Credentials = FAMILY): Promise<void> {
  await page.getByLabel('E-Mail').fill(account.email);
  await page.getByLabel('Passwort').fill(account.password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
}

export async function chooseProfile(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('heading', { level: 1, name: 'Wer bist du?' })).toBeVisible();
  await page.getByRole('main').getByRole('button', { name, exact: true }).click();
}

export async function signIn(
  page: Page,
  account: Credentials = FAMILY,
  profile: Profile = 'Anna',
): Promise<void> {
  await page.goto('./');
  await submitSignIn(page, account);
  if (profile === null) {
    await expect(page.getByRole('heading', { level: 1, name: 'Wer bist du?' })).toBeVisible();
    return;
  }
  await chooseProfile(page, profile);
  await expect(page.getByRole('heading', { level: 1, name: 'Wunschlisten' })).toBeVisible();
}

export const test = base.extend<{ signedIn: boolean; profile: Profile; freshEmulators: void }>({
  signedIn: [true, { option: true }],
  profile: ['Anna', { option: true }],
  freshEmulators: [
    async ({ profile }, use) => {
      await resetAuth();
      await resetFirestore();
      await createAccount({ uid: familyAccountUid(), ...FAMILY });
      if (profile !== null) {
        await seed({ persons: [ANNA] });
      }
      await use();
    },
    { auto: true },
  ],
  page: async ({ page, signedIn, profile }, use) => {
    if (signedIn) {
      await signIn(page, FAMILY, profile);
      await page.goto('about:blank');
    }
    await use(page);
  },
});
