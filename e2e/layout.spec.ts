import { expect, test, type Page } from './fixtures';

const actionBar = (page: Page) => page.locator('.action-bar');

async function bottomGapOf(page: Page): Promise<number> {
  return actionBar(page).evaluate((bar) => window.innerHeight - bar.getBoundingClientRect().bottom);
}

test('pins the action bar to the bottom of the viewport below short content', async ({ page }) => {
  await page.goto('./#/liste/neu');

  await expect(actionBar(page)).toBeInViewport();
  expect(Math.abs(await bottomGapOf(page))).toBeLessThan(1);
});

test('keeps the action bar at the bottom of the viewport while scrolling tall content', async ({
  page,
}) => {
  await page.goto('./#/liste/neu');
  await page.evaluate(() => {
    const tallContent = document.createElement('div');
    tallContent.style.height = '300vh';
    document.querySelector('.action-bar')?.before(tallContent);
    window.scrollTo(0, document.body.scrollHeight / 2);
  });

  await expect(actionBar(page)).toBeInViewport();
  expect(Math.abs(await bottomGapOf(page))).toBeLessThan(1);
});

test('centers the buttons in the action bar', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'wunschliste.wishlists',
      JSON.stringify([{ id: 'b', name: 'Geburtstag' }]),
    );
  });
  await page.goto('./#/liste/b/wunsch/neu');

  const offCenter = await actionBar(page).evaluate((bar) => {
    const barBox = bar.getBoundingClientRect();
    const buttonBoxes = [...bar.querySelectorAll('.button')].map((button) =>
      button.getBoundingClientRect(),
    );
    const left = Math.min(...buttonBoxes.map((box) => box.left));
    const right = Math.max(...buttonBoxes.map((box) => box.right));
    return Math.abs((left + right) / 2 - (barBox.left + barBox.right) / 2);
  });

  expect(offCenter).toBeLessThan(1);
});

test('lets the action bar flow to the end of the form while the keyboard is open', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const fakeViewport = Object.assign(new EventTarget(), {
      height: window.innerHeight,
      width: window.innerWidth,
      scale: 1,
    });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: fakeViewport });
  });
  await page.goto('./#/liste/neu');
  await expect(actionBar(page)).not.toHaveClass(/action-bar--in-flow/);

  await page.evaluate(() => {
    const viewport = window.visualViewport as VisualViewport & { height: number };
    viewport.height = window.innerHeight - 300;
    viewport.dispatchEvent(new Event('resize'));
  });

  await expect(actionBar(page)).toHaveClass(/action-bar--in-flow/);
  await expect(actionBar(page)).toHaveCSS('position', 'static');
});

test('keeps buttons free of text selection and double tap zoom', async ({ page }) => {
  await page.goto('./');

  const userSelect = await page
    .locator('.button')
    .first()
    .evaluate((button) => {
      const computed = getComputedStyle(button);
      return computed.userSelect || computed.webkitUserSelect;
    });

  expect(userSelect).toBe('none');
  await expect(page.locator('html')).toHaveCSS('touch-action', 'manipulation');
});
