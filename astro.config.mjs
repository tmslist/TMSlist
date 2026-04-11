// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://tmslist.com',
  output: 'server',
  adapter: vercel(),
  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
      cssMinify: true,
      minify: 'esbuild',
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/admin/') &&
        !page.includes('/portal/') &&
        !page.includes('/owner/') &&
        !page.includes('/account/') &&
        !page.includes('/thank-you') &&
        !page.includes('/unsubscribe'),
    }),
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
