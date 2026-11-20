import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { shareMetadata } from './share-metadata';

const backend = `http://127.0.0.1:${process.env.PORT ?? '3001'}`;

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    shareMetadata(loadEnv(mode, process.cwd()).VITE_PUBLIC_SITE_URL),
  ],
  server: {
    open: false,
    port: 5173,
    strictPort: true,
    proxy: {
      '/healthz': backend,
      '/socket.io': { target: backend, ws: true },
    },
  },
}));
