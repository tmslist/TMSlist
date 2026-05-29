import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://tmslist.com',
  output: 'server',
  adapter: node({
mode:'standalone',}),
  vite: {
    build: {
      chunkSizeWarningLimit: 2000,
      cssMinify: 'lightningcss',
      minify: 'esbuild',
      rollupOptions: {
        external: ['@vercel/blob'],
      },
    },
    optimizeDeps: {
      include: ['three', '@react-three/fiber', '@react-three/drei', 'its-fine'],
    },
    css: {
      devSourcemap: false,
    },
  },
  integrations: [
    react(),
  ],
  security: {
    checkOrigin: true,
  },
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
    concurrency: 8,
    assets: 'assets',
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
    prefetch: {
      '/': true,
      '/us/': true,
      '/treatments/': true,
      '/blog/': true,
      '/insurance/': true,
      '/quiz/': true,
    },
  },
});
