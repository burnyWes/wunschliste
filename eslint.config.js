import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import architectureConfig from './eslint.architecture.config.js';

export default defineConfig(
  { ignores: ['dist', 'dist-e2e', 'dev-dist', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  tseslint.configs.recommended,
  svelte.configs['flat/recommended'],
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  {
    files: ['e2e/**/*.ts'],
    rules: { 'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }] },
  },
  architectureConfig,
);
