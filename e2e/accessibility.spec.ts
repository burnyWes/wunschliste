import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { seed, type SeedData } from './seed';

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const twoWishlists: SeedData = {
  wishlists: [
    { id: 'birthday', name: 'Geburtstag 2027' },
    { id: 'christmas', name: 'Weihnachten' },
  ],
};

type CheckedPage = { name: string; path: string; heading: string; data?: SeedData };

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
];

const colorSchemes = ['dark', 'light', 'inverted'];

for (const colorScheme of colorSchemes) {
  for (const { name, path, heading, data } of pages) {
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

      const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
