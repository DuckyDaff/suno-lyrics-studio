import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    // Local API: run `node legacy/server.js` (nikud proxy) or `npx vercel dev`
    proxy: { '/api': 'http://localhost:3000' },
  },
  build: { target: 'es2022' },
});
