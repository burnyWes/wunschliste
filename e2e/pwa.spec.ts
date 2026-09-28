import { expect, test } from '@playwright/test';

test('serves an installable web app manifest', async ({ request }) => {
  const response = await request.get('manifest.webmanifest');

  expect(response.ok()).toBe(true);
  expect(await response.json()).toMatchObject({ name: 'Wunschliste', display: 'standalone' });
});

test('serves the apple touch icon', async ({ request }) => {
  const response = await request.get('apple-touch-icon-180x180.png');

  expect(response.status()).toBe(200);
});
