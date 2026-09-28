import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import architectureConfig from './eslint.architecture.config.js';

export default defineConfig(
  { ignores: ['dist', 'dev-dist', 'playwright-report', 'test-results'] },
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
  architectureConfig,
);
