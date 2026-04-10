// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://tmslist.com',
  adapter: vercel(),
  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
      cssMinify: true,
      minify: 'esbuild',
    },
  },
  integrations: [
    sitemap(),
    react(),
  ],
  security: {
    checkOrigin: true,
  },
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    concurrency: 4,
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
});
