import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const WCAG_21_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const pages = [
  { path: './', heading: 'Wunschlisten' },
  { path: './#/einstellungen', heading: 'Einstellungen' },
];

const colorSchemes = ['dark', 'light', 'inverted'];

for (const colorScheme of colorSchemes) {
  for (const { path, heading } of pages) {
    test(`${heading} page in the ${colorScheme} scheme has no accessibility violations`, async ({
      page,
    }) => {
      await page.addInitScript((scheme) => {
        localStorage.setItem('wunschliste.colorScheme', scheme);
      }, colorScheme);
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();

      const results = await new AxeBuilder({ page }).withTags(WCAG_21_AA).analyze();

      expect(results.violations).toEqual([]);
    });
  }
}
