import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: '/bible-memory-app/',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: '성경 암송 수첩',
          short_name: '암송수첩',
          description: '성경 구절을 암송하고 학습하는 나만의 암송 수첩입니다.',
          theme_color: '#ecece4',
          background_color: '#f5f5f0',
          display: 'standalone',
          icons: [
            {
              src: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"%3E%3Crect width="512" height="512" fill="%23ecece4"/%3E%3Cpath d="M128 416V96c0-17.7 14.3-32 32-32h256v384H160c-17.7 0-32-14.3-32-32z" fill="none" stroke="%235A5A40" stroke-width="32"/%3E%3C/svg%3E',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: false,
    }
  };
});
