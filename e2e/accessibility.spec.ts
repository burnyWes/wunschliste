import AxeBuilder from '@axe-core/playwright';
import { FAMILY, seed, type SeedData } from './emulators';
import { expect, test, type Page } from './fixtures';

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const twoWishlists: SeedData = {
  wishlists: [
    { id: 'birthday', name: 'Geburtstag 2027' },
    { id: 'christmas', name: 'Weihnachten' },
  ],
};

const wishlistWithWishes: SeedData = {
  wishlists: twoWishlists.wishlists,
  wishes: [
    {
      id: 'helmet',
      wishlistId: 'birthday',
      name: 'Fahrradhelm',
      link: 'https://www.amazon.de/helm',
      description: 'Größe M,\ngern in Dunkelblau.',
      priceInCents: 4999,
      rating: 'essential',
      gifted: false,
    },
    { id: 'book', wishlistId: 'birthday', name: 'Buch', priceInCents: 1200, gifted: false },
  ],
};

const wishlistWithGiftedWish: SeedData = {
  wishlists: twoWishlists.wishlists,
  wishes: [
    ...(wishlistWithWishes.wishes ?? []),
    { id: 'tent', wishlistId: 'birthday', name: 'Zelt', rating: 'nice', gifted: true },
  ],
};

async function submitInvalidWish(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Preis in Euro' }).fill('abc');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Bitte einen Namen eingeben.')).toBeVisible();
}

async function openDeletionDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Wunschliste löschen' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function openSignOutDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Abmelden' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

async function submitWrongPassword(page: Page): Promise<void> {
  await page.getByLabel('E-Mail').fill(FAMILY.email);
  await page.getByLabel('Passwort').fill('falsch-123');
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await expect(page.getByRole('alert')).toHaveText('E-Mail oder Passwort stimmt nicht.');
}

type CheckedPage = {
  name: string;
  path: string;
  heading: string;
  data?: SeedData;
  prepare?: (page: Page) => Promise<void>;
};

const pages: CheckedPage[] = [
  { name: 'empty overview', path: './', heading: 'Wunschlisten' },
  { name: 'settings', path: './#/einstellungen', heading: 'Einstellungen' },
  {
    name: 'settings with sign-out dialog',
    path: './#/einstellungen',
    heading: 'Einstellungen',
    prepare: openSignOutDialog,
  },
  { name: 'overview', path: './', heading: 'Wunschlisten', data: twoWishlists },
  { name: 'create wishlist', path: './#/liste/neu', heading: 'Wunschliste erstellen' },
  {
    name: 'wishlist',
    path: './#/liste/birthday',
    heading: 'Geburtstag 2027',
    data: twoWishlists,
  },
  { name: 'not found', path: './#/liste/gibtsnicht', heading: 'Nicht gefunden' },
  {
    name: 'wishlist with wishes',
    path: './#/liste/birthday',
    heading: 'Geburtstag 2027',
    data: wishlistWithWishes,
  },
  {
    name: 'wish',
    path: './#/wunsch/helmet',
    heading: 'Fahrradhelm',
    data: wishlistWithWishes,
  },
  {
    name: 'create wish with problems',
    path: './#/liste/birthday/wunsch/neu',
    heading: 'Wunsch erstellen',
    data: twoWishlists,
    prepare: submitInvalidWish,
  },
  {
    name: 'edit wishlist',
    path: './#/liste/birthday/bearbeiten',
    heading: 'Wunschliste bearbeiten',
    data: wishlistWithWishes,
  },
  {
    name: 'deletion dialog',
    path: './#/liste/birthday/bearbeiten',
    heading: 'Wunschliste bearbeiten',
    data: wishlistWithWishes,
    prepare: openDeletionDialog,
  },
  {
    name: 'fulfilled wishes',
    path: './#/liste/birthday/erfuellt',
    heading: 'Geburtstag 2027',
    data: wishlistWithGiftedWish,
  },
  {
    name: 'gifted wish',
    path: './#/wunsch/tent',
    heading: 'Zelt',
    data: wishlistWithGiftedWish,
  },
  {
    name: 'edit wish',
    path: './#/wunsch/helmet/bearbeiten',
    heading: 'Wunsch bearbeiten',
    data: wishlistWithWishes,
  },
];

const signedOutPages: CheckedPage[] = [
  { name: 'sign-in', path: './', heading: 'Anmelden' },
  { name: 'sign-in with problem', path: './', heading: 'Anmelden', prepare: submitWrongPassword },
];

const offerLinkOnly: { name: string; path: string; heading: string; links: string[] }[] = [
  { name: 'overview', path: './', heading: 'Wunschlisten', links: [] },
  { name: 'wishlist', path: './#/liste/birthday', heading: 'Geburtstag 2027', links: [] },
  {
    name: 'wish',
    path: './#/wunsch/helmet',
    heading: 'Fahrradhelm',
    links: ['Zum Angebot auf amazon.de'],
  },
];

for (const { name, path, heading, links } of offerLinkOnly) {
  test(`${name} page offers buttons instead of links inside the app`, async ({ page }) => {
    await seed(wishlistWithWishes);
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

    const linkNames = await page
      .getByRole('link')
      .evaluateAll((elements) => elements.map((element) => element.textContent?.trim()));

    expect(linkNames).toEqual(links);
  });
}

const colorSchemes = ['dark', 'light', 'inverted'];

function checkAccessibility(checkedPages: readonly CheckedPage[]): void {
  for (const colorScheme of colorSchemes) {
    for (const { name, path, heading, data, prepare } of checkedPages) {
      test(`${name} page in the ${colorScheme} scheme has no accessibility violations`, async ({
        page,
      }) => {
        await page.addInitScript((scheme) => {
          localStorage.setItem('wunschliste.colorScheme', scheme);
        }, colorScheme);
        if (data) {
          await seed(data);
        }
        await page.goto(path);
        await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
        await prepare?.(page);

        const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA).analyze();

        expect(results.violations).toEqual([]);
      });
    }
  }
}

checkAccessibility(pages);

test.describe('signed out', () => {
  test.use({ signedIn: false });

  checkAccessibility(signedOutPages);
});
