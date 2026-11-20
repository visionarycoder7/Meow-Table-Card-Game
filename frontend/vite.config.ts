import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { shareMetadata } from './share-metadata';

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    cloudflare({ configPath: '../backend/wrangler.jsonc' }),
    shareMetadata(loadEnv(mode, process.cwd()).VITE_PUBLIC_SITE_URL),
  ],
  server: {
    open: false,
    port: 5173,
    strictPort: true,
  },
}));
