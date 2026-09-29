import { expect, test, type Page } from './fixtures';
import { seed, storedWishes, type WishRecord } from './emulators';

const pageHeading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const field = (page: Page, name: string) => page.getByRole('textbox', { name, exact: true });

const birthday = { id: 'birthday', name: 'Geburtstag' };

async function chooseRating(page: Page, label: string): Promise<void> {
  await page.locator('label').filter({ hasText: label }).click();
}

test.beforeEach(async () => {
  await seed({ wishlists: [birthday] });
});

test('creates a wish with every field and shows its details', async ({ page }) => {
  await page.goto('./#/liste/birthday');
  await page.getByRole('button', { name: 'Wunsch erstellen' }).first().click();

  await expect(pageHeading(page, 'Wunsch erstellen')).toBeVisible();
  await expect(field(page, 'Name')).toBeFocused();
  await field(page, 'Name').fill('Fahrradhelm');
  await field(page, 'Link').fill('amazon.de/helm');
  await field(page, 'Beschreibung').fill('Größe M,\ngern in Dunkelblau.');
  await field(page, 'Preis in Euro').fill('49,99');
  await chooseRating(page, 'unbedingt');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Fahrradhelm')).toBeFocused();
  await expect(page.getByText(/★★★\s*unbedingt\s*·\s*49,99\s€/)).toBeVisible();
  await expect(page.getByText('gern in Dunkelblau.')).toBeVisible();
  const offer = page.getByRole('link', { name: 'Zum Angebot auf amazon.de' });
  await expect(offer).toHaveAttribute('href', 'https://amazon.de/helm');
  await expect(offer).toHaveAttribute('target', '_blank');

  await page.getByRole('button', { name: 'Zurück zu Geburtstag' }).click();

  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();
});

test('shows neither offer link nor summary for a wish with only a name', async ({ page }) => {
  await page.goto('./#/liste/birthday/wunsch/neu');

  await field(page, 'Name').fill('Buch');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(pageHeading(page, 'Buch')).toBeVisible();
  await expect(page.getByRole('link', { name: /Zum Angebot/ })).toHaveCount(0);
  await expect(page.getByRole('main')).not.toContainText('€');
  await expect(page.getByRole('main')).not.toContainText('★');
});

test('points out every problem and focuses the name', async ({ page }) => {
  await page.goto('./#/liste/birthday/wunsch/neu');

  await field(page, 'Preis in Euro').fill('abc');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByText('Bitte einen Namen eingeben.')).toBeVisible();
  await expect(page.getByText('Bitte einen Betrag wie 49,99 eingeben.')).toBeVisible();
  await expect(field(page, 'Preis in Euro')).toHaveAttribute('aria-invalid', 'true');
  await expect(field(page, 'Name')).toBeFocused();
});

test.describe('with wishes of different ratings', () => {
  const wishes: WishRecord[] = [
    { id: 'book', wishlistId: 'birthday', name: 'Buch', gifted: false },
    { id: 'tent', wishlistId: 'birthday', name: 'Zelt', rating: 'nice', gifted: false },
    {
      id: 'helmet',
      wishlistId: 'birthday',
      name: 'Fahrradhelm',
      rating: 'essential',
      priceInCents: 4999,
      gifted: false,
    },
  ];

  test.beforeEach(async () => {
    await seed({ wishlists: [birthday], wishes });
  });

  test('lists them in the order of their rating', async ({ page }) => {
    await page.goto('./#/liste/birthday');

    const names = page.getByRole('main').getByRole('listitem').locator('.wish-name');
    await expect(names).toHaveText(['Fahrradhelm', 'Zelt', 'Buch']);
  });

  test('names each entry without the stars', async ({ page }) => {
    await page.goto('./#/liste/birthday');

    await expect(page.getByRole('button', { name: /^Fahrradhelm/ })).toHaveAccessibleName(
      /^Fahrradhelm unbedingt 49,99\s€$/,
    );
  });
});

test('goes back to the wishlist on cancel without creating anything', async ({ page }) => {
  await page.goto('./#/liste/birthday');
  await page.getByRole('button', { name: 'Wunsch erstellen' }).first().click();
  await field(page, 'Name').fill('Verworfen');

  await page.getByRole('button', { name: 'Abbrechen' }).click();

  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();
  await expect(page.getByText('Verworfen')).toHaveCount(0);
  expect(await storedWishes()).toEqual([]);
});

test('stays in the app when cancelling a form opened directly', async ({ page }) => {
  await page.goto('./#/liste/birthday/wunsch/neu');

  await page.getByRole('button', { name: 'Abbrechen' }).click();

  await expect(page).toHaveURL(/#\/liste\/birthday$/);
  await expect(pageHeading(page, 'Geburtstag')).toBeVisible();
});

test('explains an unknown wish', async ({ page }) => {
  await page.goto('./#/wunsch/gibtsnicht');

  await expect(page.getByText('Diesen Wunsch gibt es nicht mehr.')).toBeVisible();
});
