import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo1024.svg'],
      manifest: {
        name: 'Meal Planner',
        short_name: 'MealPlanner',
        description: 'Plan your meals with your group',
        theme_color: '#1976d2',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logo144.png',
            sizes: '144x144',
            type: 'image/png',
          },
          {
            src: 'logo192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'logo512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'logo512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
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
  },
  build: {
    rollupOptions: {
      output: {
        // Only split aws-amplify into a separate chunk since it's independent.
        // React and MUI must stay together to avoid circular dependencies
        // that cause "Cannot read properties of undefined (reading 'createContext')" at runtime.
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('aws-amplify')) {
              return 'aws-vendor';
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
