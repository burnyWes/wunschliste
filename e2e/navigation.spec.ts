import { expect, test, type Page } from './fixtures';
import { seed } from './emulators';
import { historyLength } from './history';

const mainNavigation = (page: Page) => page.getByRole('navigation', { name: 'Hauptnavigation' });
const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });

test('starts on the wishlists page without moving focus', async ({ page }) => {
  await page.goto('./');

  await expect(mainNavigation(page).getByRole('button', { name: 'Wunschlisten' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page).toHaveTitle('Wunschlisten – Wunschliste');
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
  await expect(pageHeading(page, 'Wunschlisten')).not.toBeFocused();
});

test('does not move focus into the form when the app starts on it', async ({ page }) => {
  await page.goto('./#/liste/neu');

  await expect(pageHeading(page, 'Wunschliste erstellen')).toBeVisible();
  await expect(pageHeading(page, 'Wunschliste erstellen')).not.toBeFocused();
  await expect(page.getByRole('textbox', { name: 'Name' })).not.toBeFocused();
});

test('moves focus to the heading of each newly shown page', async ({ page }) => {
  await page.goto('./');
  const startLength = await historyLength(page);

  await mainNavigation(page).getByRole('button', { name: 'Einstellungen' }).click();

  await expect(page).toHaveURL(/#\/einstellungen$/);
  await expect(pageHeading(page, 'Einstellungen')).toBeFocused();
  await expect(mainNavigation(page).getByRole('button', { name: 'Einstellungen' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(
    mainNavigation(page).getByRole('button', { name: 'Wunschlisten' }),
  ).not.toHaveAttribute('aria-current');
  await expect(page).toHaveTitle('Einstellungen – Wunschliste');

  await mainNavigation(page).getByRole('button', { name: 'Wunschlisten' }).click();

  await expect(pageHeading(page, 'Wunschlisten')).toBeFocused();
  expect(await historyLength(page)).toBe(startLength);
});

for (const path of ['./', './#/einstellungen']) {
  test(`shows the main navigation on the main page ${path}`, async ({ page }) => {
    await page.goto(path);

    await expect(mainNavigation(page)).toBeVisible();
  });
}

for (const path of ['./#/liste/birthday', './#/liste/neu']) {
  test(`hides the main navigation on the sub page ${path}`, async ({ page }) => {
    await seed({ wishlists: [{ id: 'birthday', name: 'Geburtstag' }] });
    await page.goto(path);

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(mainNavigation(page)).toHaveCount(0);
  });
}

test('gives both navigation buttons the same width', async ({ page }) => {
  await page.goto('./');
  await expect(mainNavigation(page).getByRole('button')).toHaveCount(2);

  const widths = await mainNavigation(page)
    .getByRole('button')
    .evaluateAll((buttons) => buttons.map((button) => button.getBoundingClientRect().width));

  expect(widths).toHaveLength(2);
  expect(Math.abs(widths[0] - widths[1])).toBeLessThan(1);
});

test('redirects unknown addresses to the wishlists page', async ({ page }) => {
  await page.goto('./#/quatsch');

  await expect(page).toHaveURL(/#\/$/);
  await expect(pageHeading(page, 'Wunschlisten')).toBeVisible();
});

test('keeps the navigation in view while scrolling', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    const tallContent = document.createElement('div');
    tallContent.style.height = '300vh';
    document.querySelector('main')?.append(tallContent);
    window.scrollTo(0, document.body.scrollHeight);
  });

  await expect(mainNavigation(page)).toBeInViewport();
});
