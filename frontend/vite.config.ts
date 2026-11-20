import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { shareMetadata } from './share-metadata';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    publicDir: '../assets',
    plugins: [
      react(),
      tailwindcss(),
      cloudflare({ configPath: '../backend/wrangler.jsonc' }),
      shareMetadata(env.VITE_PUBLIC_SITE_URL, env.VITE_PUBLIC_SOURCE_URL, mode === 'hosted'),
    ],
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              assetFileNames: (asset) => asset.names.includes('LICENSE') ? 'license.txt' : 'assets/[name]-[hash][extname]',
            },
          },
        },
      },
    },
    server: {
      open: false,
      port: 5173,
      strictPort: true,
    },
  };
});
