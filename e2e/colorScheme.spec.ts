import { expect, test, type Page } from './fixtures';

const BLACK = 'rgb(0, 0, 0)';
const WHITE = 'rgb(255, 255, 255)';
const ROYAL_BLUE = 'rgb(0, 35, 102)';
const INVERTED_ROYAL_BLUE = 'rgb(255, 220, 153)';

const schemeOption = (page: Page, label: string) => page.getByRole('radio', { name: label });

async function tapSchemeRow(page: Page, label: string): Promise<void> {
  await page.locator('label').filter({ hasText: label }).click();
}

async function backgroundOf(page: Page, selector: string): Promise<string> {
  return page
    .locator(selector)
    .first()
    .evaluate((element) => getComputedStyle(element).backgroundColor);
}

async function systemBarColorOf(page: Page): Promise<string> {
  return page.locator('meta[name="theme-color"]').evaluate((meta) => {
    const probe = document.createElement('span');
    probe.style.color = meta.getAttribute('content') ?? '';
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  });
}

test.beforeEach(async ({ page }) => {
  await page.goto('./#/einstellungen');
});

test('uses the dark scheme by default', async ({ page }) => {
  await expect(schemeOption(page, 'Dunkel')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'dark');
  expect(await backgroundOf(page, 'body')).toBe(BLACK);
});

test('keeps the chosen light scheme after a restart', async ({ page }) => {
  await tapSchemeRow(page, 'Hell');

  expect(await backgroundOf(page, 'body')).toBe(WHITE);

  await page.reload();

  await expect(schemeOption(page, 'Hell')).toBeChecked();
  expect(await backgroundOf(page, 'body')).toBe(WHITE);
});

test('applies the stored scheme before the application starts', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('wunschliste.colorScheme', 'light'));
  await page.route('**/assets/*.js', (route) => route.abort());

  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
});

test('fills only the button of the current page', async ({ page }) => {
  expect(await backgroundOf(page, 'nav button[aria-current="page"]')).toBe(ROYAL_BLUE);
  expect(await backgroundOf(page, 'nav button:not([aria-current])')).toBe(BLACK);
});

test('fills the current page button with the inverse of royal blue in the inverted scheme', async ({
  page,
}) => {
  await tapSchemeRow(page, 'Invertiert');

  expect(await backgroundOf(page, 'nav button[aria-current="page"]')).toBe(INVERTED_ROYAL_BLUE);
  expect(await backgroundOf(page, 'nav button:not([aria-current])')).toBe(WHITE);
});

for (const label of ['Hell', 'Invertiert']) {
  test(`keeps the status bar backdrop black in the ${label} scheme`, async ({ page }) => {
    await tapSchemeRow(page, label);

    expect(await backgroundOf(page, '.status-bar-backdrop')).toBe(BLACK);
  });
}

for (const { label, background } of [
  { label: 'Dunkel', background: BLACK },
  { label: 'Hell', background: WHITE },
  { label: 'Invertiert', background: WHITE },
]) {
  test(`tints the system bars with the background of the ${label} scheme`, async ({ page }) => {
    await tapSchemeRow(page, label);

    await expect.poll(() => systemBarColorOf(page)).toBe(background);
  });
}

test('tints the system bars with the stored scheme after a restart', async ({ page }) => {
  await tapSchemeRow(page, 'Hell');

  await page.reload();

  await expect.poll(() => systemBarColorOf(page)).toBe(WHITE);
});

test('switches the scheme with the arrow keys', async ({ page }) => {
  await schemeOption(page, 'Dunkel').focus();

  await page.keyboard.press('ArrowDown');

  await expect(schemeOption(page, 'Hell')).toBeChecked();
  await expect(page.locator('html')).toHaveAttribute('data-color-scheme', 'light');
});
