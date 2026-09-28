import { svelte } from '@sveltejs/vite-plugin-svelte';
import { VitePWA } from 'vite-plugin-pwa';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { requireProductionFirebaseEnvironment } from './build/firebaseEnvironment.ts';

export default defineConfig(({ command, mode }) => {
  if (command === 'build' && mode === 'production') {
    requireProductionFirebaseEnvironment(loadEnv(mode, process.cwd(), 'VITE_FIREBASE_'));
  }
  return {
    base: '/wunschliste/',
    plugins: [
      svelte(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png'],
        manifest: {
          name: 'Wunschliste',
          short_name: 'Wunschliste',
          lang: 'de',
          display: 'standalone',
          background_color: '#000000',
          theme_color: '#000000',
          icons: [
            { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'] },
      }),
    ],
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'unit',
            include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
            exclude: ['**/*.integration.test.ts'],
            environment: 'node',
          },
        },
        {
          extends: true,
          test: {
            name: 'integration',
            include: ['tests/integration/**/*.integration.test.ts'],
            environment: 'node',
            fileParallelism: false,
          },
        },
      ],
    },
  };
});
