import { expect, test } from './fixtures';

test('removes the local data of the previous version and keeps the color scheme', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'wunschliste.wishlists',
      JSON.stringify([{ id: 'old', name: 'Alte Liste' }]),
    );
    localStorage.setItem('wunschliste.colorScheme', 'light');
  });

  await page.goto('./');

  await expect(page.getByText('Noch keine Wunschlisten.')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('wunschliste.wishlists'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('wunschliste.colorScheme'))).toBe('light');
});
