import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Warn when a chunk exceeds 500 kB (uncompressed)
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        // These packages are server-only — exclude from client bundle entirely.
        external: [
          '@google/genai',
          'firebase-admin',
          'express',
          'express-rate-limit',
          'helmet',
          'cors',
          'multer',
          'dotenv',
        ],
        output: {
          manualChunks(id: string) {
            // ── Vendor chunks ────────────────────────────────────────────
            // Luma.gl WebGL core engine
            if (
              id.includes('@luma.gl') ||
              id.includes('@deck.gl') ||
              id.includes('@math.gl') ||
              id.includes('@loaders.gl') ||
              id.includes('@probe.gl') ||
              id.includes('mjolnir.js') ||
              id.includes('@react-google-maps') ||
              id.includes('google-maps')
            ) {
              return 'vendor-maps';
            }
            // Recharts + d3 + redux/immer/decimal chart state internals
            if (
              id.includes('recharts') ||
              id.includes('d3-') ||
              id.includes('victory') ||
              id.includes('@reduxjs/toolkit') ||
              id.includes('react-redux') ||
              id.includes('reselect') ||
              id.includes('immer') ||
              id.includes('es-toolkit') ||
              id.includes('decimal.js-light')
            ) {
              return 'vendor-charts';
            }
            // Firebase client SDK (excluding standalone pure-JS regex engine re2js)
            if ((id.includes('firebase/') || id.includes('@firebase/')) && !id.includes('re2js')) {
              return 'vendor-firebase';
            }
            // Lucide React icon library
            if (id.includes('lucide-react') || id.includes('lucide')) {
              return 'vendor-icons';
            }
            // Motion / framer-motion animation library
            if (id.includes('motion') || id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            // React + ReactDOM — hot on first load, keep separate for caching
            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            // i18n translation stack
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // All other node_modules into a single vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    },
  };
});
