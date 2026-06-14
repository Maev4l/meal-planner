import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import packageJson from './package.json' with { type: 'json' };

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Get git commit hash at build time
const getGitCommitHash = () => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
};

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'favicon-48.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Meal Planner',
        short_name: 'MealPlanner',
        description: 'Plan your meals with your group',
        // Ardoise design palette: slate dark background, deep forest green theme
        theme_color: '#171b18',
        background_color: '#0d100e',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        // PNG icons for Android/iOS PWA install prompts (SVG not supported)
        icons: [
          { src: 'app-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Proxy /api/* to production backend during local development
      '/api': {
        target: 'https://meal-planner.isnan.eu',
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendors into separate chunks to reduce main bundle size.
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('aws-amplify')) {
              return 'aws-vendor';
            }
            // React Router is independent
            if (id.includes('react-router')) {
              return 'router';
            }
          }
        },
      },
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __GIT_COMMIT_HASH__: JSON.stringify(getGitCommitHash()),
  },
});
