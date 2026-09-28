import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { seed, type SeedData } from './seed';

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

async function submitInvalidWish(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Preis in Euro' }).fill('abc');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Bitte einen Namen eingeben.')).toBeVisible();
}

async function openDeletionDialog(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Wunschliste löschen' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
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
    name: 'edit wish',
    path: './#/wunsch/helmet/bearbeiten',
    heading: 'Wunsch bearbeiten',
    data: wishlistWithWishes,
  },
];

const colorSchemes = ['dark', 'light', 'inverted'];

for (const colorScheme of colorSchemes) {
  for (const { name, path, heading, data, prepare } of pages) {
    test(`${name} page in the ${colorScheme} scheme has no accessibility violations`, async ({
      page,
    }) => {
      await page.addInitScript((scheme) => {
        localStorage.setItem('wunschliste.colorScheme', scheme);
      }, colorScheme);
      if (data) {
        await seed(page, data);
      }
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await prepare?.(page);

      const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
