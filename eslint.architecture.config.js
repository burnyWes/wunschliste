import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import tseslint from 'typescript-eslint';

const sourceParserSetup = defineConfig(
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
  },
  svelte.configs['flat/base'],
  {
    files: ['src/**/*.svelte', 'src/**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
);

const nonRelativeImport = { regex: '^[^.]', message: 'Only relative imports inside this layer.' };

const firebasePackages = {
  regex: '^(firebase|@firebase)(/|$)',
  message: 'Firebase belongs to infrastructure and app only.',
};

/** @param {string[]} layers */
const outwardTo = (layers) => ({
  regex: `^\\.\\.?/(.*/)?(${layers.join('|')})(/|$)`,
  message: `Must not depend on ${layers.join(', ')}.`,
});

export default defineConfig(
  sourceParserSetup,
  {
    files: ['src/wishlist/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [outwardTo(['app'])] }],
    },
  },
  {
    files: ['src/shared/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [outwardTo(['app', 'wishlist']), firebasePackages] },
      ],
    },
  },
  {
    files: ['src/**/application/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [nonRelativeImport, outwardTo(['infrastructure', 'app', 'shared/ui'])] },
      ],
    },
  },
  {
    files: ['src/**/application/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [outwardTo(['infrastructure', 'app', 'shared/ui']), firebasePackages] },
      ],
    },
  },
  {
    files: ['src/**/domain/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            nonRelativeImport,
            outwardTo(['application', 'infrastructure', 'app', 'shared/ui']),
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/domain/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            outwardTo(['application', 'infrastructure', 'app', 'shared/ui']),
            firebasePackages,
          ],
        },
      ],
    },
  },
);
