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

const outwardTo = (layers = ['']) => ({
  regex: `(^|/)(${layers.join('|')})(/|$)`,
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
    files: ['src/**/application/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [nonRelativeImport, outwardTo(['infrastructure', 'app'])] },
      ],
    },
  },
  {
    files: ['src/**/application/**/*.test.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [outwardTo(['infrastructure', 'app'])] }],
    },
  },
  {
    files: ['src/**/domain/**/*.{ts,svelte}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [nonRelativeImport, outwardTo(['application', 'infrastructure', 'app'])] },
      ],
    },
  },
  {
    files: ['src/**/domain/**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [outwardTo(['application', 'infrastructure', 'app'])] },
      ],
    },
  },
);
