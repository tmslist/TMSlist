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
      cssMinify: true,
      minify: 'esbuild',
      rollupOptions: {
        external: ['@vercel/blob'],
      },
    },
    optimizeDeps: {
      include: ['three', '@react-three/fiber', '@react-three/drei', 'its-fine'],
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
    concurrency: 4,
  },
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
    prefetch: {
      '/': true,
      '/us/': true,
    },
  },
});
