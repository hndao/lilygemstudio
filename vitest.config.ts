/**
 * Vitest configuration for dariiv-web frontend tests.
 *
 * We use jsdom to simulate the browser DOM so we can test HTML structure
 * and attribute correctness of the article-prose rendering. CSS media queries
 * cannot be evaluated in jsdom — those require Playwright (E2E).
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
        setupFiles: ['src/__tests__/setup.ts'],
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});

