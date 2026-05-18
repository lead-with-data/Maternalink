// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const isVercel = process.env.DEPLOY_PLATFORM === 'vercel' || process.env.VERCEL === '1';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  server: {
    host: '0.0.0.0',
    port: 10000
  },
  vite: {
    plugins: [tailwindcss()]
  },

  adapter: isVercel
    ? vercel()
    : node({
        mode: 'standalone'
      })
});