import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

// The iOS app reuses the web app's client code from .. (single source of truth).
// Server API routes (/api/lesson, /api/enrich) are replaced by an in-app fetch shim (src/api-shim.ts).
const here = path.dirname(fileURLToPath(import.meta.url));
const webApp = path.resolve(here, '..');
const local = (pkg: string) => path.resolve(here, 'node_modules', pkg);

export default defineConfig({
  base: '/',
  publicDir: 'public',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'copy-calis-route-html',
      closeBundle() {
        const indexHtml = path.resolve(here, 'dist/index.html');
        if (fs.existsSync(indexHtml)) {
          const calisDir = path.resolve(here, 'dist/calis');
          fs.mkdirSync(calisDir, { recursive: true });
          fs.copyFileSync(indexHtml, path.resolve(calisDir, 'index.html'));
        }
      },
    },
  ],
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${webApp}/` },
      { find: /^tailwindcss$/, replacement: local('tailwindcss') },
    ],
    dedupe: ['react', 'react-dom', 'lucide-react', 'zod'],
  },
  server: { fs: { allow: [here, webApp] } },
  build: { outDir: 'dist', emptyOutDir: true, target: 'safari15' },
});
