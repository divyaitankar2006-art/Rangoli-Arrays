import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'serve' || process.env.VERCEL ? '/' : '/Rangoli-Arrays/',
}));
