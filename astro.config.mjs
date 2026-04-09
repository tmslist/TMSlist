// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://tmslist.com',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()],
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
    concurrency: 5,
  },
});
